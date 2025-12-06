import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AdminLayout from '../components/admin/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { Save, Loader2, User, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function UserSettings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    address: '',     // Asumimos que agregaremos este campo a profiles luego o lo simulamos
    phone: ''        // Igual para teléfono
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        address: '', // Si agregas la columna a la DB, pon profile.address
        phone: ''
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Actualizar Datos en Profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          // address: formData.address, // Descomentar cuando agregues la columna a SQL
          // phone: formData.phone
        })
        .eq('id', user?.id);

      if (error) throw error;

      // 2. Actualizar Metadatos de Auth (opcional, para consistencia)
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      });

      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Mi Cuenta">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" /> Datos Personales
        </h2>

        <form onSubmit={handleUpdate} className="space-y-6">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Teléfono (Predefinido)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="tel" 
                  placeholder="Para autocompletar pedidos"
                  className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Dirección (Predefinida)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Para delivery rápido"
                  className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
}