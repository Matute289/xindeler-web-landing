import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { netPrehash } from '../lib/netPrehash';
import Analytics from '../components/Analytics';

const AUTH_API = 'https://auth.xindeler.greenmountain.dev';

function PasswordInput({ label, value, onChange, placeholder, autoComplete }) {
    const [show, setShow] = useState(false);
    return (
        <div className="flex flex-col gap-1">
            <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Validate token format before even rendering the form
    const tokenValid = token && /^[0-9a-fA-F]{64}$/.test(token);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) { setError(t('auth.resetPassword.errorShort')); return; }
        if (password !== confirm) { setError(t('auth.resetPassword.errorMismatch')); return; }
        setLoading(true);
        try {
            const prehash = await netPrehash(password);
            const res = await fetch(`${AUTH_API}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: prehash }),
            });
            if (res.ok) {
                setSuccess(true);
                setPassword('');
                setConfirm('');
            } else if (res.status === 400 || res.status === 404) {
                setError(t('auth.resetPassword.errorInvalidToken'));
            } else {
                setError(t('auth.errorUnknown'));
            }
        } catch {
            setError(t('auth.resetPassword.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-x-dark flex flex-col items-center justify-center p-4">
            <Analytics />
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
                <h1 className="font-cinzel text-lg tracking-widest uppercase text-white text-center mb-6">
                    {t('auth.resetPassword.title')}
                </h1>

                {!tokenValid ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-sm text-red-300">{t('auth.resetPassword.noToken')}</p>
                        <Link
                            to="/forgot-password"
                            className="px-6 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {t('auth.resetPassword.forgotAgain')}
                        </Link>
                        <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                            {t('auth.resetPassword.backHome')}
                        </Link>
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <CheckCircle size={40} className="text-green-400" />
                        <p className="text-sm text-green-300 leading-relaxed">
                            {t('auth.resetPassword.success')}
                        </p>
                        <Link
                            to="/"
                            className="mt-2 px-6 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {t('auth.resetPassword.backHome')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <p className="text-sm text-gray-400 text-center leading-relaxed mb-1">
                            {t('auth.resetPassword.desc')}
                        </p>
                        <PasswordInput
                            label={t('auth.resetPassword.newPassword')}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={t('auth.passwordPlaceholder')}
                            autoComplete="new-password"
                        />
                        <PasswordInput
                            label={t('auth.resetPassword.confirmPassword')}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder={t('auth.confirmPasswordPlaceholder')}
                            autoComplete="new-password"
                        />
                        {error && (
                            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded px-3 py-2">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {loading ? t('auth.resetPassword.changing') : t('auth.resetPassword.submitBtn')}
                        </button>
                        <Link to="/" className="text-xs text-center text-gray-600 hover:text-gray-400 transition-colors">
                            {t('auth.resetPassword.backHome')}
                        </Link>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
