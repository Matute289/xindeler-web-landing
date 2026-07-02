import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { netPrehash } from '../lib/netPrehash';
import { Link } from 'react-router-dom';

const AUTH_API = 'https://auth.xindeler.com';

function isValidUsername(u) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(u);
}

function formatDeadline(deadline) {
    if (!deadline) return null;
    try {
        return new Date(deadline * 1000).toLocaleString();
    } catch {
        return null;
    }
}

function InputField({ label, hint, type, value, onChange, placeholder, autoComplete }) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    return (
        <div className="flex flex-col gap-1">
            <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">{label}</label>
            <div className="relative">
                <input
                    type={isPassword && show ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors pr-10"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        tabIndex={-1}
                    >
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}
            </div>
            {hint && <p className="text-xs text-gray-600">{hint}</p>}
        </div>
    );
}

export default function AuthModal({ mode, onClose }) {
    const { t } = useTranslation();
    // Initialize tab from mode — mode doesn't change while modal is open
    const [tab, setTab] = useState(mode);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Legacy account modal — shown when login returns 403 EMAIL_VERIFICATION_REQUIRED.
    // completionToken is a bearer credential: only ever attached as the Authorization
    // header on /account-email and /resend-verification, never logged or displayed.
    const [legacyModal, setLegacyModal] = useState(null); // { deadline, completionToken }
    const [legacyEmail, setLegacyEmail] = useState('');
    const [legacyEmailLoading, setLegacyEmailLoading] = useState(false);
    const [legacyEmailError, setLegacyEmailError] = useState('');
    const [legacyEmailSuccess, setLegacyEmailSuccess] = useState('');
    const [legacyResendLoading, setLegacyResendLoading] = useState(false);
    const [legacyResendError, setLegacyResendError] = useState('');
    const [legacyResendSuccess, setLegacyResendSuccess] = useState('');
    // Mirrors legacyModal.completionToken but, being a ref, is always up to date
    // inside in-flight async handlers (their closures otherwise keep whatever
    // state value was current when the request started). Used to detect and
    // discard stale responses if the modal is closed/reopened mid-request.
    const legacyTokenRef = useRef(null);

    // Escape key closes modal
    const handleKey = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    // Clear form fields when switching tabs — called explicitly by switchTab()
    const clearForm = () => {
        setError(''); setSuccess(''); setPassword(''); setConfirm('');
    };

    const switchTab = (newTab) => {
        setTab(newTab);
        clearForm();
    };

    const validate = () => {
        if (!isValidUsername(username)) { setError(t('auth.errorUsernameFormat')); return false; }
        if (password.length < 8) { setError(t('auth.errorPasswordShort')); return false; }
        if (tab === 'register' && password !== confirm) { setError(t('auth.errorPasswordMismatch')); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!validate()) return;
        setLoading(true);
        try {
            const prehash = await netPrehash(password);
            if (tab === 'register') {
                const res = await fetch(`${AUTH_API}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password: prehash, email: email || null }),
                });
                if (res.ok) { setSuccess(t('auth.registerSuccess')); setPassword(''); setConfirm(''); }
                else if (res.status === 409) setError(t('auth.errorUserExists'));
                else setError(t('auth.errorUnknown'));
            } else {
                const res = await fetch(`${AUTH_API}/generate_token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password: prehash }),
                });
                if (res.ok) { setSuccess(t('auth.loginSuccess')); setPassword(''); }
                else if (res.status === 403) {
                    // Only the specific EMAIL_VERIFICATION_REQUIRED code opens the legacy
                    // modal. Any other 403 (or a 403 with an unexpected/unparseable body)
                    // falls through to the exact same generic message as 401, so this
                    // branch never leaks more than the pre-existing invalid-login case did.
                    let body = null;
                    try { body = await res.json(); } catch { /* fall through to generic error */ }
                    if (body && body.code === 'EMAIL_VERIFICATION_REQUIRED') {
                        legacyTokenRef.current = body.completion_token;
                        setLegacyModal({ deadline: body.deadline, completionToken: body.completion_token });
                    } else {
                        setError(t('auth.errorInvalidLogin'));
                    }
                }
                else if (res.status === 401) setError(t('auth.errorInvalidLogin'));
                else setError(t('auth.errorUnknown'));
            }
        } catch {
            setError(t('auth.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const closeLegacyModal = () => {
        legacyTokenRef.current = null;
        setLegacyModal(null);
        setLegacyEmail('');
        setLegacyEmailLoading(false);
        setLegacyEmailError('');
        setLegacyEmailSuccess('');
        setLegacyResendLoading(false);
        setLegacyResendError('');
        setLegacyResendSuccess('');
    };

    // Maps the server's structured error `code` (see xindeler-auth's error.rs
    // public_fields()) to a user-facing message. INVALID_EMAIL covers both a
    // malformed address and an address already registered to another account —
    // the server deliberately returns the same code/message for both to avoid
    // leaking which case occurred (anti-enumeration), so the client can't and
    // shouldn't try to tell them apart either. Anything else not called out
    // here (e.g. RATE_LIMITED) falls back to the generic unknown-error copy.
    const legacyErrorMessage = (code) => {
        if (code === 'INVALID_TOKEN') return t('auth.legacyModal.errorInvalidToken');
        if (code === 'ACCOUNT_EXPIRED') return t('auth.legacyModal.errorAccountExpired');
        if (code === 'INVALID_EMAIL') return t('auth.legacyModal.errorInvalidEmail');
        return t('auth.errorUnknown');
    };

    const handleLegacyEmailSubmit = async (e) => {
        e.preventDefault();
        // Snapshot the token via the ref (not legacyModal state) so it's the
        // last value written when this request started, and re-read the ref
        // (not this closure's copy) after the await to detect a stale response.
        const requestToken = legacyTokenRef.current;
        if (!requestToken) return;
        setLegacyEmailError(''); setLegacyEmailSuccess('');
        if (!legacyEmail) { setLegacyEmailError(t('auth.legacyModal.errorEmailRequired')); return; }
        setLegacyEmailLoading(true);
        try {
            const res = await fetch(`${AUTH_API}/account-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${requestToken}`,
                },
                body: JSON.stringify({ email: legacyEmail }),
            });
            // The modal was closed (or closed and reopened for a new session)
            // while this request was in flight — discard the stale result.
            if (legacyTokenRef.current !== requestToken) return;
            if (res.ok) {
                setLegacyEmailSuccess(t('auth.legacyModal.emailSuccess'));
            } else {
                let body = null;
                try { body = await res.json(); } catch { /* fall through to generic error */ }
                setLegacyEmailError(legacyErrorMessage(body?.code));
            }
        } catch {
            if (legacyTokenRef.current === requestToken) setLegacyEmailError(t('auth.errorNetwork'));
        } finally {
            if (legacyTokenRef.current === requestToken) setLegacyEmailLoading(false);
        }
    };

    const handleLegacyResend = async () => {
        const requestToken = legacyTokenRef.current;
        if (!requestToken) return;
        setLegacyResendError(''); setLegacyResendSuccess('');
        setLegacyResendLoading(true);
        try {
            const res = await fetch(`${AUTH_API}/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${requestToken}`,
                },
                body: JSON.stringify({}),
            });
            if (legacyTokenRef.current !== requestToken) return;
            if (res.ok) {
                setLegacyResendSuccess(t('auth.legacyModal.resendSuccess'));
            } else {
                let body = null;
                try { body = await res.json(); } catch { /* fall through to generic error */ }
                setLegacyResendError(legacyErrorMessage(body?.code));
            }
        } catch {
            if (legacyTokenRef.current === requestToken) setLegacyResendError(t('auth.errorNetwork'));
        } finally {
            if (legacyTokenRef.current === requestToken) setLegacyResendLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-sm bg-x-navy border border-white/10 rounded-lg shadow-2xl shadow-black/60"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>

                    {legacyModal ? (
                        <div className="p-6 flex flex-col gap-4">
                            <h2 className="font-cinzel text-sm tracking-widest uppercase text-x-gold text-center">
                                {t('auth.legacyModal.title')}
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed text-center">
                                {t('auth.legacyModal.desc')}
                            </p>
                            {legacyModal.deadline && (
                                <p className="text-xs text-gray-500 text-center">
                                    {t('auth.legacyModal.deadlinePrefix')} {formatDeadline(legacyModal.deadline)}
                                </p>
                            )}

                            <form onSubmit={handleLegacyEmailSubmit} className="flex flex-col gap-3">
                                <InputField
                                    label={t('auth.email')}
                                    type="email"
                                    value={legacyEmail}
                                    onChange={e => setLegacyEmail(e.target.value)}
                                    placeholder={t('auth.emailPlaceholder')}
                                    autoComplete="email"
                                />
                                {legacyEmailError && (
                                    <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">
                                        {legacyEmailError}
                                    </p>
                                )}
                                {legacyEmailSuccess && (
                                    <p className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded px-3 py-2">
                                        {legacyEmailSuccess}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={legacyEmailLoading}
                                    className="w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                                >
                                    {legacyEmailLoading ? t('auth.legacyModal.emailSubmitting') : t('auth.legacyModal.emailSubmitBtn')}
                                </button>
                            </form>

                            <div className="flex flex-col gap-2">
                                {legacyResendError && (
                                    <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">
                                        {legacyResendError}
                                    </p>
                                )}
                                {legacyResendSuccess && (
                                    <p className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded px-3 py-2">
                                        {legacyResendSuccess}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleLegacyResend}
                                    disabled={legacyResendLoading}
                                    className="w-full py-2.5 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {legacyResendLoading ? t('auth.legacyModal.resendSubmitting') : t('auth.legacyModal.resendBtn')}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={closeLegacyModal}
                                className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-center"
                            >
                                {t('auth.legacyModal.back')}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex border-b border-white/10">
                                <button
                                    onClick={() => switchTab('register')}
                                    className={`flex-1 py-3.5 font-cinzel text-xs tracking-widest uppercase transition-colors ${
                                        tab === 'register' ? 'text-x-gold border-b-2 border-x-gold' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <UserPlus size={12} />{t('auth.register')}
                                    </span>
                                </button>
                                <button
                                    onClick={() => switchTab('login')}
                                    className={`flex-1 py-3.5 font-cinzel text-xs tracking-widest uppercase transition-colors ${
                                        tab === 'login' ? 'text-x-gold border-b-2 border-x-gold' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <LogIn size={12} />{t('auth.login')}
                                    </span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                                <InputField
                                    label={t('auth.username')}
                                    hint={t('auth.usernameHint')}
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder={t('auth.usernamePlaceholder')}
                                    autoComplete="username"
                                />
                                {tab === 'register' && (
                                    <InputField
                                        label={t('auth.email')}
                                        hint={t('auth.emailOptional')}
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t('auth.emailPlaceholder')}
                                        autoComplete="email"
                                    />
                                )}
                                <InputField
                                    label={t('auth.password')}
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={t('auth.passwordPlaceholder')}
                                    autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                                />
                                {tab === 'register' && (
                                    <InputField
                                        label={t('auth.confirmPassword')}
                                        type="password"
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        placeholder={t('auth.confirmPasswordPlaceholder')}
                                        autoComplete="new-password"
                                    />
                                )}

                                {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">{error}</p>}
                                {success && <p className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded px-3 py-2">{success}</p>}

                                {!success && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="mt-1 w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                                    >
                                        {loading
                                            ? (tab === 'register' ? t('auth.registering') : t('auth.loggingIn'))
                                            : (tab === 'register' ? t('auth.registerBtn') : t('auth.login'))
                                        }
                                    </button>
                                )}

                                <div className="flex flex-col items-center gap-1 text-xs text-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => switchTab(tab === 'register' ? 'login' : 'register')}
                                        className="hover:text-gray-400 transition-colors"
                                    >
                                        {tab === 'register' ? t('auth.switchToLogin') : t('auth.switchToRegister')}
                                    </button>
                                    {tab === 'login' && (
                                        <Link
                                            to="/forgot-password"
                                            onClick={onClose}
                                            className="hover:text-gray-400 transition-colors"
                                        >
                                            {t('auth.forgotPassword')}
                                        </Link>
                                    )}
                                </div>
                            </form>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
