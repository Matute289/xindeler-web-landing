import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const AUTH_API = 'https://auth.xindeler.com';
const WEB_API = '/api';

function isValidUsername(u) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(u);
}

function parseHash() {
    const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(raw);
    return {
        token: params.get('token'),
        challengeId: params.get('challenge_id'),
        pendingToken: params.get('pending_token'),
        suggestedUsername: params.get('suggested_username'),
        errorCode: params.get('error'),
    };
}

// xindeler-auth's OAuth error catalog (error.rs) plus the two new codes from
// /oauth/confirm-registration — anything not listed here falls back to the
// generic message rather than leaking a raw server code to the player.
function mapErrorCode(code, t) {
    switch (code) {
        case 'OAUTH_PROVIDER_ERROR': return t('auth.oauthCallback.errorProvider');
        case 'OAUTH_EMAIL_NOT_VERIFIED': return t('auth.oauthCallback.errorEmailNotVerified');
        case 'OAUTH_ACCOUNT_HAS_2FA': return t('auth.oauthCallback.errorAccountHas2fa');
        case 'OAUTH_PENDING_TOKEN_INVALID': return t('auth.oauthCallback.errorPendingExpired');
        case 'USERNAME_UNAVAILABLE': return t('auth.oauthCallback.errorUsernameTaken');
        case 'USERNAME_RESERVED': return t('auth.oauthCallback.errorUsernameReserved');
        case 'RATE_LIMITED': return t('auth.errorRateLimited');
        default: return t('auth.oauthCallback.errorGeneric');
    }
}

