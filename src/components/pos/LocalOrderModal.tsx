import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Trash2, Plus, Minus, ChefHat, Utensils, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../types';
import TableGrid, { type TableData } from '../ui/TableGrid';

interface LocalOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderCreated: () => void;
}

interface CartItem extends Product {
    cartId: string;
    quantity: number;
    notes: string;
}

export default function LocalOrderModal({ isOpen, onClose, onOrderCreated }: LocalOrderModalProps) {
    // Datos
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado del Pedido
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerName, setCustomerName] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMenu();
            setCart([]);
            setSelectedTable(null);
            setSearchTerm('');
            setCustomerName('');
        }
    }, [isOpen]);

    const fetchMenu = async () => {
        setLoading(true);
        const { data: cats } = await supabase.from('categories').select('*').order('display_order');
        const { data: prods } = await supabase.from('products').select('*').eq('is_available', true);
        setCategories(cats || []);
        setProducts(prods || []);
        setLoading(false);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.notes === '');
            if (existing) {
                return prev.map(item => item.cartId === existing.cartId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, cartId: crypto.randomUUID(), quantity: 1, notes: '' }];
        });
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeItem = (cartId: string) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const updateNotes = (cartId: string, notes: string) => {
        setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, notes } : item));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 0 || p.category_id === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleConfirmOrder = async () => {
        if (cart.length === 0) return toast.error('El carrito está vacío');
        if (!selectedTable) return toast.error('Selecciona una mesa');
        if (!customerName.trim()) return toast.error('Ingresa el nombre del cliente');

        setIsSubmitting(true);
        try {
            // 1. Crear Orden
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    status: 'in_kitchen',
                    order_type: 'dine_in',
                    table_id: selectedTable.id,
                    total: total,
                    delivery_name: customerName,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insertar Items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price,
                modifiers: item.notes ? { notes: item.notes } : null
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            toast.success('Pedido enviado a Cocina');
            onOrderCreated();
            onClose();

        } catch (error) {
            console.error(error);
            toast.error('Error al crear pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95">

                {/* COLUMNA IZQUIERDA: MENÚ DE PRODUCTOS */}
                <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">

                    {/* Header Menú */}
                    <div className="p-4 bg-white border-b border-gray-200 flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full pl-10 p-2.5 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 bg-gray-200 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Categorías */}
                    <div className="flex overflow-x-auto gap-2 p-3 bg-white border-b border-gray-200 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory(0)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 0 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Grid Productos */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left flex flex-col h-full active:scale-95"
                                >
                                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                        {product.image_url ? (
                                            <img src={product.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat /></div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{product.name}</h4>
                                    <p className="text-blue-600 font-bold text-sm mt-auto">S/ {product.price.toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: TICKET / CARRITO */}
                <div className="w-full md:w-[400px] flex flex-col bg-white h-full shadow-xl z-10">

                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-orange-500" /> Nuevo Pedido
                        </h2>
                        <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-red-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Lista Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10">
                                <p>El carrito está vacío</p>
                                <p className="text-sm">Selecciona productos a la izquierda</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartId} className="flex gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                        <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 bg-gray-100 rounded hover:bg-blue-100"><Plus className="w-3 h-3" /></button>
                                        <span className="font-bold text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 bg-gray-100 rounded hover:bg-red-100"><Minus className="w-3 h-3" /></button>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                            <p className="font-bold text-gray-800 text-sm">S/ {(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Nota (ej: sin ají)..."
                                            className="w-full mt-1 text-xs p-1 border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent text-gray-600"
                                            value={item.notes}
                                            onChange={e => updateNotes(item.cartId, e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => removeItem(item.cartId)} className="text-gray-300 hover:text-red-500 self-start">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Selector de Mesa y Total */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">

                        {/* INPUT NOMBRE CLIENTE */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Cliente *</p>
                            <input
                                type="text"
                                placeholder="Ej: Juan Pérez"
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Asignar Mesa</p>
                            {selectedTable ? (
                                <div className="flex justify-between items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-xl border border-blue-200">
                                    <span className="font-bold">Mesa: {selectedTable.label}</span>
                                    <button onClick={() => setSelectedTable(null)} className="text-xs underline hover:text-blue-900">Cambiar</button>
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-300 rounded-xl p-2 max-h-40 overflow-y-auto">
                                    <TableGrid
                                        mode="selector"
                                        onSelect={setSelectedTable}
                                        selectedTableId={null}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500 font-medium">Total a Pagar</span>
                            <span className="text-2xl font-bold text-gray-900">S/ {total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleConfirmOrder}
                            disabled={isSubmitting || cart.length === 0 || !selectedTable || !customerName.trim()}
                            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isSubmitting ? 'Enviando...' : 'Confirmar e Imprimir'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}