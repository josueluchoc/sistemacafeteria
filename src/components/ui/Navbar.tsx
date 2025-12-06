import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, User, LogOut, ChevronDown, UtensilsCrossed, Monitor, LayoutDashboard, Shield } from 'lucide-react'; // <--- Importamos Shield
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function Navbar() {
    const { signOut, profile, isAdmin, isCashier, isKitchen } = useAuth();
    const { itemCount } = useCart();
    const navigate = useNavigate();

    // Estado para el menú desplegable
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Cerrar menú si hago clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-lg border-b border-white/40 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Logo / Título */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/menu')}>
                    <img
                        src="https://i.postimg.cc/wjzDFf0C/logoparronew.png"
                        alt="Logo Parroquia"
                        className="w-10 h-10 object-contain"
                    />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-gray-800 leading-tight">Cafetería</h1>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Parroquial</span>
                    </div>
                </div>

                {/* Acciones Derecha */}
                <div className="flex items-center gap-2 md:gap-4">

                    {/* Botón Carrito */}
                    <button
                        onClick={() => navigate('/checkout')}
                        className="relative p-2.5 bg-gray-100/50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-all active:scale-95"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold flex items-center justify-center rounded-full shadow-sm animate-in zoom-in border-2 border-white">
                                {itemCount}
                            </span>
                        )}
                    </button>

                    {/* Menú Usuario Desplegable */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 pl-2 md:pl-4 border-l border-gray-200 group"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:shadow-lg transition-all">
                                {/* Mostramos la inicial del nombre o un ícono genérico */}
                                {profile?.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                            </div>

                            {/* Saludo y Nombre (Visible en Desktop) */}
                            <div className="hidden md:block text-left">
                                <p className="text-xs text-gray-500 font-medium">Hola,</p>
                                <p className="text-sm font-bold text-gray-800 leading-none max-w-[100px] truncate">
                                    {profile?.full_name?.split(' ')[0] || 'Usuario'}
                                </p>
                            </div>

                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Content */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-3 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-5 origin-top-right">

                                {/* Info Usuario (Móvil y Desktop) */}
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                    <p className="text-sm font-bold text-gray-800 truncate">{profile?.full_name || 'Usuario'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{profile?.role || 'Cliente'}</p>
                                </div>

                                {/* Enlaces según Rol */}
                                <div className="p-2 space-y-1">

                                    {/* Link: Admin (Solo si es admin) */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left font-semibold mb-2"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Panel Administración
                                        </button>
                                    )}

                                    {/* Siempre visible: Menú Público */}
                                    <button
                                        onClick={() => { navigate('/menu'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                    >
                                        <UtensilsCrossed className="w-4 h-4 text-blue-500" />
                                        Ver Carta
                                    </button>

                                    {/* Solo Cajeros y Admins */}
                                    {(isCashier || isAdmin) && (
                                        <button
                                            onClick={() => { navigate('/pos'); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <Monitor className="w-4 h-4 text-green-500" />
                                            Ir a Caja
                                        </button>
                                    )}

                                    {/* Solo Cocina y Admins */}
                                    {(isKitchen || isAdmin) && (
                                        <button
                                            onClick={() => { navigate('/kitchen'); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <LayoutDashboard className="w-4 h-4 text-orange-500" />
                                            Pantalla Cocina
                                        </button>
                                    )}

                                    {/* Link: Mis Pedidos (Visible para todos) */}
                                    <button
                                        onClick={() => { navigate('/orders'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                    >
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        Mis Pedidos
                                    </button>

                                </div>

                                <div className="border-t border-gray-100 p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left font-medium"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
}