import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Adaptador de almacenamiento personalizado para soportar "Recordarme"
let _useLocalStorage = true;

export const setRememberMe = (value: boolean) => {
    _useLocalStorage = value;
};

const customStorage = {
    getItem: (key: string) => {
        const sessionVal = sessionStorage.getItem(key);
        const localVal = localStorage.getItem(key);

        // Si existe en session, priorizamos session (estamos en modo sesión)
        if (sessionVal) {
            _useLocalStorage = false;
            return sessionVal;
        }
        // Si existe en local, estamos en modo persistente
        if (localVal) {
            _useLocalStorage = true;
            return localVal;
        }
        return null;
    },
    setItem: (key: string, value: string) => {
        if (_useLocalStorage) {
            sessionStorage.removeItem(key);
            localStorage.setItem(key, value);
        } else {
            localStorage.removeItem(key);
            sessionStorage.setItem(key, value);
        }
    },
    removeItem: (key: string) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});