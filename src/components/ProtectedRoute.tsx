import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[]; // Roles permitidos para esta ruta
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // 1. Si no hay usuario, chau
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Si exigimos roles...
    if (allowedRoles) {
        // Si no tengo perfil AÚN (puede pasar si la DB es lenta), muestro carga en vez de redirigir mal
        if (!profile) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500 animate-pulse">Obteniendo permisos...</p>
                </div>
            );
        }

        // Si tengo perfil pero no coincide
        if (!allowedRoles.includes(profile.role)) {
            return <Navigate to="/menu" replace />;
        }
    }

    return <>{children}</>;
}