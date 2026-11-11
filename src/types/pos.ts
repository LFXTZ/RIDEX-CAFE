export type UserRole = 'owner' | 'cashier' | 'kitchen';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  title: string;
}

export type CategoryId =
  | 'all'
  | 'espresso'
  | 'manual_brew'
  | 'non_coffee'
  | 'bakery'
  | 'heavy_meals'
  | 'extra';

export interface ProductVariantOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  basePrice: number;
  costPrice?: number; // Cost of Goods Sold for Owner margin calculation
  image?: string;
  stock: number;
  badge: 'Tersedia' | 'Stok Menipis' | 'Habis';
  hasVariants: boolean;
  description: string;
  sku: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  basePrice: number;
  finalUnitPrice: number;
  quantity: number;
  size: 'Regular' | 'Large';
  sugarLevel: '100%' | '50%' | '0%';
  iceLevel: 'Normal' | 'Less Ice' | 'No Ice';
  extras: { name: string; price: number }[];
  notes?: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface Discount {
  id: string;
  name: string;
  type: 'percent' | 'nominal';
  value: number; // e.g. 10 for 10% or 15000 for Rp 15.000
}

export type PaymentMethod = 'cash' | 'qris' | 'card' | 'ewallet' | 'split';

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface CompletedOrder {
  orderId: string;
  orderNumber: string;
  timestamp: string;
  cashierName: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel?: string;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  splitDetails?: PaymentRecord[];
}

export interface HoldOrder {
  id: string;
  holdNumber: string;
  timestamp: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: CartItem[];
  notes?: string;
  subtotal: number;
}

export interface CashAdjustment {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  timestamp: string;
  cashier: string;
}

export interface TableItem {
  id: string;
  name: string;
  capacity: number;
  zone: 'Indoor Cafe' | 'Bar Counter' | 'Outdoor Terrace';
  status: 'available' | 'occupied' | 'reserved';
  activeOrderTotal?: number;
  currentGuest?: string;
}

export type KitchenStatus = 'pending' | 'cooking' | 'ready' | 'completed';

export interface KitchenTicket {
  id: string;
  orderNumber: string;
  timestamp: string;
  createdAt: number; // timestamp in ms for live elapsed timer
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: CartItem[];
  status: KitchenStatus;
}
