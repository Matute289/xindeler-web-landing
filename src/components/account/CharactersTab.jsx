import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';

// Placeholder — 006-cuenta-jugador-personajes.md is blocked on a
// read-endpoint that doesn't exist in any repo yet (see NH-79 in
// xindeler-new-horizon's backlog). Renders once that endpoint ships;
// nothing to wire up here until then.
export default function CharactersTab() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center gap-3 text-center py-10">
            <Swords size={24} className="text-gray-600" />
            <p className="text-sm text-gray-400 max-w-xs">{t('account.characters.comingSoon')}</p>
        </div>
    );
}
