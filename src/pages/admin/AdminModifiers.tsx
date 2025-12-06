import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/admin/AdminLayout';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Modifier {
    id: number;
    name: string;
    is_available: boolean;
}

export default function AdminModifiers() {
    const [modifiers, setModifiers] = useState<Modifier[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');

    const fetchModifiers = async () => {
        setLoading(true);
        const { data } = await supabase.from('modifiers').select('*').order('id');
        setModifiers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchModifiers();
    }, []);

    const toggleStatus = async (mod: Modifier) => {
        const { error } = await supabase
            .from('modifiers')
            .update({ is_available: !mod.is_available })
            .eq('id', mod.id);

        if (error) toast.error('Error al actualizar');
        else {
            setModifiers(prev => prev.map(m => m.id === mod.id ? { ...m, is_available: !m.is_available } : m));
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const { error } = await supabase.from('modifiers').insert({ name: newName, is_available: true });
        if (error) toast.error('Error al crear');
        else {
            toast.success('Agregado');
            setNewName('');
            fetchModifiers();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Borrar esta opción?')) return;
        const { error } = await supabase.from('modifiers').delete().eq('id', id);
        if (!error) {
            setModifiers(prev => prev.filter(m => m.id !== id));
            toast.success('Eliminado');
        }
    };

    return (
        <AdminLayout title="Gestión de Insumos/Opciones">
            <div className="max-w-2xl mx-auto">

                {/* Crear Nuevo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Agregar Nueva Opción</h2>
                    <form onSubmit={handleAdd} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Ej: Salsa Golf"
                            className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <button className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Agregar
                        </button>
                    </form>
                </div>

                {/* Lista */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-4">Nombre Opción</th>
                                    <th className="p-4 text-center">Estado (Stock)</th>
                                    <th className="p-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {modifiers.map(mod => (
                                    <tr key={mod.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-700">{mod.name}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(mod)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${mod.is_available ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span className="sr-only">Cambiar stock</span>
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mod.is_available ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className="ml-2 text-xs font-medium text-gray-500">
                                                {mod.is_available ? 'En Stock' : 'Agotado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(mod.id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}