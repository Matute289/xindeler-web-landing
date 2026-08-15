import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { netPrehash } from '../../lib/netPrehash';

const WEB_API = '/api';

function isValidUsername(u) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(u);
}

export default function UsernameTab({ session, onSessionInvalidated }) {
    const { t } = useTranslation();
    const [newUsername, setNewUsername] = useState('');
    const [usernameCheck, setUsernameCheck] = useState(null);
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Same debounced-check pattern as AuthModal's registration tab — never
    // blocks submission, the server still resolves the real race.
    useEffect(() => {
        if (!isValidUsername(newUsername)) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${WEB_API}/account/check-username?username=${encodeURIComponent(newUsername)}`,
                    { signal: controller.signal },
                );
                if (!res.ok) return;
                const body = await res.json();
                setUsernameCheck({ newUsername, available: body.available === true });
            } catch {
                // Cancelled by a later keystroke, or the network failed —
                // nothing to tell the typist in either case.
            }
        }, 450);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [newUsername]);

    const usernameStatus = (() => {
        if (!isValidUsername(newUsername)) return null;
        if (usernameCheck?.newUsername !== newUsername) {
            return { message: t('auth.usernameChecking'), tone: 'text-gray-500' };
        }
        return usernameCheck.available
            ? { message: t('auth.usernameAvailable'), tone: 'text-emerald-400' }
            : { message: t('auth.usernameTaken'), tone: 'text-red-400' };
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!isValidUsername(newUsername)) {
            setError(t('account.username.errorFormat'));
            return;
        }
        setLoading(true);
        try {
            const passwordPrehash = await netPrehash(password);
            const res = await fetch(`${WEB_API}/account/change-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_username: newUsername,
                    password_prehash: passwordPrehash,
                    ...(session.totp_enabled ? { code } : {}),
                }),
            });
            if (res.ok) {
                setSuccess(t('account.username.success'));
                setPassword('');
                setCode('');
                onSessionInvalidated();
                return;
            }
            let body = null;
            try { body = await res.json(); } catch { /* fall through to generic error */ }
            if (body?.code === 'USERNAME_UNAVAILABLE') setError(t('account.username.errorTaken'));
            else if (body?.code === 'USERNAME_RESERVED') setError(t('account.username.errorReserved'));
            else if (body?.code === 'USERNAME_CHANGE_COOLDOWN') setError(t('account.username.errorCooldown'));
            else if (body?.code === 'TOTP_INVALID_CODE') setError(t('account.username.errorInvalidCode'));
            else if (res.status === 401) setError(t('auth.errorInvalidLogin'));
            else setError(t('account.errorUnknown'));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-400">
                {t('account.username.current')} <span className="text-white font-cinzel">{session.username}</span>
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">
                        {t('account.username.newLabel')}
                    </label>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        autoComplete="username"
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors"
                    />
                    {usernameStatus && (
                        <p className={`text-xs ${usernameStatus.tone}`}>{usernameStatus.message}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">
                        {t('account.username.passwordLabel')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors"
                    />
                </div>
                {session.totp_enabled && (
                    <div className="flex flex-col gap-1">
                        <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">
                            {t('account.username.codeLabel')}
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            autoComplete="one-time-code"
                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors"
                        />
                    </div>
                )}
                {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">{error}</p>}
                {success && <p className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded px-3 py-2">{success}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                >
                    {loading ? t('account.username.submitting') : t('account.username.submitBtn')}
                </button>
            </form>
        </div>
    );
}
