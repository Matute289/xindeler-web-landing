import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const WEB_API = '/api';
const ERROR_REDIRECT_DELAY_MS = 5000;

// Reached only via the emailed verification link — never linked from
// anywhere in the app itself. The visitor isn't going anywhere else in
// the app from here, so this is deliberately a dead end: one sentence,
// no logo, no card, no navigation. Anything other than a real, valid
// token (missing, malformed, expired, already used) bounces home after
// a few seconds rather than leaving a stranded page up.
export default function VerifyEmailPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Read and validate token at initialization — avoids synchronous setState in effect
    const [token] = useState(() => {
        const raw = searchParams.get('token');
        return (raw && /^[0-9a-fA-F]{64}$/.test(raw)) ? raw : null;
    });
    const [status, setStatus] = useState(() => token ? 'loading' : 'error');

    useEffect(() => {
        if (!token) return;
        // Strip token from URL so it can't leak into referrer headers or browser history
        window.history.replaceState(null, '', window.location.pathname);
        fetch(`${WEB_API}/account/verify-email?token=${encodeURIComponent(token)}`)
            .then(res => { setStatus(res.ok ? 'success' : 'error'); })
            .catch(() => { setStatus('error'); });
    }, [token]);

    useEffect(() => {
        if (status !== 'error') return;
        const timer = setTimeout(() => navigate('/'), ERROR_REDIRECT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [status, navigate]);

    const message = {
        loading: t('auth.verifyEmail.loading'),
        success: t('auth.verifyEmail.success'),
        error: t('auth.verifyEmail.error'),
    }[status];

    return (
        <div className="min-h-screen bg-x-dark flex items-center justify-center p-4">
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className={`text-sm text-center ${
                    status === 'success' ? 'text-green-300'
                    : status === 'error' ? 'text-red-300'
                    : 'text-gray-300'
                }`}
            >
                {message}
            </motion.p>
        </div>
    );
}
