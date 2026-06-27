// Client-side equivalent of the Rust net_prehash() function in xindeler-auth-common.
// Produces the exact same 64-char hex string that the game client sends.
//
// Algorithm:
//   1. FxHash64(password) → u64 salt (matches fxhash 0.2.1 / FxHasher64::hash for str)
//   2. Argon2i(password_bytes, salt_le_bytes, time=3, mem=4096KB, len=32) → 32-byte hash
//   3. hex-encode → 64 lowercase hex chars
//
// Verified against Rust test vectors:
//   net_prehash("hunter2") === "0d64a1f8c3bfc1cc94d8a00b13dfe1b7472b8a932163ee7b3475ad04d355e102"
import { argon2i } from 'hash-wasm';

const FX_K = 0x517cc1b727220a95n;

// Matches fxhash 0.2.1 write64() + FxHasher64.write_u8() exactly.
// str::Hash calls write(bytes) then write_u8(0xFF).
// write64 processes: 8-byte chunks (LE u64), optional 4-byte chunk (LE u32), then byte-by-byte.
function fxHash64(str) {
    let hash = 0n;
    function hashWord(val) {
        const r = BigInt.asUintN(64, (hash << 5n) | (hash >> 59n));
        hash = BigInt.asUintN(64, (r ^ val) * FX_K);
    }
    const bytes = new TextEncoder().encode(str);
    let i = 0;
    while (i + 8 <= bytes.length) {
        let val = 0n;
        for (let j = 0; j < 8; j++) val |= BigInt(bytes[i + j]) << BigInt(8 * j);
        hashWord(val);
        i += 8;
    }
    if (i + 4 <= bytes.length) {
        let val = 0n;
        for (let j = 0; j < 4; j++) val |= BigInt(bytes[i + j]) << BigInt(8 * j);
        hashWord(val);
        i += 4;
    }
    while (i < bytes.length) {
        hashWord(BigInt(bytes[i++]));
    }
    hashWord(0xFFn);
    return hash;
}

function u64ToLeBytes(val) {
    const out = new Uint8Array(8);
    let v = val;
    for (let i = 0; i < 8; i++) { out[i] = Number(v & 0xFFn); v >>= 8n; }
    return out;
}

export async function netPrehash(password) {
    const salt = u64ToLeBytes(fxHash64(password));
    const passwordBytes = new TextEncoder().encode(password);
    return argon2i({
        password: passwordBytes,
        salt,
        iterations: 3,
        memorySize: 4096,
        hashLength: 32,
        parallelism: 1,
        outputType: 'hex',
    });
}
