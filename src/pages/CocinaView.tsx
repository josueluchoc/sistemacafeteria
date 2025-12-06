import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import KitchenOrderCard from '../components/kitchen/KitchenOrderCard';
import { Loader2, ChefHat, History, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function CocinaView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]); // Estado para historial
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active'); // Control de pestañas
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    fetchOrders();

    // Suscripción Realtime
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
           // Si llega algo nuevo o cambia algo, refrescamos todo para estar seguros
           fetchOrders();
           if (viewMode === 'history') fetchHistory(); // También refrescar historial si estamos ahí

           if (payload.eventType === 'UPDATE') {
             const newOrder = payload.new as any;
             if (newOrder.status === 'in_kitchen') {
               playAlert();
               toast.success('👨‍🍳 ¡Nuevo pedido en cocina!');
             }
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cargar historial cuando cambias a esa pestaña
  useEffect(() => {
    if (viewMode === 'history') {
        fetchHistory();
    }
  }, [viewMode]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (id, quantity, modifiers, products ( name ))`)
        .eq('status', 'in_kitchen')
        .order('created_at', { ascending: true }); // FIFO

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error cargando cocina:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
        // Traemos los últimos 20 pedidos completados (ready)
        const { data, error } = await supabase
          .from('orders')
          .select(`*, order_items (id, quantity, modifiers, products ( name ))`)
          .eq('status', 'ready') 
          .order('created_at', { ascending: false }) // Los más recientes primero
          .limit(20);
  
        if (error) throw error;
        setHistoryOrders(data || []);
      } catch (error) {
        console.error('Error cargando historial:', error);
      }
  };

  const playAlert = () => {
    audioRef.current?.play().catch(() => {});
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      // Marcar como 'ready'
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
      // Optimistic UI update
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Pedido marcado como LISTO');
    } catch (error) {
      toast.error('Error al completar');
    }
  };

  const handleRestoreOrder = async (orderId: number) => {
    try {
        // Regresar a 'in_kitchen'
        await supabase.from('orders').update({ status: 'in_kitchen' }).eq('id', orderId);
        // Optimistic UI update
        setHistoryOrders(prev => prev.filter(o => o.id !== orderId));
        toast.info('Pedido restaurado a cocina');
        // Opcional: Cambiar a vista activa automáticamente
        // setViewMode('active'); 
    } catch (error) {
        toast.error('Error al restaurar');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-900 p-4 lg:p-6 text-gray-100 flex flex-col">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 rounded-xl shadow-lg shadow-orange-900/50">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cocina</h1>
            
            {/* PESTAÑAS */}
            <div className="flex gap-2 mt-2">
                <button 
                    onClick={() => setViewMode('active')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'active' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    En Proceso ({orders.length})
                </button>
                <button 
                    onClick={() => setViewMode('history')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'history' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    <History className="w-3 h-3" /> Archivados
                </button>
            </div>
          </div>
        </div>
        
        {/* LEYENDA DE COLORES */}
        <div className="flex gap-3 text-xs font-medium bg-gray-800 p-2 rounded-lg border border-gray-700">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Mesa</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Delivery</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Para Llevar</div>
        </div>

      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1">
        
        {viewMode === 'active' ? (
            // VISTA ACTIVA
            orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-600 animate-in fade-in">
                    <ChefHat className="w-20 h-20 mb-4 opacity-20" />
                    <h2 className="text-xl font-bold opacity-50">Todo limpio, Chef.</h2>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <KitchenOrderCard 
                            key={order.id} 
                            order={order} 
                            onAction={handleCompleteOrder} 
                        />
                    ))}
                </div>
            )
        ) : (
            // VISTA HISTORIAL
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Info className="w-4 h-4" /> Mostrando los últimos 20 pedidos completados.
                </div>
                
                {historyOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
                        No hay pedidos archivados recientemente.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80">
                        {historyOrders.map(order => (
                            <KitchenOrderCard 
                                key={order.id} 
                                order={order} 
                                onAction={handleRestoreOrder} 
                                isHistory={true} // Cambia el estilo y botón
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
}