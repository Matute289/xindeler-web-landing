import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';

const AUTH_API = 'https://auth.xindeler.com';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await fetch(`${AUTH_API}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            // Always show success to prevent email enumeration
            setDone(true);
        } catch {
            setError(t('auth.forgotPasswordPage.errorNetwork'));
        } finally {
            setLoading(false);
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
                <h1 className="font-cinzel text-lg tracking-widest uppercase text-white text-center mb-2">
                    {t('auth.forgotPasswordPage.title')}
                </h1>

                {done ? (
                    <div className="flex flex-col items-center gap-4 mt-6 text-center">
                        <CheckCircle size={40} className="text-green-400" />
                        <p className="text-sm text-green-300 leading-relaxed">
                            {t('auth.forgotPasswordPage.success')}
                        </p>
                        <Link
                            to="/"
                            className="mt-2 px-6 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                        >
                            {t('auth.forgotPasswordPage.backHome')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
                        <p className="text-sm text-gray-400 text-center leading-relaxed mb-1">
                            {t('auth.forgotPasswordPage.desc')}
                        </p>
                        <div className="flex flex-col gap-1">
                            <label className="font-cinzel text-xs tracking-widest uppercase text-gray-400">
                                {t('auth.forgotPasswordPage.emailLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={t('auth.emailPlaceholder')}
                                    autoComplete="email"
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-x-gold/50 transition-colors pl-9"
                                />
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>
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
                            {loading ? t('auth.forgotPasswordPage.sending') : t('auth.forgotPasswordPage.submitBtn')}
                        </button>
                        <Link
                            to="/"
                            className="text-xs text-center text-gray-600 hover:text-gray-400 transition-colors"
                        >
                            {t('auth.forgotPasswordPage.backHome')}
                        </Link>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
