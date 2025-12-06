import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isCashier: boolean;
  isKitchen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Función auxiliar para traer el perfil
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo perfil:', error.message);
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      console.error('Excepción al buscar perfil:', err);
      return null;
    }
  };

  useEffect(() => {
    // 1. Verificar sesión inicial
    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error auth inicial:', error);
      } finally {
        setLoading(false); // <--- IMPORTANTE: Siempre apagar loading
      }
    };

    initAuth();

    // 2. Escuchar cambios en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Si no tenemos perfil cargado, lo buscamos
        if (!profile) { 
           // Nota: No ponemos loading true aquí para evitar parpadeos molestos
           const userProfile = await fetchProfile(session.user.id);
           setProfile(userProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Array vacío para que solo corra al montar

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isCashier = profile?.role === 'cashier' || isAdmin;
  const isKitchen = profile?.role === 'kitchen' || isAdmin;

  const value = {
    user,
    profile,
    loading,
    signOut,
    isAdmin,
    isCashier,
    isKitchen
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};