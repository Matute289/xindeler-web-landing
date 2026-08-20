import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CookieConsent({ consent, onAccept, onDecline }) {
    const { t } = useTranslation();

    if (consent !== null) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-x-navy border-t border-white/10 shadow-2xl shadow-black/50"
        >
            <div className="container mx-auto max-w-6xl px-4 py-5 flex flex-col sm:flex-row items-center gap-4">
                <p className="text-sm text-gray-300 leading-relaxed flex-1 text-center sm:text-left">
                    {t('cookieConsent.text')}{' '}
                    <Link to="/privacy" className="text-x-gold hover:underline">
                        {t('legal.privacy.title')}
                    </Link>
                    .
                </p>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={onDecline}
                        className="px-5 py-2.5 font-cinzel text-xs tracking-wider text-gray-300 border border-white/15 rounded hover:border-white/30 transition-colors"
                    >
                        {t('cookieConsent.declineBtn')}
                    </button>
                    <button
                        onClick={onAccept}
                        className="px-5 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                        style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                    >
                        {t('cookieConsent.acceptBtn')}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
