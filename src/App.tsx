/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { CartPanel } from './components/CartPanel';
import { KitchenDisplay } from './components/KitchenDisplay';
import { OwnerDashboard } from './components/OwnerDashboard';

import { VariantModal } from './components/modals/VariantModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { SplitBillModal } from './components/modals/SplitBillModal';
import { ShiftRecapModal } from './components/modals/ShiftRecapModal';
import { TableMapModal } from './components/modals/TableMapModal';
import { HoldOrdersModal } from './components/modals/HoldOrdersModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { BarcodeScannerModal } from './components/modals/BarcodeScannerModal';
import { EditMenuModal } from './components/modals/EditMenuModal';
import { LogoutConfirmModal } from './components/modals/LogoutConfirmModal';

import { 
  Product, 
  CartItem, 
  OrderType, 
  Discount, 
  CompletedOrder, 
  HoldOrder, 
  CashAdjustment, 
  TableItem,
  UserRole,
  UserAccount,
  KitchenTicket,
  KitchenStatus
} from './types/pos';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_TABLES, 
  INITIAL_DISCOUNTS, 
  INITIAL_KITCHEN_TICKETS,
  DEMO_USERS 
} from './data/mockProducts';
import { formatDateTime, generateOrderNumber, formatRupiah } from './utils/formatters';
import { soundManager } from './utils/audio';
import { LayoutGrid, ShoppingBag, ArrowRight } from 'lucide-react';

