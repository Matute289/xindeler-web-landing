import { describe, expect, it } from 'vitest';
import { netPrehash } from './netPrehash';

// netPrehash is a hand-written JavaScript reimplementation of net_prehash()
// from the Rust crate xindeler-auth-common: FxHash64 for the salt, then
// Argon2i. The two must agree exactly, because the server only ever sees the
// prehash and compares it against a stored Argon2id hash of that value.
//
// If this drifts, every login and registration from the landing breaks at once,
// and it breaks *silently*: the server just answers INVALID_CREDENTIALS, which
// is indistinguishable from a wrong password. Nothing else in this repo would
// catch it.
//
// The vectors below are the same ones asserted on the Rust side by
// `network_prehash_remains_wire_compatible` in common/src/lib.rs. Do not
// "update" them to match new output — a change here means the wire format
// changed and every existing account would be locked out.
describe('netPrehash', () => {
    it('matches the Rust net_prehash() golden vector', async () => {
        await expect(netPrehash('hunter2')).resolves.toBe(
            '0d64a1f8c3bfc1cc94d8a00b13dfe1b7472b8a932163ee7b3475ad04d355e102',
        );
    });

    it('produces 64 lowercase hex characters', async () => {
        const prehash = await netPrehash('some-other-password');
        expect(prehash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic for the same password', async () => {
        const [first, second] = await Promise.all([
            netPrehash('repeatable'),
            netPrehash('repeatable'),
        ]);
        expect(first).toBe(second);
    });

    it('differs for different passwords', async () => {
        const [a, b] = await Promise.all([netPrehash('password-a'), netPrehash('password-b')]);
        expect(a).not.toBe(b);
    });

    // The salt derivation walks 8-byte chunks, then an optional 4-byte chunk,
    // then the remaining bytes one at a time, so lengths that straddle those
    // boundaries are where a port of FxHash64 is most likely to go wrong.
    it.each([
        ['a', 1],
        ['abcd', 4],
        ['abcde', 5],
        ['abcdefgh', 8],
        ['abcdefghi', 9],
        ['abcdefghijkl', 12],
        ['abcdefghijklm', 13],
    ])('handles %o without throwing (%i bytes)', async (password) => {
        await expect(netPrehash(password)).resolves.toMatch(/^[0-9a-f]{64}$/);
    });

    // Known, deliberate divergence from Rust, recorded rather than hidden.
    // hash-wasm refuses an empty password, while the Rust net_prehash("")
    // happily returns
    // 5329025117ead8676273b353c0c220407178a6f0df817dfa86207b05e61ff08b.
    //
    // Harmless in practice: the auth form validates the field before calling
    // this, so an empty password never reaches here. It only matters for an
    // account whose password was set to "" through a Rust client, which the
    // landing could then never log in — an edge case worth knowing about
    // rather than one worth papering over.
    it('rejects an empty password, unlike the Rust implementation', async () => {
        await expect(netPrehash('')).rejects.toThrow(/password must be specified/i);
    });

    it('handles non-ASCII passwords as UTF-8', async () => {
        await expect(netPrehash('contraseña-ñandú-€')).resolves.toMatch(/^[0-9a-f]{64}$/);
    });
});
