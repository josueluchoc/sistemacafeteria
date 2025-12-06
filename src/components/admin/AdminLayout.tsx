import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Menu as MenuIcon, X, Clock, Table } from 'lucide-react'; // <--- Importamos Clock
import { useAuth } from '../../context/AuthContext';
import { ListChecks } from 'lucide-react';
import { FileText } from 'lucide-react'; // Icono para historial


interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Menú actualizado con "Turnos"
    const menuItems = [
        { icon: LayoutDashboard, label: 'Resumen', path: '/admin' },
        { icon: Clock, label: 'Turnos y Caja', path: '/admin/shifts' }, // <--- NUEVO
        { icon: ShoppingBag, label: 'Productos', path: '/admin/products' },
        { icon: Users, label: 'Usuarios', path: '/admin/users' },
        { icon: ListChecks, label: 'Opciones/Insumos', path: '/admin/modifiers' },
        { icon: Table, label: 'Mesas', path: '/admin/tables' },
        { icon: FileText, label: 'Historial Ventas', path: '/admin/history' },
        { icon: Settings, label: 'Configuración', path: '/admin/settings' }, // Opcional
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">

            {/* Sidebar (Móvil y Desktop) */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold tracking-wider">PARROQUIA</h1>
                        <p className="text-xs text-gray-400">Panel Admin</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-medium'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                            {profile?.full_name?.charAt(0)}
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-medium">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 justify-center py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Header Móvil */}
                <header className="lg:hidden bg-white p-4 shadow-sm flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <MenuIcon className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="font-bold text-gray-800">{title}</h1>
                </header>

                {/* Área de Contenido */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Overlay para móvil */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}