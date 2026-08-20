import { useState, useCallback } from 'react';

const STORAGE_KEY = 'xindeler_cookie_consent'; // 'accepted' | 'declined'

function readStored() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function useCookieConsent() {
    const [consent, setConsent] = useState(readStored);

    const accept = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'accepted');
        } catch {
            // localStorage unavailable (private mode, etc.) — consent still
            // takes effect for this session via state, just won't persist.
        }
        setConsent('accepted');
    }, []);

    const decline = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'declined');
        } catch {
            // see accept() above
        }
        setConsent('declined');
    }, []);

    const reset = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // see accept() above
        }
        setConsent(null);
    }, []);

    return { consent, accept, decline, reset };
}
