import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { Order } from '../types';
import IncomingOrderCard from '../components/pos/IncomingOrderCard';
import { Loader2, Bell, Store, List, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import LocalOrderModal from '../components/pos/LocalOrderModal';

export default function CajaView() {
    const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Estado para el visor de imágenes
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLocalOrderOpen, setIsLocalOrderOpen] = useState(false);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        fetchOrders();

        const channel = supabase
            .channel('caja-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newOrder = payload.new as Order;
                        if (newOrder.status === 'pending_verification') {
                            setIncomingOrders(prev => [newOrder, ...prev]);
                            toast.message('🔔 Nuevo Pedido Web', { description: `Pedido #${newOrder.id}` });
                            playNotificationSound();
                        }
                    }
                    else if (payload.eventType === 'UPDATE') {
                        const updatedOrder = payload.new as Order;
                        if (updatedOrder.status !== 'pending_verification') {
                            setIncomingOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'pending_verification')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setIncomingOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(() => { });
        }
    };

    const handleVerifyOrder = async (orderId: number, newStatus: 'in_kitchen' | 'denied', reason?: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus, denial_reason: reason })
                .eq('id', orderId);

            if (error) throw error;

            setIncomingOrders(prev => prev.filter(o => o.id !== orderId));

            if (newStatus === 'in_kitchen') toast.success(`Pedido #${orderId} enviado a Cocina`);
            else toast.info(`Pedido #${orderId} rechazado`);

        } catch (error) {
            toast.error('No se pudo actualizar el pedido.');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 lg:p-6 pb-20">

            {/* HEADER RESPONSIVE 
          - flex-col en móvil (vertical)
          - md:flex-row en tablet/desktop (horizontal)
      */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 leading-tight">Caja y Pedidos</h1>
                    <p className="text-sm text-gray-500">Gestión de flujo de pedidos</p>
                </div>

                {/* Botón: Ancho completo en móvil (w-full), auto en desktop (md:w-auto) */}
                <div className="w-full md:w-auto">
                    <button
                        onClick={() => setIsLocalOrderOpen(true)}
                        className="w-full md:w-auto bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                    >
                        <Store className="w-5 h-5" />
                        Nuevo Pedido Local
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMNA 1: PEDIDOS WEB */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-yellow-500" />
                            Por Validar
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full border border-yellow-200">
                                {incomingOrders.length}
                            </span>
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {incomingOrders.length === 0 ? (
                            <div className="bg-white/50 p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center text-gray-400">
                                <p>No hay pedidos pendientes</p>
                            </div>
                        ) : (
                            incomingOrders.map(order => (
                                <IncomingOrderCard
                                    key={order.id}
                                    order={order}
                                    onVerify={handleVerifyOrder}
                                    onViewImage={(url) => setSelectedImage(url)} // <--- Abrir Modal
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMNA 2 & 3: PLACEHOLDER */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 opacity-60 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <List className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-600 text-lg">Historial y POS Local</h3>
                    <p className="text-gray-400 text-sm max-w-sm mt-2">
                        Selecciona "Nuevo Pedido Local" para tomar órdenes en la mesa (Próximamente).
                    </p>
                </div>

            </div>

            {/* MODAL / LIGHTBOX PARA IMÁGENES (YAPE) */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-4" onClick={() => setSelectedImage(null)}>

                    {/* Botón Cerrar Flotante */}
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-[102]"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Contenedor de Imagen */}
                    <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedImage}
                            alt="Comprobante Grande"
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                        />
                        <p className="text-white/70 text-sm mt-4 font-medium flex items-center gap-2">
                            <ZoomIn className="w-4 h-4" />
                            Toca fuera para cerrar
                        </p>
                    </div>

                </div>
            )}

            <LocalOrderModal
                isOpen={isLocalOrderOpen}
                onClose={() => setIsLocalOrderOpen(false)}
                onOrderCreated={() => {
                    toast.success("Pedido enviado correctamente");
                }}
            />

        </div>
    );
}