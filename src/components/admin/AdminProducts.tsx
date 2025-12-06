import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../types';
import { generateProductDescription } from '../../services/gemini';
import { Sparkles } from 'lucide-react';

// Tipo para categorías
type Category = {
    id: number;
    name: string;
};

// Modal Component (Interno para simplificar)
function ProductModal({
    isOpen,
    onClose,
    productToEdit,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    productToEdit: Product | null;
    onSave: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '1', // Default ID
        image_url: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                description: productToEdit.description || '',
                price: productToEdit.price.toString(),
                category_id: productToEdit.category_id.toString(),
                image_url: productToEdit.image_url || ''
            });
        } else {
            setFormData({ name: '', description: '', price: '', category_id: '1', image_url: '' });
        }
        setImageFile(null);
    }, [productToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = formData.image_url;

            // 1. Subir imagen si se seleccionó una nueva Y el modo es 'upload'
            if (imageFile && imageMode === 'upload') {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('products')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                // Obtener URL pública
                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(data.path);

                finalImageUrl = publicUrl;
            }

            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category_id: parseInt(formData.category_id),
                image_url: finalImageUrl,
                is_available: true
            };

            if (productToEdit) {
                // UPDATE
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productToEdit.id);
                if (error) throw error;
                toast.success('Producto actualizado');
            } else {
                // CREATE
                const { error } = await supabase.from('products').insert(productData);
                if (error) throw error;
                toast.success('Producto creado');
            }

            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar producto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Nombre</label>
                            <input
                                required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Precio (S/)</label>
                            <input
                                type="number" step="0.10" required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Categoría ID</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-white"
                            value={formData.category_id}
                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                        >
                            <option value="1">Panes (1)</option>
                            <option value="2">Combos (2)</option>
                            <option value="3">Bebidas (3)</option>
                            <option value="4">Postres (4)</option>
                            <option value="5">Antojitos (5)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-medium text-gray-700">Descripción</label>

                            {/* BOTÓN MÁGICO DE IA */}
                            <button
                                type="button"
                                onClick={async () => {
                                    // Validación simple
                                    if (!formData.name) return toast.error('Escribe el nombre del producto primero');

                                    // Efecto de carga visual (cambiando texto o deshabilitando)
                                    const toastId = toast.loading('La IA está pensando...');

                                    const desc = await generateProductDescription(formData.name);

                                    if (desc) {
                                        setFormData({ ...formData, description: desc });
                                        toast.dismiss(toastId);
                                        toast.success('¡Descripción generada!');
                                    } else {
                                        toast.dismiss(toastId);
                                        toast.error('No se pudo generar');
                                    }
                                }}
                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold hover:bg-purple-200 flex items-center gap-1 transition-colors border border-purple-200 shadow-sm"
                            >
                                <Sparkles className="w-3 h-3" />
                                Generar con IA
                            </button>
                        </div>

                        <textarea
                            rows={3}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Escribe una descripción o usa el botón mágico..."
                        />
                    </div>

                    {/* SECCIÓN IMAGEN ACTUALIZADA */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Imagen del Producto</label>
                        
                        <div className="flex gap-2 text-xs mb-2">
                            <button 
                                type="button" 
                                onClick={() => setImageMode('upload')} 
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${imageMode === 'upload' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Subir Archivo
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setImageMode('url')} 
                                className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${imageMode === 'url' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <LinkIcon className="w-3 h-3" />
                                Pegar URL
                            </button>
                        </div>

                        {imageMode === 'upload' ? (
                            <div className="flex items-center gap-4">
                                {(formData.image_url || imageFile) && (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                    </div>
                                )}
                                <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-gray-500">
                                    <ImageIcon className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Clic para subir imagen</span>
                                    <input
                                        type="file" accept="image/*" className="hidden"
                                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input 
                                    type="url" 
                                    placeholder="https://ejemplo.com/hamburguesa.jpg"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.image_url}
                                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                                />
                                {formData.image_url && (
                                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={formData.image_url}
                                            className="w-full h-full object-cover"
                                            alt="Preview URL"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '';
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Main Page Component
export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [sortMode, setSortMode] = useState<'name' | 'price' | 'stock'>('name');

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
        setProducts(data || []);
        setLoading(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('id');
        setCategories(data || []);
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Crear mapa de categorías
    const categoryMap = useMemo(() => {
        const map: Record<number, string> = {};
        categories.forEach(cat => {
            map[cat.id] = cat.name;
        });
        return map;
    }, [categories]);

    // Agrupar y ordenar productos
    const groupedProducts = useMemo(() => {
        // Ordenar productos según el modo seleccionado
        let sorted = [...products];
        
        switch (sortMode) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'stock':
                sorted.sort((a, b) => (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0));
                break;
        }

        // Agrupar por categoría
        const grouped: Record<string, Product[]> = {};
        sorted.forEach(product => {
            const catName = categoryMap[product.category_id] || `Categoría ${product.category_id}`;
            if (!grouped[catName]) {
                grouped[catName] = [];
            }
            grouped[catName].push(product);
        });

        return grouped;
    }, [products, categoryMap, sortMode]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Seguro que quieres eliminar este producto?')) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            toast.error('Error al eliminar');
        } else {
            toast.success('Producto eliminado');
            fetchProducts();
        }
    };

    const toggleAvailability = async (product: Product) => {
        const { error } = await supabase
            .from('products')
            .update({ is_available: !product.is_available })
            .eq('id', product.id);

        if (error) toast.error('Error al actualizar stock');
        else {
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, is_available: !p.is_available } : p
            ));
        }
    };

    return (
        <AdminLayout title="Gestión de Productos">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
                    <p className="text-sm text-gray-500 mt-1">{products.length} productos en total</p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nuevo Producto
                </button>
            </div>

            {/* Controles de ordenamiento */}
            <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Ordenar por:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSortMode('name')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            sortMode === 'name' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Nombre
                    </button>
                    <button
                        onClick={() => setSortMode('price')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            sortMode === 'price' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Precio
                    </button>
                    <button
                        onClick={() => setSortMode('stock')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            sortMode === 'stock' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Disponibilidad
                    </button>
                </div>
            </div>

            {/* Grid de Productos Admin - Agrupado por categoría */}
            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedProducts).map(([catName, prods]) => (
                        <div key={catName}>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gradient-to-r from-gray-50 to-transparent p-3 rounded-lg border-l-4 border-blue-500">
                                {catName} <span className="text-sm font-normal text-gray-500">({prods.length})</span>
                            </h3>
                            
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                            <tr>
                                                <th className="p-4">Producto</th>
                                                <th className="p-4">Precio</th>
                                                <th className="p-4 text-center">Stock</th>
                                                <th className="p-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {prods.map(product => (
                                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                                                {product.image_url ? (
                                                                    <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-5 h-5" /></div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800">{product.name}</p>
                                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono font-medium text-gray-800">
                                                        S/ {product.price.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleAvailability(product)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.is_available ? 'bg-green-500' : 'bg-gray-300'}`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={editingProduct}
                onSave={fetchProducts}
            />
        </AdminLayout>
    );
}