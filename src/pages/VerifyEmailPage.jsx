import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Analytics from '../components/Analytics';

const AUTH_API = 'https://auth.xindeler.greenmountain.dev';

export default function VerifyEmailPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading | success | error

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token || !/^[0-9a-fA-F]{64}$/.test(token)) {
            setStatus('error');
            return;
        }
        fetch(`${AUTH_API}/verify-email?token=${encodeURIComponent(token)}`)
            .then(res => {
                if (res.ok) setStatus('success');
                else setStatus('error');
            })
            .catch(() => setStatus('network-error'));
    }, [searchParams]);

    const icon = status === 'success'
        ? <CheckCircle size={48} className="text-green-400" />
        : status === 'loading'
            ? <Loader2 size={48} className="text-x-gold animate-spin" />
            : <XCircle size={48} className="text-red-400" />;

    const message = status === 'success'
        ? t('auth.verifyEmail.success')
        : status === 'loading'
            ? t('auth.verifyEmail.loading')
            : status === 'network-error'
                ? t('auth.verifyEmail.errorNetwork')
                : t('auth.verifyEmail.errorInvalid');

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
                className="w-full max-w-sm bg-x-navy border border-white/10 rounded-lg p-8 flex flex-col items-center gap-6 text-center shadow-2xl shadow-black/50"
            >
                <h1 className="font-cinzel text-lg tracking-widest uppercase text-white">
                    {t('auth.verifyEmail.title')}
                </h1>
                {icon}
                <p className={`text-sm leading-relaxed ${
                    status === 'success' ? 'text-green-300'
                    : status === 'loading' ? 'text-gray-300'
                    : 'text-red-300'
                }`}>
                    {message}
                </p>
                <Link
                    to="/"
                    className="mt-2 px-6 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                    style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                >
                    {t('auth.verifyEmail.backHome')}
                </Link>
            </motion.div>
        </div>
    );
}
