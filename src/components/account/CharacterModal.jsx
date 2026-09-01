import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, Loader2, MapPin } from 'lucide-react';
import { classColor } from '../../lib/classPresentation';

const WEB_API = '/api';

export default function CharacterModal({ character, onClose, onRename }) {
    const { t } = useTranslation();
    const color = classColor(character.class);
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(character.name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [portraitLoaded, setPortraitLoaded] = useState(false);
    const [justRenamed, setJustRenamed] = useState(false);

    const handleKey = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    const startEdit = () => {
        setValue(character.name);
        setError('');
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setError('');
    };

    const submitRename = async (e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) {
            setError(t('account.characters.errorEmptyName'));
            return;
        }
        if (trimmed === character.name) {
            setEditing(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${WEB_API}/account/characters/${character.character_id}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_alias: trimmed }),
            });
            if (res.ok) {
                onRename(character.character_id, trimmed);
                setEditing(false);
                setJustRenamed(true);
                setTimeout(() => setJustRenamed(false), 2500);
                return;
            }
            let body = null;
            try { body = await res.json(); } catch { /* fall through */ }
            setError(body?.message || t('account.errorUnknown'));
        } catch {
            setError(t('account.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-x-dark/75 p-6" onClick={onClose}>
            <div
                className="w-[300px] rounded-lg overflow-hidden border border-x-gold/25 shadow-2xl"
                style={{ background: 'linear-gradient(160deg, #14131f, #0d0d1a)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-[220px] relative flex items-end justify-center" style={{ background: 'linear-gradient(160deg, #2a2833, #1a1822)' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('account.characters.modal.close')}
                        className="absolute top-2.5 left-2.5 z-10 w-[26px] h-[26px] rounded border border-white/15 bg-black/40 text-gray-300 hover:text-white flex items-center justify-center"
                    >
                        <X size={13} />
                    </button>
                    <span className="absolute top-2.5 right-2.5 bg-black/55 border border-white/15 text-gray-400 text-[9px] uppercase tracking-wider px-2 py-1 rounded">
                        {t('account.characters.modal.portraitPlaceholder')}
                    </span>
                    <div className="w-[74px] h-[150px] mb-2 relative">
                        <div className="w-[34px] h-[34px] rounded-full mx-auto" style={{ background: `${color}cc` }} />
                        <div
                            className="w-[60px] h-[86px] mx-auto mt-1"
                            style={{ background: `linear-gradient(160deg, ${color}, ${color}88)`, clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
                        />
                    </div>
                    <img
                        src={`${WEB_API}/account/characters/${character.character_id}/portrait`}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${portraitLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setPortraitLoaded(true)}
                    />
                </div>
                <div className="p-4">
                    {!editing ? (
                        <div className="flex items-center gap-2">
                            <h3 className="font-cinzel text-lg text-x-gold-2 flex-1 truncate">{character.name}</h3>
                            <button
                                type="button"
                                onClick={startEdit}
                                aria-label={t('account.characters.renameBtn')}
                                className="w-[26px] h-[26px] rounded border border-white/15 text-gray-400 hover:text-x-gold flex items-center justify-center"
                            >
                                <Pencil size={13} />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submitRename} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                autoFocus
                                aria-label={t('account.characters.renameLabel')}
                                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-x-gold/50"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                aria-label={t('account.characters.renameSubmit')}
                                className="shrink-0 p-1.5 rounded bg-x-gold text-black disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={loading}
                                aria-label={t('account.characters.renameCancel')}
                                className="shrink-0 p-1.5 rounded border border-white/15 text-gray-400"
                            >
                                <X size={14} />
                            </button>
                        </form>
                    )}
                    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                    <AnimatePresence>
                        {justRenamed && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-emerald-400 mt-1"
                            >
                                {t('account.characters.renameSuccess')}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <p className="text-xs text-gray-500 mt-1 font-cinzel">{t('account.characters.modal.level', { level: character.level })}</p>
                    <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-300">
                        {character.race && (
                            <div><span className="text-gray-600 uppercase text-[10px] tracking-wide inline-block w-20">{t('account.characters.modal.race')}</span>{t(`account.characters.modal.raceNames.${character.race}`)}</div>
                        )}
                        <div><span className="text-gray-600 uppercase text-[10px] tracking-wide inline-block w-20">{t('account.characters.modal.class')}</span>{t(`account.characters.classNames.${character.class}`, character.class)}</div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-600 uppercase text-[10px] tracking-wide inline-block w-20">{t('account.characters.modal.location')}</span>
                            <MapPin size={11} className="shrink-0" />
                            {character.location?.site || t('account.characters.locationUnknown')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
