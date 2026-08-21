import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { netPrehash } from '../../lib/netPrehash';

const WEB_API = '/api';
// A pending (unconfirmed) TOTP secret shouldn't sit valid indefinitely on
// screen — the server already re-generates a fresh one on every /2fa/enroll
// call (see xindeler-auth's totp.rs::enroll), so we just call it again on a
// timer while this screen is open and swap the displayed QR in place.
const QR_ROTATE_SECONDS = 30;

function Field({ label, value, onChange, type = 'text', autoComplete }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors"
            />
        </div>
    );
}

function ErrorBox({ children }) {
    if (!children) return null;
    return <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">{children}</p>;
}

// Maps the code/message xindeler-web-api forwards from xindeler-auth's TOTP
// endpoints to the right copy — same set of codes for enroll/confirm/
// disable/regenerate, so this is shared across every sub-flow below.
function totpErrorMessage(t, body, fallback) {
    const code = body?.code;
    if (code === 'TOTP_INVALID_CODE') return t('account.security.totp.errorInvalidCode');
    if (code === 'TOTP_ALREADY_ENROLLED') return t('account.security.totp.errorAlreadyEnrolled');
    if (code === 'TOTP_NOT_ENROLLED') return t('account.security.totp.errorNotEnrolled');
    if (code === 'ACCOUNT_2FA_LOCKED') return t('account.security.totp.errorLocked');
    if (code === 'TOTP_CHALLENGE_INVALID') return t('account.security.totp.errorChallengeInvalid');
    return fallback;
}

