import { useState, useEffect, useCallback } from 'react';

const WEB_API = '/api';

// Fetches without touching `loading` — used for the initial mount, where
// `loading` already starts `true`, so a synchronous setState inside the
// effect body would just be redundant (and React's exhaustive-deps
// linting flags it).
export function useSession() {
    const [session, setSession] = useState(null); // { username, totp_enabled } | null
    const [loading, setLoading] = useState(true);

    const loadSession = useCallback(() => {
        return fetch(`${WEB_API}/session/me`)
            .then(res => (res.ok ? res.json() : null))
            .then(setSession)
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    // For refreshes triggered by a user action (not the mount effect
    // above) — resets `loading` first since it may already be `false`.
    const refreshSession = useCallback(() => {
        setLoading(true);
        return loadSession();
    }, [loadSession]);

    return { session, loading, refreshSession, setSession };
}
