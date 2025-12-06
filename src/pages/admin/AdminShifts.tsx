import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/admin/AdminLayout';
import { QrCode, Smartphone, User, Lock, Unlock, Upload, Loader2, AlertTriangle, Clock, History, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Shift {
  id: number;
  responsible_name: string;
  yape_plin_number: string;
  qr_image_url: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

export default function AdminShifts() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados Formulario
  const [formData, setFormData] = useState({
    responsible_name: '',
    yape_plin_number: '',
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: active } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', true)
      .single();
    
    const { data: history } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', false)
      .order('end_time', { ascending: false })
      .limit(10);

    setActiveShift(active);
    setShiftHistory(history || []);
    
    if (active) {
        setFormData({
            responsible_name: active.responsible_name,
            yape_plin_number: active.yape_plin_number
        });
    }

    setLoading(false);
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrFile) return toast.error('Debes subir la imagen del QR');

    setActionLoading(true);
    try {
      const fileExt = qrFile.name.split('.').pop();
      const fileName = `shift-${Date.now()}.${fileExt}`;
      
      // 1. Subir Imagen con manejo de error explícito
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shifts')
        .upload(fileName, qrFile);

      if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('shifts').getPublicUrl(uploadData.path);

      // 2. Crear registro
      const { error: insertError } = await supabase.from('shifts').insert({
        responsible_name: formData.responsible_name,
        yape_plin_number: formData.yape_plin_number,
        qr_image_url: publicUrl,
        is_active: true,
        start_time: new Date().toISOString()
      });

      if (insertError) throw insertError;

      toast.success('¡Caja Abierta!');
      fetchData();
      setFormData({ responsible_name: '', yape_plin_number: '' });
      setQrFile(null);

    } catch (error: any) {
      toast.error(error.message || 'Error al abrir turno');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateShift = async () => {
    if (!activeShift) return;
    setActionLoading(true);
    
    try {
        let qrUrl = activeShift.qr_image_url;

        // Si subieron nueva imagen
        if (qrFile) {
            const fileExt = qrFile.name.split('.').pop();
            const fileName = `shift-${Date.now()}.${fileExt}`;
            
            // CORRECCIÓN: Chequeo estricto de error en subida
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('shifts')
                .upload(fileName, qrFile);
            
            if (uploadError) throw new Error(`Falló la subida del QR: ${uploadError.message}`);

            if (uploadData) {
                const { data } = supabase.storage.from('shifts').getPublicUrl(uploadData.path);
                qrUrl = data.publicUrl;
            }
        }

        const { error } = await supabase.from('shifts').update({
            responsible_name: formData.responsible_name,
            yape_plin_number: formData.yape_plin_number,
            qr_image_url: qrUrl
        }).eq('id', activeShift.id);

        if (error) throw error;
        
        toast.success("Datos del turno actualizados");
        setIsEditing(false);
        setQrFile(null); // Limpiar archivo seleccionado
        fetchData();

    } catch (error: any) {
        toast.error(error.message || "Error al actualizar");
    } finally {
        setActionLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift || !confirm('¿Cerrar caja y finalizar turno?')) return;

    setActionLoading(true);
    try {
      await supabase.from('shifts').update({ 
          is_active: false, 
          end_time: new Date().toISOString() 
        }).eq('id', activeShift.id);

      toast.info('Caja Cerrada.');
      fetchData();
    } catch (error) {
      toast.error('Error al cerrar caja');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="Gestión de Turnos y Caja">
      
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* SECCIÓN 1: ESTADO ACTUAL */}
          <section>
             <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Estado Actual
             </h2>

             {activeShift ? (
                // --- VISTA TURNO ACTIVO ---
                <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
                    <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-green-800 font-bold">
                            <Unlock className="w-5 h-5" /> Caja Abierta
                        </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 font-bold">
                                <Edit2 className="w-3 h-3" /> Editar Datos
                            </button>
                        )}
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-8">
                        {isEditing ? (
                            // MODO EDICIÓN
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-500 uppercase">Editando Turno Actual</p>
                                <input 
                                    className="w-full p-2 border rounded-lg" 
                                    value={formData.responsible_name} 
                                    onChange={e => setFormData({...formData, responsible_name: e.target.value})}
                                    placeholder="Nombre Responsable"
                                />
                                <input 
                                    className="w-full p-2 border rounded-lg" 
                                    value={formData.yape_plin_number} 
                                    onChange={e => setFormData({...formData, yape_plin_number: e.target.value})}
                                    placeholder="Número Yape"
                                />
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="font-bold mb-1">Cambiar QR (Opcional):</p>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setQrFile(e.target.files?.[0] || null)} 
                                        className="w-full text-xs"
                                    />
                                    {qrFile && <p className="text-green-600 mt-1">Archivo seleccionado: {qrFile.name}</p>}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={handleUpdateShift} 
                                        disabled={actionLoading}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                    >
                                        {actionLoading && <Loader2 className="w-3 h-3 animate-spin"/>} Guardar Cambios
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setQrFile(null); }} className="text-gray-500 px-4 py-2 text-sm">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            // MODO VISUALIZACIÓN
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Responsable</span>
                                    <p className="text-xl font-medium text-gray-800">{activeShift.responsible_name}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Yape/Plin</span>
                                    <p className="text-lg font-mono text-gray-800 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-gray-400" />
                                        {activeShift.yape_plin_number}
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={handleCloseShift}
                                        disabled={actionLoading}
                                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        Cerrar Caja
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                            {/* Clave: Key en la imagen para forzar recarga si cambia la URL */}
                            <img 
                                key={activeShift.qr_image_url}
                                src={activeShift.qr_image_url} 
                                alt="QR" 
                                className="w-48 h-48 object-contain mix-blend-multiply mb-2" 
                            />
                            <span className="text-xs text-gray-400">QR Visible actualmente</span>
                        </div>
                    </div>
                </div>
             ) : (
                // --- VISTA ABRIR NUEVO ---
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Apertura de Caja</h3>
                    <form onSubmit={handleOpenShift} className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Nombre Responsable</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input 
                                        type="text" required placeholder="Ej: Grupo Catequesis"
                                        className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.responsible_name}
                                        onChange={e => setFormData({...formData, responsible_name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Número Yape/Plin</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input 
                                        type="tel" required placeholder="Ej: 999 888 777"
                                        className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.yape_plin_number}
                                        onChange={e => setFormData({...formData, yape_plin_number: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-700 block">Subir QR</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                                {qrFile ? <p className="text-blue-600 font-bold text-sm">{qrFile.name}</p> : <div className="text-center"><Upload className="w-6 h-6 mx-auto text-blue-400 mb-1"/><p className="text-xs text-gray-500">Clic para subir</p></div>}
                                <input type="file" accept="image/*" className="hidden" onChange={e => setQrFile(e.target.files?.[0] || null)} />
                            </label>
                            <button type="submit" disabled={actionLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70">
                                {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Unlock className="w-5 h-5" />} Abrir Caja
                            </button>
                        </div>
                    </form>
                </div>
             )}
          </section>

          {/* SECCIÓN 2: HISTORIAL */}
          <section>
             <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" /> Historial de Turnos (Últimos 10)
             </h2>
             
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Responsable</th>
                            <th className="p-4">Duración</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shiftHistory.length === 0 ? (
                            <tr><td colSpan={4} className="p-6 text-center text-gray-400 text-sm">No hay historial disponible</td></tr>
                        ) : (
                            shiftHistory.map(shift => {
                                const start = new Date(shift.start_time);
                                const end = shift.end_time ? new Date(shift.end_time) : new Date();
                                const durationHrs = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);

                                return (
                                    <tr key={shift.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm text-gray-600">
                                            {start.toLocaleDateString()} <br/>
                                            <span className="text-xs text-gray-400">{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">{shift.responsible_name}</td>
                                        <td className="p-4 text-sm text-gray-600">{durationHrs} hrs</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">Cerrado</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
             </div>
          </section>

        </div>
      )}
    </AdminLayout>
  );
}