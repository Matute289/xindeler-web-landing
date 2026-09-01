import { describe, it, expect } from 'vitest';
import { getCampfireLayout } from './campfireLayout';

describe('getCampfireLayout', () => {
    it('returns one entry per character, for every count from 1 to 5', () => {
        for (let count = 1; count <= 5; count++) {
            expect(getCampfireLayout(count)).toHaveLength(count);
        }
    });

    it('matches the approved 5-character layout exactly', () => {
        expect(getCampfireLayout(5)).toEqual([
            { dx: -230, dy: 15, scale: 1.22, z: 3 },
            { dx: -140, dy: 70, scale: 1.0, z: 2 },
            { dx: 0, dy: 140, scale: 0.95, z: 1 },
            { dx: 140, dy: 70, scale: 1.0, z: 2 },
            { dx: 230, dy: 15, scale: 1.2, z: 3 },
        ]);
    });

    it('drops the center slot for 4, keeping the two duos', () => {
        expect(getCampfireLayout(4)).toEqual([
            { dx: -230, dy: 15, scale: 1.22, z: 3 },
            { dx: -140, dy: 70, scale: 1.0, z: 2 },
            { dx: 140, dy: 70, scale: 1.0, z: 2 },
            { dx: 230, dy: 15, scale: 1.2, z: 3 },
        ]);
    });

    it('keeps just the two ends and the center for 3', () => {
        expect(getCampfireLayout(3)).toEqual([
            { dx: -230, dy: 15, scale: 1.22, z: 3 },
            { dx: 0, dy: 140, scale: 0.95, z: 1 },
            { dx: 230, dy: 15, scale: 1.2, z: 3 },
        ]);
    });

    it('keeps just the two ends for 2', () => {
        expect(getCampfireLayout(2)).toEqual([
            { dx: -230, dy: 15, scale: 1.22, z: 3 },
            { dx: 230, dy: 15, scale: 1.2, z: 3 },
        ]);
    });

    it('places a lone character in the center slot for 1', () => {
        expect(getCampfireLayout(1)).toEqual([
            { dx: 0, dy: 140, scale: 0.95, z: 1 },
        ]);
    });

    it('throws for a count outside 1-5', () => {
        expect(() => getCampfireLayout(0)).toThrow();
        expect(() => getCampfireLayout(6)).toThrow();
    });
});