export default function App() {
  // Session Authentication State: starts at null for initial Login Card view
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('cashier');
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'cart'>('catalog');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Cashier & System State
  const [initialDrawerCash] = useState<number>(500000); // Rp 500.000 modal awal
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>(INITIAL_KITCHEN_TICKETS);

  // Active Cart / Order State (Cashier View)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      cartItemId: 'sample_1',
      productId: 'prod_1',
      name: 'Ridex Signature Latte',
      basePrice: 32000,
      finalUnitPrice: 38000,
      quantity: 2,
      size: 'Large',
      sugarLevel: '50%',
      iceLevel: 'Less Ice',
      extras: [{ name: 'Extra Double Espresso Shot', price: 8000 }],
      notes: 'Sajikan dengan cup ramah lingkungan',
    },
    {
      cartItemId: 'sample_2',
      productId: 'prod_8',
      name: 'Butter Croissant',
      basePrice: 22000,
      finalUnitPrice: 22000,
      quantity: 1,
      size: 'Regular',
      sugarLevel: '100%',
      iceLevel: 'Normal',
      extras: [],
      notes: 'Hangatkan sebentar',
    },
  ]);

  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('04');
  const [guestName, setGuestName] = useState<string>('Bpk. Arya');
  const [selectedDiscount, setSelectedDiscount] = useState<Discount>(INITIAL_DISCOUNTS[0]);

  // Parked Drafts (Hold Orders)
  const [holdOrders, setHoldOrders] = useState<HoldOrder[]>([
    {
      id: 'hold_1',
      holdNumber: 'HOLD-#01',
      timestamp: '08:15 WIB',
      orderType: 'dine_in',
      tableNumber: '02',
      customerName: 'Dimas P.',
      items: [
        {
          cartItemId: 'h_item_1',
          productId: 'prod_2',
          name: 'Americano (Hot / Iced)',
          basePrice: 24000,
          finalUnitPrice: 24000,
          quantity: 2,
          size: 'Regular',
          sugarLevel: '0%',
          iceLevel: 'Normal',
          extras: [],
        },
        {
          cartItemId: 'h_item_2',
          productId: 'prod_11',
          name: 'Truffle Fries with Parmesan',
          basePrice: 25000,
          finalUnitPrice: 25000,
          quantity: 1,
          size: 'Regular',
          sugarLevel: '100%',
          iceLevel: 'Normal',
          extras: [],
        },
      ],
      subtotal: 73000,
    },
  ]);

  // Completed Orders History
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([
    {
      orderId: 'ord_init_1',
      orderNumber: 'RDX-2026-1042',
      timestamp: '08:30 WIB',
      cashierName: 'Rifqy Ridho P.',
      orderType: 'dine_in',
      tableNumber: '02',
      customerName: 'Ibu Sarah',
      items: [
        {
          cartItemId: 'c_item_1',
          productId: 'prod_6',
          name: 'Artisan Matcha Latte',
          basePrice: 30000,
          finalUnitPrice: 30000,
          quantity: 2,
          size: 'Regular',
          sugarLevel: '50%',
          iceLevel: 'Normal',
          extras: [],
        },
      ],
      subtotal: 60000,
      discountAmount: 0,
      tax: 6000,
      serviceCharge: 3000,
      grandTotal: 69000,
      paymentMethod: 'qris',
      amountPaid: 69000,
      change: 0,
    },
    {
      orderId: 'ord_init_2',
      orderNumber: 'RDX-2026-1088',
      timestamp: '09:12 WIB',
      cashierName: 'Rifqy Ridho P.',
      orderType: 'takeaway',
      customerName: 'Reza Pratama',
      items: [
        {
          cartItemId: 'c_item_2',
          productId: 'prod_10',
          name: 'Nasi Goreng Ridex Special',
          basePrice: 38000,
          finalUnitPrice: 38000,
          quantity: 1,
          size: 'Regular',
          sugarLevel: '100%',
          iceLevel: 'Normal',
          extras: [],
        },
        {
          cartItemId: 'c_item_3',
          productId: 'prod_1',
          name: 'Ridex Signature Latte',
          basePrice: 32000,
          finalUnitPrice: 32000,
          quantity: 1,
          size: 'Regular',
          sugarLevel: '100%',
          iceLevel: 'Normal',
          extras: [],
        },
      ],
      subtotal: 70000,
      discountAmount: 7000,
      discountLabel: 'Member Loyalty (10%)',
      tax: 6300,
      serviceCharge: 3150,
      grandTotal: 72450,
      paymentMethod: 'cash',
      amountPaid: 100000,
      change: 27550,
    },
  ]);

  // Cash In / Cash Out logs
  const [cashAdjustments, setCashAdjustments] = useState<CashAdjustment[]>([
    {
      id: 'adj_init_1',
      type: 'in',
      amount: 100000,
      reason: 'Tambahan modal receh Rp 2.000 & Rp 5.000 dari supervisor',
      timestamp: '07:30 WIB',
      cashier: 'Rifqy Ridho P.',
    },
  ]);

  // Modals Visibility
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isTableMapOpen, setIsTableMapOpen] = useState<boolean>(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [isEditMenuModalOpen, setIsEditMenuModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<CompletedOrder | null>(null);

  // Dynamic drawer cash calculation
  const totalCashSales = completedOrders.reduce((sum, ord) => {
    if (ord.paymentMethod === 'cash') return sum + ord.grandTotal;
    if (ord.paymentMethod === 'split' && ord.splitDetails) {
      const c = ord.splitDetails.find((d) => d.method === 'cash');
      return sum + (c ? c.amount : 0);
    }
    return sum;
  }, 0);

  const totalCashIn = cashAdjustments
    .filter((a) => a.type === 'in')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalCashOut = cashAdjustments
    .filter((a) => a.type === 'out')
    .reduce((sum, a) => sum + a.amount, 0);

  const currentDrawerCash = initialDrawerCash + totalCashSales + totalCashIn - totalCashOut;

  // Active Bill Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

  const discountAmount =
    selectedDiscount.type === 'percent'
      ? Math.round((subtotal * selectedDiscount.value) / 100)
      : Math.min(subtotal, selectedDiscount.value);

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxPB1 = Math.round(taxableSubtotal * 0.10);
  const serviceCharge = Math.round(taxableSubtotal * 0.05);
  const grandTotal = taxableSubtotal + taxPB1 + serviceCharge;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const activeKitchenTicketsCount = kitchenTickets.filter((t) => t.status !== 'completed').length;

  // Authentication Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  const handleConfirmLogout = () => {
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
  };

  // Product Selection Handler (Cashier View)
  const handleSelectProduct = (product: Product) => {
    if (product.badge === 'Habis') {
      soundManager.playAlert();
      alert(`Mohon maaf, menu "${product.name}" sedang habis stok.`);
      return;
    }

    if (product.hasVariants) {
      setVariantProduct(product);
    } else {
      const existing = cartItems.find(
        (i) => i.productId === product.id && i.size === 'Regular' && (!i.extras || i.extras.length === 0)
      );

      if (existing) {
        setCartItems(
          cartItems.map((i) =>
            i.cartItemId === existing.cartItemId ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      } else {
        const newItem: CartItem = {
          cartItemId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          name: product.name,
          basePrice: product.basePrice,
          finalUnitPrice: product.basePrice,
          quantity: 1,
          size: 'Regular',
          sugarLevel: '100%',
          iceLevel: 'Normal',
          extras: [],
        };
        setCartItems([...cartItems, newItem]);
      }
    }
  };

  const handleAddCustomizedItem = (item: CartItem) => {
    setCartItems([...cartItems, item]);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCartItems(
      cartItems
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems(cartItems.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleUpdateItemNotes = (cartItemId: string, notes: string) => {
    setCartItems(
      cartItems.map((i) =>
        i.cartItemId === cartItemId ? { ...i, notes: notes.trim() || undefined } : i
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setSelectedDiscount(INITIAL_DISCOUNTS[0]);
  };

  // Hold / Park Active Bill
  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;

    soundManager.playClick();
    const newHold: HoldOrder = {
      id: `hold_${Date.now()}`,
      holdNumber: `HOLD-#${(holdOrders.length + 1).toString().padStart(2, '0')}`,
      timestamp: formatDateTime(),
      orderType,
      tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
      customerName: guestName,
      items: [...cartItems],
      subtotal,
    };

    setHoldOrders([...holdOrders, newHold]);
    setCartItems([]);
    setGuestName('');
    setTableNumber('01');
  };

  const handleRestoreHoldOrder = (hold: HoldOrder) => {
    soundManager.playClick();
    setCartItems(hold.items);
    setOrderType(hold.orderType);
    if (hold.tableNumber) setTableNumber(hold.tableNumber);
    if (hold.customerName) setGuestName(hold.customerName);
    setHoldOrders(holdOrders.filter((h) => h.id !== hold.id));
  };

  const handleDeleteHoldOrder = (id: string) => {
    setHoldOrders(holdOrders.filter((h) => h.id !== id));
  };

  // Kitchen Ticket Direct Preview
  const handlePrintKitchenTicket = () => {
    if (cartItems.length === 0) return;
    const dummyOrder: CompletedOrder = {
      orderId: `kitch_${Date.now()}`,
      orderNumber: generateOrderNumber(),
      timestamp: formatDateTime(),
      cashierName: currentUser?.name || 'Kasir Ridex',
      orderType,
      tableNumber,
      customerName: guestName,
      items: cartItems,
      subtotal,
      discountAmount,
      tax: taxPB1,
      serviceCharge,
      grandTotal,
      paymentMethod: 'cash',
      amountPaid: grandTotal,
      change: 0,
    };
    setActiveReceiptOrder(dummyOrder);
    setIsReceiptOpen(true);
  };

  // Payment Completed Flow -> AUTOMATICALLY PUSHES TO KITCHEN DISPLAY (KDS)!
  const handlePaymentSuccess = (order: CompletedOrder) => {
    setCompletedOrders([order, ...completedOrders]);
    setIsPaymentOpen(false);
    setActiveReceiptOrder(order);
    setIsReceiptOpen(true);
    setCartItems([]);
    setSelectedDiscount(INITIAL_DISCOUNTS[0]);
    setGuestName('');

    // AUTOMATIC INTEGRATION: Forward to Kitchen KDS
    const newKitchenTicket: KitchenTicket = {
      id: `kt_${Date.now()}`,
      orderNumber: order.orderNumber,
      timestamp: formatDateTime(),
      createdAt: Date.now(),
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      items: [...order.items],
      status: 'pending',
    };
    setKitchenTickets((prev) => [newKitchenTicket, ...prev]);

    // Update table status if dine-in
    if (order.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.name.includes(order.tableNumber!)
            ? { ...t, status: 'occupied', activeOrderTotal: order.grandTotal, currentGuest: order.customerName }
            : t
        )
      );
    }
  };

  // Guest Checkout from Split Bill
  const handleProceedGuestCheckout = (guestTitle: string, guestItems: CartItem[]) => {
    setIsSplitBillOpen(false);
    setCartItems(guestItems);
    setGuestName(`${guestName || 'Tamu'} (${guestTitle})`);
    setIsPaymentOpen(true);
  };

  // Kitchen KDS Action Handler
  const handleUpdateTicketStatus = (ticketId: string, nextStatus: KitchenStatus) => {
    setKitchenTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
    );
  };

  const handleClearCompletedTickets = () => {
    setKitchenTickets((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  // Owner Management Handlers
  const handleQuickToggleStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextBadge =
            p.badge === 'Tersedia'
              ? 'Stok Menipis'
              : p.badge === 'Stok Menipis'
              ? 'Habis'
              : 'Tersedia';
          return { ...p, badge: nextBadge };
        }
        return p;
      })
    );
  };

  const handleQuickUpdatePrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, basePrice: newPrice } : p))
    );
  };

  const handleSaveMenuProduct = (savedProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === savedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      }
      return [savedProduct, ...prev];
    });
    setProductToEdit(null);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (currentUser && currentRole === 'cashier' && cartItems.length > 0 && !isPaymentOpen) {
          setIsPaymentOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setVariantProduct(null);
        setIsPaymentOpen(false);
        setIsSplitBillOpen(false);
        setIsShiftModalOpen(false);
        setIsTableMapOpen(false);
        setIsHoldModalOpen(false);
        setIsReceiptOpen(false);
        setIsHistoryOpen(false);
        setIsBarcodeModalOpen(false);
        setIsEditMenuModalOpen(false);
        setIsLogoutModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, isPaymentOpen, currentRole, currentUser]);

  // 1. If not logged in -> SHOW AUTHENTICATION LOGIN CARD
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Logged-in State -> SHOW FULL POS & WORKSPACE
  return (
    <div className="h-screen w-screen flex flex-col bg-stone-950 text-amber-50 overflow-hidden font-sans">
      {/* Header Navigation Bar with User Profile and Logout */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        drawerCash={currentDrawerCash}
        holdCount={holdOrders.length}
        activeKitchenTicketsCount={activeKitchenTicketsCount}
        onOpenHoldModal={() => setIsHoldModalOpen(true)}
        onOpenTableModal={() => setIsTableMapOpen(true)}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryOpen(true)}
        onRequestLogout={() => setIsLogoutModalOpen(true)}
        isCollapsed={isHeaderCollapsed}
        onToggleCollapse={() => {
          soundManager.playClick();
          setIsHeaderCollapsed((prev) => !prev);
        }}
      />

      {/* Main Workspace (Conditional based on RBAC Role) */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* ROLE 1: PEMILIK / OWNER DASHBOARD */}
        {currentRole === 'owner' && (
          <OwnerDashboard
            products={products}
            completedOrders={completedOrders}
            onOpenAddMenuModal={() => {
              setProductToEdit(null);
              setIsEditMenuModalOpen(true);
            }}
            onOpenEditMenuModal={(p) => {
              setProductToEdit(p);
              setIsEditMenuModalOpen(true);
            }}
            onQuickToggleStock={handleQuickToggleStock}
            onQuickUpdatePrice={handleQuickUpdatePrice}
            onSwitchRole={setCurrentRole}
          />
        )}

        {/* ROLE 2: KASIR / CASHIER POS SPLIT VIEW (RESPONSIVE & ADAPTIVE) */}
        {currentRole === 'cashier' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Mobile Tab Switcher (< md) */}
            <div className="flex md:hidden bg-stone-900 border-b border-stone-800 p-1.5 gap-1.5 shrink-0 z-10 w-full select-none">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setMobilePosTab('catalog');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  mobilePosTab === 'catalog'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Katalog Menu</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setMobilePosTab('cart');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  mobilePosTab === 'cart'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Keranjang Tagihan</span>
                {totalCartCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-stone-950 text-amber-300 font-bold">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Left Panel: Catalog & Menu Search (Responsive: hidden on mobile if cart tab active) */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${mobilePosTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
              <ProductCatalog
                products={products}
                onSelectProduct={handleSelectProduct}
                onOpenBarcodeModal={() => setIsBarcodeModalOpen(true)}
              />
            </div>

            {/* Right Panel: Cart & Active Bill (Responsive: hidden on mobile if catalog tab active) */}
            <div className={`h-full ${mobilePosTab === 'catalog' ? 'hidden md:flex' : 'flex'} md:w-[380px] lg:w-[420px] xl:w-[460px] shrink-0`}>
              <CartPanel
                items={cartItems}
                orderType={orderType}
                tableNumber={tableNumber}
                guestName={guestName}
                selectedDiscount={selectedDiscount}
                onOrderTypeChange={setOrderType}
                onTableNumberChange={setTableNumber}
                onGuestNameChange={setGuestName}
                onDiscountChange={setSelectedDiscount}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateItemNotes={handleUpdateItemNotes}
                onClearCart={handleClearCart}
                onOpenSplitBill={() => setIsSplitBillOpen(true)}
                onHoldOrder={handleHoldOrder}
                onPrintKitchenTicket={handlePrintKitchenTicket}
                onOpenCheckout={() => setIsPaymentOpen(true)}
                onOpenTableMap={() => setIsTableMapOpen(true)}
                onBackToCatalog={() => setMobilePosTab('catalog')}
              />
            </div>

            {/* Floating Mobile Cart Bar (< md) when browsing Catalog with items */}
            {mobilePosTab === 'catalog' && totalCartCount > 0 && (
              <div
                onClick={() => {
                  soundManager.playClick();
                  setMobilePosTab('cart');
                }}
                className="fixed bottom-3 left-3 right-3 md:hidden bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold p-3 rounded-2xl shadow-2xl flex items-center justify-between z-30 cursor-pointer active:scale-95 transition-all border border-amber-400/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-mono text-xs font-black shadow-inner">
                    {totalCartCount}
                  </div>
                  <div className="text-left leading-tight">
                    <span className="text-[10px] text-stone-900 font-semibold block uppercase tracking-wider">Total Tagihan</span>
                    <span className="text-sm font-black font-mono">{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black bg-stone-950/20 px-3 py-1.5 rounded-xl">
                  <span>Lihat Keranjang</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROLE 3: DAPUR / KITCHEN DISPLAY SYSTEM (KDS) */}
        {currentRole === 'kitchen' && (
          <KitchenDisplay
            tickets={kitchenTickets}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onClearCompletedTickets={handleClearCompletedTickets}
          />
        )}
      </main>

      {/* Interactive Modals */}
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <LogoutConfirmModal
          currentUser={currentUser}
          onConfirmLogout={handleConfirmLogout}
          onClose={() => setIsLogoutModalOpen(false)}
        />
      )}

      {/* Modal 1: Product Variant Options Modifier */}
      {variantProduct && (
        <VariantModal
          product={variantProduct}
          onClose={() => setVariantProduct(null)}
          onAddToCart={handleAddCustomizedItem}
        />
      )}

      {/* Modal 2: Split Bill */}
      {isSplitBillOpen && (
        <SplitBillModal
          items={cartItems}
          orderType={orderType}
          tableNumber={tableNumber}
          onClose={() => setIsSplitBillOpen(false)}
          onProceedGuestCheckout={handleProceedGuestCheckout}
        />
      )}

      {/* Modal 3: Payment Checkout Screen */}
      {isPaymentOpen && (
        <PaymentModal
          items={cartItems}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountLabel={selectedDiscount.value > 0 ? selectedDiscount.name : undefined}
          tax={taxPB1}
          serviceCharge={serviceCharge}
          grandTotal={grandTotal}
          orderType={orderType}
          tableNumber={tableNumber}
          guestName={guestName}
          cashierName={currentUser.name}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Modal 4: Shift Recap & Cash In/Out */}
      {isShiftModalOpen && (
        <ShiftRecapModal
          cashierName={currentUser.name}
          initialDrawerCash={initialDrawerCash}
          completedOrders={completedOrders}
          cashAdjustments={cashAdjustments}
          onAddCashAdjustment={(adj) => setCashAdjustments([adj, ...cashAdjustments])}
          onClose={() => setIsShiftModalOpen(false)}
        />
      )}

      {/* Modal 5: Table Map & Reservation Floor Plan */}
      {isTableMapOpen && (
        <TableMapModal
          tables={tables}
          selectedTableNumber={tableNumber}
          onSelectTable={(table) => {
            setOrderType('dine_in');
            setTableNumber(table.name.replace(/\D/g, ''));
            if (table.currentGuest) setGuestName(table.currentGuest);
          }}
          onClose={() => setIsTableMapOpen(false)}
        />
      )}

      {/* Modal 6: Parked / Hold Orders Manager */}
      {isHoldModalOpen && (
        <HoldOrdersModal
          holdOrders={holdOrders}
          onRestoreHoldOrder={handleRestoreHoldOrder}
          onDeleteHoldOrder={handleDeleteHoldOrder}
          onClose={() => setIsHoldModalOpen(false)}
        />
      )}

      {/* Modal 7: Thermal Receipt Simulation Preview */}
      {isReceiptOpen && activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setIsReceiptOpen(false)}
          onNewTransaction={() => {
            setIsReceiptOpen(false);
            setCartItems([]);
          }}
        />
      )}

      {/* Modal 8: Transaction History & Reprint */}
      {isHistoryOpen && (
        <HistoryModal
          orders={completedOrders}
          onSelectOrderForReprint={(order) => {
            setActiveReceiptOrder(order);
            setIsHistoryOpen(false);
            setIsReceiptOpen(true);
          }}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Modal 9: Barcode / SKU Scanner Simulation */}
      {isBarcodeModalOpen && (
        <BarcodeScannerModal
          products={products}
          onScanProduct={handleSelectProduct}
          onClose={() => setIsBarcodeModalOpen(false)}
        />
      )}

      {/* Modal 10: Owner Edit / Add Menu Modal */}
      {isEditMenuModalOpen && (
        <EditMenuModal
          productToEdit={productToEdit}
          onSaveProduct={handleSaveMenuProduct}
          onClose={() => {
            setIsEditMenuModalOpen(false);
            setProductToEdit(null);
          }}
        />
      )}
    </div>
  );
}
