// Visual identity per class, matching NH-79's exact wire values (see
// xindeler-new-horizon's `json_models::class_to_db_string` — PascalCase,
// no spaces except "BloodSlayer"). Genre convention (WoW, D&D character
// sheets) is one saturated, recognizable hue per class; these are Xindeler's
// own picks, not a reuse of any other game's palette.
export const CLASS_COLORS = {
    Adventurer: '#9a958a',
    Warrior: '#c9a876',
    Mage: '#5ec8e8',
    Cleric: '#f0ead6',
    Rogue: '#e6d268',
    Barbarian: '#c1502e',
    Sorcerer: '#a06bd0',
    Warlock: '#7b5aa6',
    Bard: '#d9789a',
    Paladin: '#f2c14e',
    Druid: '#6fae54',
    Ranger: '#4a9b8e',
    Monk: '#3ecf8e',
    Artificer: '#d98a3d',
    BloodSlayer: '#e8496a',
};

export function classColor(classKey) {
    return CLASS_COLORS[classKey] ?? CLASS_COLORS.Adventurer;
}
