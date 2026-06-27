import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { netPrehash } from '../lib/netPrehash';
import { Link } from 'react-router-dom';

const AUTH_API = 'https://auth.xindeler.greenmountain.dev';

function isValidUsername(u) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(u);
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
    const [tab, setTab] = useState(mode);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { setTab(mode); }, [mode]);
    useEffect(() => {
        setError(''); setSuccess(''); setPassword(''); setConfirm('');
    }, [tab]);

    const handleKey = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [handleKey]);

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
                else if (res.status === 401 || res.status === 403) setError(t('auth.errorInvalidLogin'));
                else setError(t('auth.errorUnknown'));
            }
        } catch {
            setError(t('auth.errorNetwork'));
        } finally {
            setLoading(false);
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

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setTab('register')}
                            className={`flex-1 py-3.5 font-cinzel text-xs tracking-widest uppercase transition-colors ${
                                tab === 'register' ? 'text-x-gold border-b-2 border-x-gold' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <UserPlus size={12} />{t('auth.register')}
                            </span>
                        </button>
                        <button
                            onClick={() => setTab('login')}
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
                                onClick={() => setTab(tab === 'register' ? 'login' : 'register')}
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
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