export default function SecurityTab({ session, onSessionInvalidated, onTotpChanged }) {
    const { t } = useTranslation();
    // 'main' | 'enroll' | 'confirm' | 'backupCodes' | 'disable' |
    // 'changePassword' | 'deleteConfirm'
    const [view, setView] = useState('main');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Enroll → confirm flow state
    const [enrollPassword, setEnrollPassword] = useState('');
    const [enrollment, setEnrollment] = useState(null); // { secretBase32, qrPngBase64 }
    const [confirmCode, setConfirmCode] = useState('');
    const [backupCodes, setBackupCodes] = useState(null);
    const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_ROTATE_SECONDS);

    // While the QR is on screen, request a fresh secret from the server
    // every QR_ROTATE_SECONDS and swap it in — an unconfirmed secret
    // shouldn't stay valid (and scannable) forever. `qrSecondsLeft` is
    // already QR_ROTATE_SECONDS on every path that leads into this view
    // (the initial useState default, and resetToMain()), so this effect
    // only ever needs to start the ticking, never reset the count itself.
    useEffect(() => {
        if (view !== 'confirm') return;
        const rotateQr = async () => {
            try {
                const passwordPrehash = await netPrehash(enrollPassword);
                const res = await fetch(`${WEB_API}/account/2fa/enroll`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password_prehash: passwordPrehash }),
                });
                if (res.ok) {
                    const body = await res.json();
                    setEnrollment({ secretBase32: body.secret_base32, qrPngBase64: body.qr_png_base64 });
                }
            } catch {
                // Network hiccup — leave the current QR up, next tick retries.
            }
        };
        const id = setInterval(() => {
            setQrSecondsLeft(s => {
                if (s <= 1) {
                    rotateQr();
                    return QR_ROTATE_SECONDS;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [view, enrollPassword]);

    // Disable flow state
    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');

    // Change-password flow state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changePasswordCode, setChangePasswordCode] = useState('');

    // Delete-account flow state
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteCode, setDeleteCode] = useState('');

    const resetToMain = () => {
        setView('main');
        setError('');
        setLoading(false);
        setEnrollPassword('');
        setEnrollment(null);
        setConfirmCode('');
        setBackupCodes(null);
        setQrSecondsLeft(QR_ROTATE_SECONDS);
        setDisablePassword('');
        setDisableCode('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePasswordCode('');
        setDeletePassword('');
        setDeleteCode('');
    };

    const handleEnrollSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const passwordPrehash = await netPrehash(enrollPassword);
            const res = await fetch(`${WEB_API}/account/2fa/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password_prehash: passwordPrehash }),
            });
            if (res.ok) {
                const body = await res.json();
                setEnrollment({ secretBase32: body.secret_base32, qrPngBase64: body.qr_png_base64 });
                setView('confirm');
                return;
            }
            let body = null;
            try { body = await res.json(); } catch { /* fall through to generic error */ }
            if (res.status === 401) setError(t('auth.errorInvalidLogin'));
            else setError(totpErrorMessage(t, body, t('account.errorUnknown')));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const passwordPrehash = await netPrehash(enrollPassword);
            const res = await fetch(`${WEB_API}/account/2fa/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password_prehash: passwordPrehash, code: confirmCode }),
            });
            if (res.ok) {
                const body = await res.json();
                setBackupCodes(body.backup_codes);
                setView('backupCodes');
                onTotpChanged(true);
                return;
            }
            let body = null;
            try { body = await res.json(); } catch { /* fall through to generic error */ }
            setError(totpErrorMessage(t, body, t('account.errorUnknown')));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const handleDisableSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const passwordPrehash = await netPrehash(disablePassword);
            const res = await fetch(`${WEB_API}/account/2fa/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password_prehash: passwordPrehash, code: disableCode }),
            });
            if (res.ok) {
                onSessionInvalidated();
                return;
            }
            let body = null;
            try { body = await res.json(); } catch { /* fall through to generic error */ }
            if (res.status === 401) setError(t('auth.errorInvalidLogin'));
            else setError(totpErrorMessage(t, body, t('account.errorUnknown')));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 8) {
            setError(t('account.security.changePassword.errorShort'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('account.security.changePassword.errorMismatch'));
            return;
        }
        setLoading(true);
        try {
            const currentPasswordPrehash = await netPrehash(currentPassword);
            const newPasswordPrehash = await netPrehash(newPassword);
            const res = await fetch(`${WEB_API}/account/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password_prehash: currentPasswordPrehash,
                    new_password_prehash: newPasswordPrehash,
                }),
            });
            if (res.ok) {
                onSessionInvalidated();
                return;
            }
            if (res.status === 401) setError(t('auth.errorInvalidLogin'));
            else setError(t('account.errorUnknown'));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const passwordPrehash = await netPrehash(deletePassword);
            const res = await fetch(`${WEB_API}/account/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password_prehash: passwordPrehash,
                    ...(session.totp_enabled ? { code: deleteCode } : {}),
                }),
            });
            if (res.ok) {
                onSessionInvalidated('deleted');
                return;
            }
            let body = null;
            try { body = await res.json(); } catch { /* fall through to generic error */ }
            if (res.status === 401) setError(t('auth.errorInvalidLogin'));
            else setError(totpErrorMessage(t, body, t('account.errorUnknown')));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    if (view === 'enroll') {
        return (
            <form onSubmit={handleEnrollSubmit} className="flex flex-col gap-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-x-gold">
                    {t('account.security.totp.enrollTitle')}
                </h3>
                <p className="text-sm text-gray-400">{t('account.security.totp.enrollIntro')}</p>
                <Field
                    label={t('account.security.totp.enrollPasswordLabel')}
                    type="password"
                    value={enrollPassword}
                    onChange={e => setEnrollPassword(e.target.value)}
                    autoComplete="current-password"
                />
                <ErrorBox>{error}</ErrorBox>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('account.security.totp.enrollLoading') : t('account.security.totp.enrollNextBtn')}
                    </button>
                    <button
                        type="button"
                        onClick={resetToMain}
                        className="py-2.5 px-4 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                    >
                        {t('account.security.totp.cancelBtn')}
                    </button>
                </div>
            </form>
        );
    }

    if (view === 'confirm' && enrollment) {
        return (
            <form onSubmit={handleConfirmSubmit} className="flex flex-col gap-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-x-gold">
                    {t('account.security.totp.confirmTitle')}
                </h3>
                <p className="text-sm text-gray-400">{t('account.security.totp.enrollDesc')}</p>
                <div className="self-center flex flex-col items-center gap-2">
                    <img
                        src={`data:image/png;base64,${enrollment.qrPngBase64}`}
                        alt="QR"
                        className="w-40 h-40 bg-white rounded p-2"
                    />
                    <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-x-gold transition-[width] duration-1000 ease-linear"
                            style={{ width: `${(qrSecondsLeft / QR_ROTATE_SECONDS) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        {t('account.security.totp.qrRotatesIn', { seconds: qrSecondsLeft })}
                    </p>
                </div>
                <p className="text-xs text-gray-500 text-center break-all">
                    {t('account.security.totp.enrollManualKey')} {enrollment.secretBase32}
                </p>
                <p className="text-sm text-gray-400">{t('account.security.totp.confirmDesc')}</p>
                <Field
                    label={t('account.security.totp.confirmCodePlaceholder')}
                    value={confirmCode}
                    onChange={e => setConfirmCode(e.target.value)}
                    autoComplete="one-time-code"
                />
                <ErrorBox>{error}</ErrorBox>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('account.security.totp.confirmLoading') : t('account.security.totp.confirmBtn')}
                    </button>
                    <button
                        type="button"
                        onClick={resetToMain}
                        className="py-2.5 px-4 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                    >
                        {t('account.security.totp.cancelBtn')}
                    </button>
                </div>
            </form>
        );
    }

    if (view === 'backupCodes' && backupCodes) {
        return (
            <div className="flex flex-col gap-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-x-gold">
                    {t('account.security.totp.backupCodesTitle')}
                </h3>
                <p className="text-sm text-gray-400">{t('account.security.totp.backupCodesDesc')}</p>
                <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-white bg-black/40 border border-white/10 rounded p-4">
                    {backupCodes.map(code => <li key={code}>{code}</li>)}
                </ul>
                <button
                    type="button"
                    onClick={resetToMain}
                    className="w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                >
                    {t('account.security.totp.backupCodesDone')}
                </button>
            </div>
        );
    }

    if (view === 'disable') {
        return (
            <form onSubmit={handleDisableSubmit} className="flex flex-col gap-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-x-gold">
                    {t('account.security.totp.disableTitle')}
                </h3>
                <p className="text-sm text-gray-400">{t('account.security.totp.disableDesc')}</p>
                <Field
                    label={t('account.security.totp.disablePasswordLabel')}
                    type="password"
                    value={disablePassword}
                    onChange={e => setDisablePassword(e.target.value)}
                    autoComplete="current-password"
                />
                <Field
                    label={t('account.security.totp.disableCodeLabel')}
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value)}
                    autoComplete="one-time-code"
                />
                <ErrorBox>{error}</ErrorBox>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('account.security.totp.disableLoading') : t('account.security.totp.disableConfirmBtn')}
                    </button>
                    <button
                        type="button"
                        onClick={resetToMain}
                        className="py-2.5 px-4 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                    >
                        {t('account.security.totp.cancelBtn')}
                    </button>
                </div>
            </form>
        );
    }

    if (view === 'changePassword') {
        return (
            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-x-gold">
                    {t('account.security.changePassword.title')}
                </h3>
                <Field
                    label={t('account.security.changePassword.currentLabel')}
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                />
                <Field
                    label={t('account.security.changePassword.newLabel')}
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                />
                <Field
                    label={t('account.security.changePassword.confirmLabel')}
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                />
                {session.totp_enabled && (
                    <Field
                        label={t('account.security.changePassword.codeLabel')}
                        value={changePasswordCode}
                        onChange={e => setChangePasswordCode(e.target.value)}
                        autoComplete="one-time-code"
                    />
                )}
                <ErrorBox>{error}</ErrorBox>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('account.security.changePassword.submitting') : t('account.security.changePassword.submitBtn')}
                    </button>
                    <button
                        type="button"
                        onClick={resetToMain}
                        className="py-2.5 px-4 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                    >
                        {t('account.security.totp.cancelBtn')}
                    </button>
                </div>
            </form>
        );
    }

    if (view === 'deleteConfirm') {
        return (
            <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-red-400">
                    {t('account.security.deleteAccount.confirmTitle')}
                </h3>
                <p className="text-sm text-gray-400">{t('account.security.deleteAccount.confirmDesc')}</p>
                <Field
                    label={t('account.security.deleteAccount.passwordLabel')}
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                />
                {session.totp_enabled && (
                    <Field
                        label={t('account.security.deleteAccount.codeLabel')}
                        value={deleteCode}
                        onChange={e => setDeleteCode(e.target.value)}
                        autoComplete="one-time-code"
                    />
                )}
                <ErrorBox>{error}</ErrorBox>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 font-cinzel text-xs tracking-wider text-white bg-red-700 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('account.security.deleteAccount.submitting') : t('account.security.deleteAccount.confirmBtn')}
                    </button>
                    <button
                        type="button"
                        onClick={resetToMain}
                        className="py-2.5 px-4 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                    >
                        {t('account.security.deleteAccount.cancelBtn')}
                    </button>
                </div>
            </form>
        );
    }

    // 'main'
    const statusLabel = session.totp_enabled
        ? t('account.security.totp.statusOn')
        : t('account.security.totp.statusOff');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    {session.totp_enabled
                        ? <ShieldCheck size={16} className="text-emerald-400" />
                        : <ShieldOff size={16} className="text-gray-500" />}
                    <h3 className="font-cinzel text-sm tracking-widest uppercase text-white">
                        {t('account.security.totp.title')}
                    </h3>
                </div>
                <p className="text-sm text-gray-400">{t('account.security.totp.desc')}</p>
                <p className="text-xs text-gray-500">{statusLabel}</p>
                <button
                    type="button"
                    onClick={() => setView(session.totp_enabled ? 'disable' : 'enroll')}
                    className="self-start py-2 px-4 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                >
                    {session.totp_enabled ? t('account.security.totp.disableBtn') : t('account.security.totp.enableBtn')}
                </button>
            </div>

            <div className="flex flex-col gap-3 border border-white/10 rounded-lg p-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-white">
                    {t('account.security.changePassword.title')}
                </h3>
                <button
                    type="button"
                    onClick={() => setView('changePassword')}
                    className="self-start py-2 px-4 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                >
                    {t('account.security.changePassword.title')}
                </button>
            </div>

            <div className="flex flex-col gap-3 border border-red-900/30 rounded-lg p-4">
                <h3 className="font-cinzel text-sm tracking-widest uppercase text-red-400">
                    {t('account.security.deleteAccount.title')}
                </h3>
                <p className="text-sm text-gray-400">{t('account.security.deleteAccount.desc')}</p>
                <button
                    type="button"
                    onClick={() => setView('deleteConfirm')}
                    className="self-start py-2 px-4 font-cinzel text-xs tracking-wider text-red-400 border border-red-500/40 rounded hover:bg-red-900/20 transition-colors"
                >
                    {t('account.security.deleteAccount.openBtn')}
                </button>
            </div>
        </div>
    );
}
