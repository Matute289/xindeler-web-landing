import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, MapPin, Pencil, Check, X, Loader2, RefreshCw } from 'lucide-react';
import { classColor } from '../../lib/classPresentation';

const WEB_API = '/api';

function LevelBadge({ level, color }) {
    return (
        <div
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-cinzel text-[11px] font-bold text-black"
            style={{
                background: `linear-gradient(160deg, ${color}, ${color}cc)`,
                boxShadow: `0 0 10px ${color}55`,
            }}
            title={level}
        >
            {level}
        </div>
    );
}

function CharacterCard({ character, classLabel, onRename, index }) {
    const { t } = useTranslation();
    const color = classColor(character.class);
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(character.name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [justRenamed, setJustRenamed] = useState(false);

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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative rounded-lg bg-black/30 border border-white/10 pl-4 pr-4 py-3.5 overflow-hidden transition-colors"
            style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
        >
            {!editing ? (
                <div className="flex items-center gap-3">
                    <LevelBadge level={character.level} color={color} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4
                                className="font-cinzel text-sm font-bold truncate"
                                style={{ color }}
                            >
                                {character.name}
                            </h4>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 shrink-0">
                                {classLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">
                                {character.location?.site || t('account.characters.locationUnknown')}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={startEdit}
                        aria-label={t('account.characters.renameBtn')}
                        className="shrink-0 p-1.5 rounded text-gray-500 hover:text-x-gold hover:bg-white/5 transition-colors"
                    >
                        <Pencil size={14} />
                    </button>
                </div>
            ) : (
                <form onSubmit={submitRename} className="flex flex-col gap-2">
                    <label className="font-cinzel text-[10px] tracking-widest uppercase text-gray-400">
                        {t('account.characters.renameLabel')}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            autoFocus
                            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-x-gold/50 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            aria-label={t('account.characters.renameSubmit')}
                            className="shrink-0 p-1.5 rounded bg-x-gold text-black hover:bg-x-gold/90 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={loading}
                            aria-label={t('account.characters.renameCancel')}
                            className="shrink-0 p-1.5 rounded border border-white/15 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                </form>
            )}
            <AnimatePresence>
                {justRenamed && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-400 mt-2"
                    >
                        {t('account.characters.renameSuccess')}
                    </motion.p>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function CharactersTab() {
    const { t } = useTranslation();
    const [characters, setCharacters] = useState(null); // null = loading
    const [error, setError] = useState(false);

    // Split like useSession's loadSession/refreshSession: the effect body
    // only ever fetches (initial state is already `null`/`false`), and the
    // retry button resets first — avoids a synchronous setState at the top
    // of an effect body (React 19 flags that as a cascading-render risk).
    const fetchCharacters = useCallback(() => {
        return fetch(`${WEB_API}/account/characters`)
            .then(res => (res.ok ? res.json() : Promise.reject()))
            .then(body => setCharacters(body.characters))
            .catch(() => setError(true));
    }, []);

    useEffect(() => { fetchCharacters(); }, [fetchCharacters]);

    const retry = () => {
        setCharacters(null);
        setError(false);
        fetchCharacters();
    };

    const handleRename = (characterId, newName) => {
        setCharacters(current =>
            current.map(c => (c.character_id === characterId ? { ...c, name: newName } : c)),
        );
    };

    if (characters === null && !error) {
        return (
            <div className="flex flex-col items-center gap-3 text-center py-10">
                <Loader2 size={22} className="text-x-gold animate-spin" />
                <p className="text-sm text-gray-400">{t('account.characters.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center gap-3 text-center py-10">
                <Swords size={24} className="text-gray-600" />
                <p className="text-sm text-gray-400 max-w-xs">{t('account.characters.errorLoad')}</p>
                <button
                    type="button"
                    onClick={retry}
                    className="flex items-center gap-1.5 mt-1 px-4 py-2 font-cinzel text-xs tracking-wider text-gray-300 border border-white/15 rounded hover:border-white/30 transition-colors"
                >
                    <RefreshCw size={12} />
                    {t('account.characters.retryBtn')}
                </button>
            </div>
        );
    }

    if (characters.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 text-center py-10">
                <Swords size={24} className="text-gray-600" />
                <p className="text-sm text-gray-400 max-w-xs">{t('account.characters.empty')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {characters.map((character, index) => (
                <CharacterCard
                    key={character.character_id}
                    character={character}
                    classLabel={t(`account.characters.classNames.${character.class}`, character.class)}
                    onRename={handleRename}
                    index={index}
                />
            ))}
        </div>
    );
}
