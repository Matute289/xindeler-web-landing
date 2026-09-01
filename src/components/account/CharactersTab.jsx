import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, Loader2, RefreshCw } from 'lucide-react';
import CampfireScene from './CampfireScene';
import CharacterModal from './CharacterModal';

const WEB_API = '/api';

export default function CharactersTab() {
    const { t } = useTranslation();
    const [characters, setCharacters] = useState(null); // null = loading
    const [error, setError] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState(null);

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
        <>
            <CampfireScene characters={characters} onSelectCharacter={setSelectedCharacter} />
            {selectedCharacter && (
                <CharacterModal
                    character={selectedCharacter}
                    onClose={() => setSelectedCharacter(null)}
                    onRename={(characterId, newName) => {
                        handleRename(characterId, newName);
                        setSelectedCharacter((current) =>
                            current && current.character_id === characterId
                                ? { ...current, name: newName }
                                : current,
                        );
                    }}
                />
            )}
        </>
    );
}
