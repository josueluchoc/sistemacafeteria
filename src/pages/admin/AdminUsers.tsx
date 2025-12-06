import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/admin/AdminLayout';
import { Loader2, User, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, UserRole } from '../../types';

export default function AdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        // Traemos todos los perfiles
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Error al cargar usuarios');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleEditClick = (user: UserProfile) => {
        setEditingId(user.id);
        setSelectedRole(user.role);
    };

    const handleSaveRole = async (userId: string) => {
        // 1. Intentar actualizar en Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ role: selectedRole })
            .eq('id', userId);

        if (error) {
            console.error('Error al actualizar:', error.message); // Ver en consola
            toast.error(`Error: No tienes permisos para cambiar roles.`);
            // IMPORTANTE: No actualizamos el estado local si falló
            return;
        }

        // 2. Si no hubo error, RECIÉN actualizamos la vista
        toast.success('Rol actualizado correctamente');
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
        setEditingId(null);
    };

    const filteredUsers = users.filter(u =>
        (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'cashier': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'kitchen': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <AdminLayout title="Gestión de Usuarios">
            <div className="max-w-5xl mx-auto">

                {/* Header y Buscador */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600" />
                        Usuarios Registrados
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            className="w-full pl-9 p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th className="p-4">Usuario</th>
                                        <th className="p-4">Rol Actual</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shadow-sm">
                                                        {user.full_name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{user.full_name || 'Sin Nombre'}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                {editingId === user.id ? (
                                                    <select
                                                        className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={selectedRole}
                                                        onChange={e => setSelectedRole(e.target.value as UserRole)}
                                                    >
                                                        <option value="customer">Cliente</option>
                                                        <option value="cashier">Cajero</option>
                                                        <option value="kitchen">Cocina</option>
                                                        <option value="admin">Administrador</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)} uppercase tracking-wide`}>
                                                        {user.role}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-4 text-right">
                                                {editingId === user.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="text-gray-500 text-xs font-medium hover:text-gray-700 px-2 py-1"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveRole(user.id)}
                                                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                                                        >
                                                            <Save className="w-3 h-3" /> Guardar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-blue-100"
                                                    >
                                                        Editar Rol
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}