// Reached only via the redirect at the end of xindeler-auth's OAuth flow —
// the fragment (never sent to any server) carries one of four shapes:
// #token=... (already-linked account, no 2FA), #challenge_id=...
// (already-linked, 2FA confirmed), #pending_token=...&suggested_username=...
// (brand-new account, review before creating it), or #error=<code>.
export default function OAuthCallbackPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Read once at init — avoids a synchronous setState-in-effect, same
    // reasoning as VerifyEmailPage's token read.
    const [parsed] = useState(parseHash);
    useEffect(() => {
        // Strip the fragment so a reload/back-nav can't replay a single-use
        // token, same intent as VerifyEmailPage/ResetPasswordPage stripping
        // their query-string tokens.
        if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    }, []);

    const [status, setStatus] = useState(() => {
        if (parsed.pendingToken) return 'review';
        if (parsed.challengeId) return 'totp';
        if (parsed.token) return 'exchanging';
        return 'error';
    });
    const [errorMessage, setErrorMessage] = useState(() =>
        status === 'error' ? mapErrorCode(parsed.errorCode, t) : '',
    );

    const [username, setUsername] = useState(parsed.suggestedUsername || '');
    const [usernameCheck, setUsernameCheck] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const [totpCode, setTotpCode] = useState('');
    const [totpLoading, setTotpLoading] = useState(false);
    const [totpError, setTotpError] = useState('');

    // Shared by the direct-token case (fired once below) and the
    // post-confirm-registration case (called from handleReviewSubmit).
    const exchangeToken = useCallback((token) => {
        return fetch(`${WEB_API}/session/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then(res => {
                if (res.ok) setStatus('success');
                else {
                    setErrorMessage(t('auth.oauthCallback.errorGeneric'));
                    setStatus('error');
                }
            })
            .catch(() => {
                setErrorMessage(t('auth.oauthCallback.errorGeneric'));
                setStatus('error');
            });
    }, [t]);

    // A raw AuthToken is single-use server-side — if this effect re-fires
    // (e.g. `t`'s identity changing re-creates `exchangeToken`), retrying
    // the exchange would hit an already-consumed token and stomp a real
    // 'success' with a spurious 'error'. This ref makes the direct-token
    // exchange fire at most once no matter how many times the effect runs.
    const exchangedRef = useRef(false);
    useEffect(() => {
        if (parsed.token && !exchangedRef.current) {
            exchangedRef.current = true;
            exchangeToken(parsed.token);
        }
    }, [parsed.token, exchangeToken]);

    useEffect(() => {
        if (status !== 'success') return;
        const timer = setTimeout(() => navigate('/account'), 1000);
        return () => clearTimeout(timer);
    }, [status, navigate]);

    // Live availability check while reviewing the suggested username —
    // mirrors AuthModal's register-tab check exactly (debounce + abort,
    // never blocks submission, server has the final say).
    useEffect(() => {
        if (status !== 'review' || !isValidUsername(username)) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${AUTH_API}/check-username?username=${encodeURIComponent(username)}`,
                    { signal: controller.signal },
                );
                if (!res.ok) return;
                const body = await res.json();
                setUsernameCheck({ username, available: body.available === true });
            } catch {
                // Cancelled by a later keystroke, or the network failed —
                // nothing to tell the typist in either case.
            }
        }, 450);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [username, status]);

    const usernameFieldStatus = (() => {
        if (status !== 'review' || !isValidUsername(username)) return null;
        if (usernameCheck?.username !== username) {
            return { message: t('auth.usernameChecking'), tone: 'text-gray-500' };
        }
        return usernameCheck.available
            ? { message: t('auth.usernameAvailable'), tone: 'text-emerald-400' }
            : { message: t('auth.usernameTaken'), tone: 'text-red-400' };
    })();

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError('');
        if (!isValidUsername(username)) { setReviewError(t('auth.errorUsernameFormat')); return; }
        setReviewLoading(true);
        try {
            const res = await fetch(`${AUTH_API}/oauth/confirm-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pending_token: parsed.pendingToken, username }),
            });
            if (res.ok) {
                const body = await res.json();
                await exchangeToken(body.token);
            } else {
                let body = null;
                try { body = await res.json(); } catch { /* fall through to generic error */ }
                setReviewError(mapErrorCode(body?.code, t));
            }
        } catch {
            setReviewError(t('auth.errorNetwork'));
        } finally {
            setReviewLoading(false);
        }
    };

    const handleTotpSubmit = async (e) => {
        e.preventDefault();
        setTotpError('');
        setTotpLoading(true);
        try {
            const res = await fetch(`${WEB_API}/session/login/2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challenge_id: parsed.challengeId, code: totpCode }),
            });
            if (res.ok) {
                setStatus('success');
            } else {
                let body = null;
                try { body = await res.json(); } catch { /* fall through to generic error */ }
                if (body?.code === 'TOTP_INVALID_CODE') setTotpError(t('auth.totpErrorInvalidCode'));
                else if (body?.code === 'TOTP_CHALLENGE_INVALID') setTotpError(t('auth.totpErrorChallengeExpired'));
                else if (body?.code === 'ACCOUNT_2FA_LOCKED') setTotpError(t('auth.totpErrorLocked'));
                else setTotpError(t('auth.errorUnknown'));
            }
        } catch {
            setTotpError(t('auth.errorNetwork'));
        } finally {
            setTotpLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-x-dark flex flex-col items-center justify-center p-4">
            <Link
                to="/"
                className="font-cinzel-dec text-2xl font-bold text-white hover:text-x-gold transition-colors mb-12"
                style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
            >
                XINDELER
            </Link>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm bg-x-navy border border-white/10 rounded-lg p-8 shadow-2xl shadow-black/50"
            >
                {status === 'exchanging' && (
                    <p className="text-sm text-gray-300 text-center">{t('auth.oauthCallback.loading')}</p>
                )}

                {status === 'success' && (
                    <p className="text-sm text-green-300 text-center">{t('auth.loginSuccess')}</p>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-sm text-red-300 leading-relaxed">{errorMessage}</p>
                        <Link
                            to="/"
                            className="px-6 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {t('auth.oauthCallback.backHome')}
                        </Link>
                    </div>
                )}

                {status === 'totp' && (
                    <form onSubmit={handleTotpSubmit} className="flex flex-col gap-4">
                        <h1 className="font-cinzel text-sm tracking-widest uppercase text-x-gold text-center">
                            {t('auth.oauthCallback.totpTitle')}
                        </h1>
                        <p className="text-sm text-gray-400 leading-relaxed text-center">
                            {t('auth.oauthCallback.totpDesc')}
                        </p>
                        <div className="flex flex-col gap-1">
                            <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">
                                {t('auth.totpCodePlaceholder')}
                            </label>
                            <input
                                type="text"
                                value={totpCode}
                                onChange={e => setTotpCode(e.target.value)}
                                placeholder={t('auth.totpCodePlaceholder')}
                                autoComplete="one-time-code"
                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors"
                            />
                        </div>
                        {totpError && (
                            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">
                                {totpError}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={totpLoading}
                            className="w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {totpLoading ? t('auth.totpVerifying') : t('auth.totpSubmitBtn')}
                        </button>
                    </form>
                )}

                {status === 'review' && (
                    <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                        <h1 className="font-cinzel text-sm tracking-widest uppercase text-x-gold text-center">
                            {t('auth.oauthCallback.reviewTitle')}
                        </h1>
                        <p className="text-sm text-gray-400 leading-relaxed text-center">
                            {t('auth.oauthCallback.reviewDesc')}
                        </p>
                        <div className="flex flex-col gap-1">
                            <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">
                                {t('auth.oauthCallback.usernameLabel')}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoComplete="username"
                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors"
                            />
                            {usernameFieldStatus && (
                                <p className={`text-xs ${usernameFieldStatus.tone}`}>{usernameFieldStatus.message}</p>
                            )}
                        </div>
                        {reviewError && (
                            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">
                                {reviewError}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={reviewLoading}
                            className="w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {reviewLoading ? t('auth.oauthCallback.confirming') : t('auth.oauthCallback.confirmBtn')}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
