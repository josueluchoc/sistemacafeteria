import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, RotateCcw, User } from 'lucide-react'; // Icono RotateCcw para restaurar
import type { Order } from '../../types';

interface KitchenOrderCardProps {
  order: Order & { order_items: any[] };
  onAction: (orderId: number) => void;
  isHistory?: boolean; // Nueva prop para saber si estamos en historial
}

export default function KitchenOrderCard({ order, onAction, isHistory = false }: KitchenOrderCardProps) {
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(order.created_at).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);

      const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
      const seconds = (diff % 60).toString().padStart(2, '0');
      
      setElapsedTime(`${minutes}:${seconds}`);
    };

    calculateTime();
    // Solo actualizamos el timer si NO es historial (para ahorrar recursos)
    if (!isHistory) {
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    } else {
        // En historial mostramos la hora fija de creación o completado
        setElapsedTime(new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }
  }, [order.created_at, isHistory]);

  const getTypeStyles = () => {
    switch (order.order_type) {
      case 'dine_in': return 'bg-red-100 border-red-500 text-red-900';
      case 'delivery': return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'pickup': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getTypeText = () => {
    switch (order.order_type) {
      case 'dine_in': return `Mesa ${order.table_id || '?'}`;
      case 'delivery': return 'Delivery';
      case 'pickup': return 'Para Llevar';
      default: return 'Pedido';
    }
  };

  // Obtener nombre del cliente (puede venir de delivery_name o del perfil si existe)
  // @ts-ignore
  const customerName = order.delivery_name || order.profiles?.full_name || 'Cliente';

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border flex flex-col h-full animate-in zoom-in-95 duration-300 ${isHistory ? 'opacity-75 border-gray-300' : 'border-gray-200'}`}>
      
      {/* Header Colorido */}
      <div className={`px-4 py-3 border-l-8 flex justify-between items-start ${getTypeStyles()}`}>
        <div>
          <h3 className="font-bold text-lg uppercase tracking-wide leading-none mb-1">{getTypeText()}</h3>
          <div className="flex items-center gap-1 text-sm font-semibold opacity-90">
             <User className="w-3 h-3" /> {customerName}
          </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-xs font-bold opacity-60">#{order.id}</span>
            <div className={`flex items-center gap-1 font-mono font-bold text-lg px-2 rounded mt-1 ${isHistory ? 'text-gray-500' : 'bg-white/50'}`}>
            <Clock className="w-4 h-4" />
            {elapsedTime}
            </div>
        </div>
      </div>

      {/* Info Adicional */}
      {(order.scheduled_pickup_at || order.delivery_address) && (
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-b border-gray-100">
          {order.scheduled_pickup_at && (
            <p className="flex items-center gap-1">
              <span className="font-bold text-orange-600">HORA:</span> 
              {new Date(order.scheduled_pickup_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {order.delivery_address && (
            <p className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" /> {order.delivery_address}
            </p>
          )}
        </div>
      )}

      {/* Lista de Items */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
        <ul className="space-y-3">
          {order.order_items?.map((item: any) => (
            <li key={item.id} className="flex items-start gap-3 pb-2 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700 shrink-0 border border-gray-200">
                {item.quantity}
              </div>
              <div>
                <p className="font-bold text-gray-800 leading-tight">
                  {item.products?.name || 'Producto desconocido'}
                </p>
                {item.modifiers?.notes && (
                  <p className="text-sm text-red-600 font-bold mt-0.5 bg-red-50 inline-block px-1 rounded border border-red-100">
                    {item.modifiers.notes}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Botón */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
        <button
          onClick={() => onAction(order.id)}
          className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
            isHistory 
                ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' // Botón Restaurar (Azul)
                : 'bg-green-600 hover:bg-green-700 shadow-green-600/20' // Botón Listo (Verde)
          }`}
        >
          {isHistory ? (
            <>
                <RotateCcw className="w-5 h-5" /> Restaurar Pedido
            </>
          ) : (
            <>
                <CheckCircle2 className="w-5 h-5" /> ¡Listo!
            </>
          )}
        </button>
      </div>
    </div>
  );
}