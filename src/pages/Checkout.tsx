import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  ArrowLeft, Upload, Copy, Check, MapPin, DollarSign, 
  Loader2, Crosshair, Maximize2, Download, X 
} from 'lucide-react'; // <--- Nuevos Iconos

type OrderType = 'pickup' | 'delivery' | 'dine_in';

interface ShiftInfo {
  yape_plin_number: string;
  qr_image_url: string;
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados del Formulario
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [loading, setLoading] = useState(false);
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null);

  // Estados UI
  const [isQrZoomed, setIsQrZoomed] = useState(false); // <--- Control del Modal QR

  // Datos Delivery
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [contactName, setContactName] = useState('');

  // Estado para loading de ubicación
  const [geoLoading, setGeoLoading] = useState(false);

  // Datos Recojo
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  // Datos Pago
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchShift = async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('yape_plin_number, qr_image_url')
        .eq('is_active', true)
        .single();

      if (data) {
        setShiftInfo(data);
      } else {
        toast.error('No hay un turno activo. Es posible que no se estén recibiendo pedidos.');
      }
    };
    fetchShift();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('Tu navegador no soporta geolocalización');

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setReference(prev => `${prev} (Ubicación: ${mapsLink})`);
        toast.success('Ubicación agregada a la referencia');
        setGeoLoading(false);
      },
      (error) => {
        toast.error('No pudimos obtener tu ubicación. Por favor escríbela.');
        setGeoLoading(false);
      }
    );
  };

  // Función para descargar imagen
  const handleDownloadQr = async () => {
    if (!shiftInfo?.qr_image_url) return;
    
    // Preguntar al usuario (UX Adultos)
    if (!window.confirm('¿Deseas descargar la imagen del QR a tu celular?')) return;

    try {
      // Fetch para obtener el blob y forzar descarga
      const response = await fetch(shiftInfo.qr_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-parroquia-pago.png'; // Nombre del archivo
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Imagen descargada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo descargar la imagen automatically. Intenta mantener presionado el QR.');
    }
  };

  const handleCopyNumber = () => {
    if (shiftInfo?.yape_plin_number) {
      navigator.clipboard.writeText(shiftInfo.yape_plin_number);
      setCopied(true);
      toast.success('Número copiado');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentFile) {
      toast.error('Por favor adjunta la captura de tu pago.');
      return;
    }
    if (!shiftInfo) {
      toast.error('No se pueden recibir pedidos en este momento (Caja Cerrada).');
      return;
    }

    setLoading(true);

    try {
      const fileExt = paymentFile.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('orders')
        .upload(fileName, paymentFile);

      if (uploadError) throw uploadError;

      const paymentProofPath = uploadData.path;
      const { data: { publicUrl } } = supabase.storage.from('orders').getPublicUrl(paymentProofPath);

      const pickupTimestamp = orderType === 'pickup' ? `${pickupDate}T${pickupTime}:00` : null;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          status: 'pending_verification',
          order_type: orderType,
          total: total,
          payment_proof_url: publicUrl,
          scheduled_pickup_at: pickupTimestamp,
          delivery_address: orderType === 'delivery' ? address : null,
          delivery_phone: orderType === 'delivery' ? phone : null,
          delivery_reference: orderType === 'delivery' ? reference : null,
          delivery_name: orderType === 'delivery' ? contactName : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
        modifiers: item.notes ? { notes: item.notes } : null
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      toast.success('¡Pedido enviado! Espera la confirmación del cajero.', { duration: 5000 });
      navigate('/menu');

    } catch (error: any) {
      console.error('Error al procesar pedido:', error);
      toast.error(error.message || 'Hubo un error al enviar tu pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
        <button onClick={() => navigate('/menu')} className="text-blue-600 font-semibold">
          Volver al Menú
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/menu')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Finalizar Compra</h1>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* 1. Resumen */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" /> Resumen
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                <div className="flex gap-3 items-center">
                  <div className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-bold text-gray-600">
                    {item.quantity}x
                  </div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">S/ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
              <span className="font-bold text-lg text-gray-800">Total a Pagar</span>
              <span className="font-bold text-xl text-blue-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 2. Entrega */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" /> Entrega
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${orderType === 'pickup'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                Recojo en Tienda
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${orderType === 'delivery'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                Delivery
              </button>
            </div>

            {orderType === 'pickup' ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Fecha de Recojo</label>
                  <input
                    type="date" required value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Hora Aprox.</label>
                  <input
                    type="time" required value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <input
                  type="text" placeholder="Nombre de quien recibe" required
                  value={contactName} onChange={e => setContactName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <input
                  type="tel" placeholder="Celular de contacto" required
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <input
                  type="text" placeholder="Dirección exacta" required
                  value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <div className="relative">
                  <input
                    type="text" placeholder="Referencia (Ej: Casa portón negro)"
                    value={reference} onChange={e => setReference(e.target.value)}
                    className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Usar mi ubicación actual"
                  >
                    {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Toca la mira para enviar tu ubicación GPS exacta.</p>
              </div>
            )}
          </section>

          {/* 3. Pago */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" /> Pago (Yape/Plin)
            </h2>

            {!shiftInfo ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm">
                No hay turno activo. No se pueden procesar pagos.
              </div>
            ) : (
              <div className="space-y-6">

                {/* QR y Numero */}
                <div className="flex flex-col items-center bg-gray-50 p-4 rounded-xl border border-gray-200 border-dashed relative">
                  
                  {/* Imagen QR Interactiva */}
                  {shiftInfo.qr_image_url && (
                    <div 
                        className="relative group cursor-pointer"
                        onClick={() => setIsQrZoomed(true)} // Click para abrir modal
                    >
                        <img
                            src={shiftInfo.qr_image_url}
                            alt="QR de Pago"
                            className="w-48 h-48 object-contain rounded-lg mb-3 mix-blend-multiply"
                        />
                        {/* Botón Flotante "Ver Grande" */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <Maximize2 className="w-3 h-3" /> Ver
                            </span>
                        </div>
                    </div>
                  )}
                  
                  {/* Hint de ayuda para adultos */}
                  <p className="text-[10px] text-gray-400 mb-3 -mt-2">
                    Toca la imagen para verla en grande
                  </p>

                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm w-full max-w-xs justify-between">
                    <span className="font-mono font-bold text-gray-700 tracking-wider">
                      {shiftInfo.yape_plin_number || 'Sin número'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                      title="Copiar número"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adjuntar Captura de Pago (Obligatorio)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Tu pedido será verificado manualmente por el cajero.
                  </p>
                </div>

              </div>
            )}
          </section>

          {/* Botón Final */}
          <button
            type="submit"
            disabled={loading || !shiftInfo}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Pedido'}
          </button>

        </form>
      </main>

      {/* MODAL FULLSCREEN PARA EL QR (Lightbox) */}
      {isQrZoomed && shiftInfo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
            
            {/* Botón Cerrar */}
            <button 
                onClick={() => setIsQrZoomed(false)}
                className="absolute top-4 right-4 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition-colors z-20"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col items-center w-full max-w-lg">
                <img 
                    src={shiftInfo.qr_image_url} 
                    alt="QR Grande" 
                    className="max-w-full max-h-[70vh] object-contain rounded-xl bg-white p-2"
                />
                
                {/* Botones de Acción en el Modal */}
                <div className="mt-6 flex gap-4 w-full">
                    <button 
                        onClick={() => setIsQrZoomed(false)}
                        className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-600"
                    >
                        Cerrar
                    </button>
                    <button 
                        onClick={handleDownloadQr}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                    >
                        <Download className="w-5 h-5" />
                        Descargar
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}