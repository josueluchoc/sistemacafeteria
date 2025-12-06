import { useEffect, useState } from 'react';
import { Skeleton } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';
import Navbar from '../components/ui/Navbar';
import ProductCard from '../components/menu/ProductCard';
import ProductModal from '../components/menu/ProductModal';
import { Search, Frown } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';

interface Category {
    id: number;
    name: string;
}

// Mapeo de imágenes por categoría
const categoryImages: { [key: string]: string } = {
    'todos': 'https://i.postimg.cc/wBPgVP9z/todos.png',
    'antojitos': 'https://i.postimg.cc/43Ms5MX7/antojitos.png',
    'bebidas': 'https://i.postimg.cc/bvdq18c6/bebidas.png',
    'combos': 'https://i.postimg.cc/YSVM3VMT/combos.png',
    'panes': 'https://i.postimg.cc/Ls72T72r/panes.png',
    'postres': 'https://i.postimg.cc/g05mD5Gd/postres.png',
};

const getCategoryImage = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase();

    // Buscar coincidencia exacta o parcial
    for (const [key, url] of Object.entries(categoryImages)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return url;
        }
    }

    // Imagen por defecto
    return categoryImages['todos'];
};

export default function MenuPublico() {
    const { profile } = useAuth(); // Aquí obtenemos los datos del usuario
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number>(0);

    // Buscador
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: catData } = await supabase.from('categories').select('*').order('display_order');
            const { data: prodData } = await supabase.from('products').select('*').eq('is_available', true);
            setCategories(catData || []);
            setProducts(prodData || []);
        } catch (error) {
            toast.error('Error cargando menú');
        } finally {
            setLoading(false);
        }
    };

    // Lógica de Filtrado Inteligente
    const getFilteredProducts = () => {
        // 1. Si hay término de búsqueda, ignoramos la categoría seleccionada para buscar en TODO
        if (searchTerm.trim().length > 0) {
            const term = searchTerm.toLowerCase();
            return products.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }
        // 2. Si no, filtramos por categoría normal
        return selectedCategory === 0
            ? products
            : products.filter(p => p.category_id === selectedCategory);
    };

    const filteredProducts = getFilteredProducts();

    // Lógica de "Recomendados" si no hay resultados exactos
    const showRecommendations = filteredProducts.length === 0 && searchTerm.length > 0;
    const recommendedProducts = showRecommendations ? products.slice(0, 4) : [];

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddToCartConfirm = (product: Product, quantity: number, notes: string, selectedModifiers: string[]) => {
        const modsText = selectedModifiers.join(', ');
        const finalNotes = [notes, modsText].filter(Boolean).join(' | ');
        addToCart(product, quantity, finalNotes);
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <Navbar />
                <div className="h-16" />

                {/* Header Skeleton */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-3xl shadow-lg pb-3">
                    <div className="px-4 pt-6 pb-1 max-w-7xl mx-auto">
                        <Skeleton variant="rectangular" height={40} className="rounded-full bg-white/20" />
                    </div>
                </div>

                {/* Saludo Skeleton */}
                <div className="px-4 pt-6 pb-4 max-w-7xl mx-auto">
                    <Skeleton variant="text" width="60%" height={32} />
                </div>

                {/* Categorías Skeleton */}
                <div className="pb-6 px-4 max-w-7xl mx-auto">
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center p-3 bg-white rounded-2xl border-2 border-transparent shadow-sm">
                                <Skeleton variant="circular" width={64} height={64} className="mb-2" />
                                <Skeleton variant="text" width={40} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Productos Skeleton */}
                <main className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-3 shadow-sm h-64 flex flex-col">
                                <Skeleton variant="rectangular" height={120} className="rounded-xl mb-3" />
                                <Skeleton variant="text" height={24} className="mb-1" />
                                <Skeleton variant="text" width="60%" />
                                <div className="mt-auto flex justify-between items-center">
                                    <Skeleton variant="text" width={40} height={32} />
                                    <Skeleton variant="circular" width={32} height={32} />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="h-16" />

            {/* Header Azul con Buscador */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-3xl shadow-lg pb-3">
                <div className="px-4 pt-6 pb-1 max-w-7xl mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar productos"
                            className="w-full pl-5 pr-14 py-2 rounded-full border-0 outline-none transition-all text-gray-800 bg-white shadow-md"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-1.5 rounded-full shadow-sm flex items-center justify-center">
                            <Search className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Saludo fuera de la sección azul (RESTAURADO) */}
            <div className="px-4 pt-6 pb-4 max-w-7xl mx-auto">
                <h2 className="text-xl font-bold text-gray-900">
                    {/* Aquí usamos el nombre del perfil */}
                    Hola, {profile?.full_name?.split(' ')[0] || 'Vecino'}. ¿Qué vas a pedir hoy?
                </h2>
            </div>

            {/* Cards de Categorías HORIZONTALES DESLIZABLES */}
            {searchTerm.length === 0 && (
                <div className="pb-6 max-w-7xl mx-auto">
                    <div className="overflow-x-auto scrollbar-hide px-4">
                        <div className="flex gap-3 pb-2 ">
                            {/* Botón "Todos" */}
                            <button
                                onClick={() => setSelectedCategory(0)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl transition-all shadow-sm ${selectedCategory === 0
                                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                                    : 'bg-white border-2 border-transparent hover:bg-gray-50 hover:shadow-md'
                                    }`}
                            >
                                <div className="w-16 h-16 mb-2 flex items-center justify-center">
                                    <img
                                        src={categoryImages['todos']}
                                        alt="Todos"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-800 text-center whitespace-nowrap">Todos</span>
                            </button>

                            {/* Categorías dinámicas */}
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl transition-all shadow-sm ${selectedCategory === cat.id
                                        ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                                        : 'bg-white border-2 border-transparent hover:bg-gray-50 hover:shadow-md'
                                        }`}
                                >
                                    <div className="w-16 h-16 mb-2 flex items-center justify-center">
                                        <img
                                            src={getCategoryImage(cat.name)}
                                            alt={cat.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 text-center whitespace-nowrap">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 py-6">

                {/* Caso: Sin Resultados (Mostrar Recomendaciones) */}
                {showRecommendations && (
                    <div className="mb-8">
                        <div className="flex flex-col items-center text-center py-8 text-gray-500">
                            <Frown className="w-12 h-12 mb-2 text-gray-300" />
                            <p>No encontramos "{searchTerm}".</p>
                            <p className="text-sm">Pero quizás te guste esto:</p>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-4">Recomendados para ti</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {recommendedProducts.map(p => (
                                <ProductCard key={p.id} product={p} onAdd={handleProductClick} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid Normal */}
                {!showRecommendations && filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} onAdd={handleProductClick} />
                        ))}
                    </div>
                ) : !showRecommendations && (
                    <div className="text-center py-12 text-gray-400">
                        <p>No hay productos aquí.</p>
                    </div>
                )}
            </main>

            <ProductModal
                isOpen={isModalOpen}
                product={selectedProduct}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={handleAddToCartConfirm}
            />

        </div>
    );
}