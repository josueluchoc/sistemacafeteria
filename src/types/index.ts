// Definiciones globales para TypeScript

export type UserRole = 'admin' | 'cashier' | 'kitchen' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: number;
  is_available: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string; // Para "Sin mayonesa", etc.
  modifiers?: string[]; // IDs o nombres de modificadores
}

// Interfaces para los pedidos (las usaremos pronto)
export type OrderStatus = 'pending_verification' | 'in_kitchen' | 'ready' | 'delivered' | 'denied' | 'cancelled';
export type OrderType = 'dine_in' | 'pickup' | 'delivery';

export interface Order {
  id: number;
  created_at: string;
  user_id: string;
  status: OrderStatus;
  order_type: OrderType;
  total: number;
  table_id?: number;
  payment_proof_url?: string;
  denial_reason?: string;
  scheduled_pickup_at?: string;
  // Campos de delivery
  delivery_address?: string;
  delivery_phone?: string;
  delivery_name?: string;
  delivery_reference?: string;
}