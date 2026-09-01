// Slot coordinates approved against `campfire-scene-v20.html` during
// design (docs/superpowers/specs/2026-08-31-campfire-character-scene-design.md).
// The 5-slot layout is the only one screenshotted and iterated on with
// Mati; 1-4 reuse those same coordinates by dropping outer-in from the
// center, so nothing here is an invented value, but the *reduction
// strategy itself* (which slots survive at each count) was not
// individually shown to him -- worth a quick visual sanity check during
// review.
const END_LEFT = { dx: -230, dy: 15, scale: 1.22, z: 3 };
const INNER_LEFT = { dx: -140, dy: 70, scale: 1.0, z: 2 };
const CENTER = { dx: 0, dy: 140, scale: 0.95, z: 1 };
const INNER_RIGHT = { dx: 140, dy: 70, scale: 1.0, z: 2 };
const END_RIGHT = { dx: 230, dy: 15, scale: 1.2, z: 3 };

const LAYOUTS = {
    1: [CENTER],
    2: [END_LEFT, END_RIGHT],
    3: [END_LEFT, CENTER, END_RIGHT],
    4: [END_LEFT, INNER_LEFT, INNER_RIGHT, END_RIGHT],
    5: [END_LEFT, INNER_LEFT, CENTER, INNER_RIGHT, END_RIGHT],
};

export function getCampfireLayout(count) {
    const layout = LAYOUTS[count];
    if (!layout) {
        throw new Error(`getCampfireLayout: count must be 1-5, got ${count}`);
    }
    return layout;
}
