import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import SecurityTab from '../components/account/SecurityTab';
import UsernameTab from '../components/account/UsernameTab';
import CharactersTab from '../components/account/CharactersTab';
import { useSession } from '../hooks/useSession';

export default function AccountPage() {
    const { t } = useTranslation();
    const { session, loading, refreshSession, setSession } = useSession();
    const [tab, setTab] = useState('security');
    const [authModal, setAuthModal] = useState(null);
    const [invalidatedReason, setInvalidatedReason] = useState(null); // null | 'revoked' | 'deleted'

    // Called after change-password / 2fa/disable / change-username /
    // delete-account, all of which revoke the session on success —
    // re-check so the page falls back to the logged-out state instead of
    // pretending the old session is still good. 'deleted' gets its own
    // copy: offering a "log in again" button after the account itself is
    // gone would be misleading.
    const handleSessionInvalidated = (reason = 'revoked') => {
        setInvalidatedReason(reason);
        refreshSession();
    };

    const handleTotpChanged = (enabled) => {
        setSession(current => (current ? { ...current, totp_enabled: enabled } : current));
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
                className={`w-full ${tab === 'characters' ? 'max-w-6xl' : 'max-w-lg'} bg-x-navy border border-white/10 rounded-lg shadow-2xl shadow-black/50 transition-[max-width] duration-300`}
            >
                {loading ? (
                    <p className="text-sm text-gray-400 text-center p-8">{t('account.loading')}</p>
                ) : !session ? (
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                        {invalidatedReason && (
                            <p className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 rounded px-3 py-2">
                                {t(invalidatedReason === 'deleted' ? 'account.accountDeletedNotice' : 'account.sessionRevokedNotice')}
                            </p>
                        )}
                        {invalidatedReason !== 'deleted' && (
                            <>
                                <p className="text-sm text-gray-400">{t('account.loginRequired')}</p>
                                <button
                                    type="button"
                                    onClick={() => setAuthModal('login')}
                                    className="px-6 py-2.5 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold/90 transition-colors"
                                    style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.35)' }}
                                >
                                    {t('account.loginRequiredBtn')}
                                </button>
                            </>
                        )}
                        <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                            {t('account.backHome')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="font-cinzel text-lg tracking-widest uppercase text-white text-center pt-8 pb-2">
                            {t('account.title')}
                        </h1>
                        <div className="flex border-b border-white/10 mt-4">
                            <button
                                onClick={() => setTab('security')}
                                className={`flex-1 py-3.5 font-cinzel text-xs tracking-widest uppercase transition-colors ${
                                    tab === 'security' ? 'text-x-gold border-b-2 border-x-gold' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {t('account.tabSecurity')}
                            </button>
                            <button
                                onClick={() => setTab('username')}
                                className={`flex-1 py-3.5 font-cinzel text-xs tracking-widest uppercase transition-colors ${
                                    tab === 'username' ? 'text-x-gold border-b-2 border-x-gold' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {t('account.tabUsername')}
                            </button>
                            <button
                                onClick={() => setTab('characters')}
                                className={`flex-1 py-3.5 font-cinzel text-xs tracking-widest uppercase transition-colors ${
                                    tab === 'characters' ? 'text-x-gold border-b-2 border-x-gold' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {t('account.tabCharacters')}
                            </button>
                        </div>
                        <div className="p-6">
                            {tab === 'security' && (
                                <SecurityTab
                                    session={session}
                                    onSessionInvalidated={handleSessionInvalidated}
                                    onTotpChanged={handleTotpChanged}
                                />
                            )}
                            {tab === 'username' && (
                                <UsernameTab session={session} onSessionInvalidated={handleSessionInvalidated} />
                            )}
                            {tab === 'characters' && <CharactersTab />}
                        </div>
                        <div className="pb-6 text-center">
                            <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                                {t('account.backHome')}
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
            {authModal && (
                <AuthModal
                    mode={authModal}
                    onClose={() => {
                        setAuthModal(null);
                        setInvalidatedReason(null);
                        refreshSession();
                    }}
                />
            )}
        </div>
    );
}
