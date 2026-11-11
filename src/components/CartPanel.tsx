import React, { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Utensils, 
  ShoppingBag, 
  Truck, 
  Tag, 
  Split, 
  Bookmark, 
  ChefHat, 
  CreditCard,
  MessageSquare,
  FileText,
  User,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { CartItem, OrderType, Discount } from '../types/pos';
import { INITIAL_DISCOUNTS } from '../data/mockProducts';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface CartPanelProps {
  items: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  guestName: string;
  selectedDiscount: Discount;
  onOrderTypeChange: (type: OrderType) => void;
  onTableNumberChange: (table: string) => void;
  onGuestNameChange: (name: string) => void;
  onDiscountChange: (discount: Discount) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onUpdateItemNotes: (cartItemId: string, notes: string) => void;
  onClearCart: () => void;
  onOpenSplitBill: () => void;
  onHoldOrder: () => void;
  onPrintKitchenTicket: () => void;
  onOpenCheckout: () => void;
  onOpenTableMap: () => void;
  onBackToCatalog?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  items,
  orderType,
  tableNumber,
  guestName,
  selectedDiscount,
  onOrderTypeChange,
  onTableNumberChange,
  onGuestNameChange,
  onDiscountChange,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItemNotes,
  onClearCart,
  onOpenSplitBill,
  onHoldOrder,
  onPrintKitchenTicket,
  onOpenCheckout,
  onOpenTableMap,
  onBackToCatalog,
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputValue, setNoteInputValue] = useState<string>('');
  const [showDiscountSelector, setShowDiscountSelector] = useState<boolean>(false);

  // Math Calculations
  const subtotal = items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

  const discountAmount =
    selectedDiscount.type === 'percent'
      ? Math.round((subtotal * selectedDiscount.value) / 100)
      : Math.min(subtotal, selectedDiscount.value);

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxPB1 = Math.round(taxableSubtotal * 0.10); // 10% Pajak Restoran PB1
  const serviceCharge = Math.round(taxableSubtotal * 0.05); // 5% Service Charge
  const grandTotal = taxableSubtotal + taxPB1 + serviceCharge;

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleStartEditNote = (item: CartItem) => {
    soundManager.playClick();
    setEditingNoteId(item.cartItemId);
    setNoteInputValue(item.notes || '');
  };

  const handleSaveNote = (cartItemId: string) => {
    soundManager.playClick();
    onUpdateItemNotes(cartItemId, noteInputValue);
    setEditingNoteId(null);
  };

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] xl:w-[460px] h-full flex flex-col bg-stone-900 border-l border-stone-800 shrink-0 select-none">
      {/* Mobile Back Button (< md) */}
      {onBackToCatalog && (
        <div className="p-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between md:hidden shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onBackToCatalog();
            }}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Menu</span>
          </button>
          <span className="text-xs font-mono font-bold text-amber-400">
            {totalItemCount} Item
          </span>
        </div>
      )}

      {/* Header: Order Type Tabs */}
      <div className="p-3 bg-stone-900/95 border-b border-stone-800 flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => {
              soundManager.playClick();
              onOrderTypeChange('dine_in');
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'dine_in'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine-In</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onOrderTypeChange('takeaway');
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'takeaway'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeaway</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onOrderTypeChange('delivery');
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'delivery'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Customer & Table details inputs */}
        <div className="flex items-center gap-2">
          {orderType === 'dine_in' ? (
            <div className="flex-1 flex items-center gap-1 bg-stone-950 px-2.5 py-1.5 rounded-lg border border-stone-800">
              <Hash className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <input
                type="text"
                placeholder="No. Meja (mis: 04)"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                className="w-full bg-transparent text-xs text-amber-50 placeholder-stone-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenTableMap();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 whitespace-nowrap"
                title="Pilih Meja dari Peta"
              >
                Peta
              </button>
            </div>
          ) : null}

          <div className="flex-1 flex items-center gap-1.5 bg-stone-950 px-2.5 py-1.5 rounded-lg border border-stone-800">
            <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={guestName}
              onChange={(e) => onGuestNameChange(e.target.value)}
              className="w-full bg-transparent text-xs text-amber-50 placeholder-stone-500 focus:outline-none"
            />
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Kosongkan semua pesanan di keranjang?')) {
                  soundManager.playAlert();
                  onClearCart();
                }
              }}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition-colors"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <div className="w-14 h-14 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center text-stone-600 mb-3 shadow-inner">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-stone-300 mb-1">Keranjang Masih Kosong</h4>
            <p className="text-xs text-stone-500 max-w-[240px] leading-relaxed">
              Pilih menu dari katalog di sebelah kiri untuk memulai pesanan transaksi kasir.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const hasVariantDetails =
              item.size !== 'Regular' ||
              item.sugarLevel !== '100%' ||
              item.iceLevel !== 'Normal' ||
              (item.extras && item.extras.length > 0);

            return (
              <div
                key={item.cartItemId}
                className="bg-stone-950/80 border border-stone-800 rounded-xl p-2.5 hover:border-amber-600/30 transition-colors flex flex-col gap-1.5 group"
              >
                {/* Item Header: Name & Line Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-amber-50 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      @ {formatRupiah(item.finalUnitPrice)}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-amber-400 font-mono tabular-nums shrink-0">
                    {formatRupiah(item.finalUnitPrice * item.quantity)}
                  </span>
                </div>

                {/* Variant tags & extras */}
                {hasVariantDetails && (
                  <div className="text-[10px] text-stone-400 leading-tight bg-stone-900 px-2 py-1 rounded border border-stone-800 flex flex-wrap gap-x-1.5 gap-y-0.5">
                    {item.size !== 'Regular' && <span className="text-amber-300">Size: {item.size}</span>}
                    {item.sugarLevel !== '100%' && <span>Gula: {item.sugarLevel}</span>}
                    {item.iceLevel !== 'Normal' && <span>Es: {item.iceLevel}</span>}
                    {item.extras.map((ex, i) => (
                      <span key={i} className="text-amber-400">+{ex.name}</span>
                    ))}
                  </div>
                )}

                {/* Item notes display or editing */}
                {editingNoteId === item.cartItemId ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={noteInputValue}
                      onChange={(e) => setNoteInputValue(e.target.value)}
                      placeholder="Catatan (cth: jangan terlalu manis, less ice)"
                      className="flex-1 bg-stone-900 border border-amber-500/50 rounded px-2 py-1 text-[11px] text-amber-50 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote(item.cartItemId);
                      }}
                    />
                    <button
                      onClick={() => handleSaveNote(item.cartItemId)}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-[10px] font-bold text-stone-950 rounded"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  item.notes && (
                    <div className="text-[10px] text-amber-300/90 italic flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">&ldquo;{item.notes}&rdquo;</span>
                    </div>
                  )
                )}

                {/* Bottom Row: Quantity Controls & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-800 mt-0.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditNote(item)}
                      className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors text-[10px] flex items-center gap-1"
                      title="Tambah / Ubah Catatan Item"
                    >
                      <MessageSquare className="w-3 h-3 text-stone-400" />
                      <span>{item.notes ? 'Edit Catatan' : 'Catatan'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quantity - button */}
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onUpdateQuantity(item.cartItemId, -1);
                      }}
                      className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-750 text-stone-200 flex items-center justify-center transition-colors border border-stone-700"
                      aria-label="Kurangi Jumlah"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="w-6 text-center text-xs font-bold font-mono text-amber-50 tabular-nums">
                      {item.quantity}
                    </span>

                    {/* Quantity + button */}
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onUpdateQuantity(item.cartItemId, 1);
                      }}
                      className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-750 text-stone-200 flex items-center justify-center transition-colors border border-stone-700"
                      aria-label="Tambah Jumlah"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    {/* Delete item button */}
                    <button
                      onClick={() => {
                        soundManager.playAlert();
                        onRemoveItem(item.cartItemId);
                      }}
                      className="p-1 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors ml-1"
                      title="Hapus Item dari Keranjang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Calculation & Summary Box */}
      <div className="p-3.5 bg-stone-950 border-t border-stone-800 flex flex-col gap-2 shrink-0">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>Subtotal ({totalItemCount} item)</span>
          <span className="font-mono text-stone-200 tabular-nums">{formatRupiah(subtotal)}</span>
        </div>

        {/* Discount Row & Selector */}
        <div className="relative">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setShowDiscountSelector(!showDiscountSelector)}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium"
            >
              <Tag className="w-3 h-3" />
              <span>{selectedDiscount.value > 0 ? selectedDiscount.name : 'Tambah Diskon / Promo'}</span>
            </button>
            <span className="font-mono text-amber-400 tabular-nums">
              {discountAmount > 0 ? `-${formatRupiah(discountAmount)}` : 'Rp 0'}
            </span>
          </div>

          {/* Discount Dropdown Selector */}
          {showDiscountSelector && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-stone-900 border border-stone-700 rounded-xl p-2 shadow-2xl z-20 space-y-1">
              <div className="text-[11px] font-semibold text-stone-300 px-2 py-1 border-b border-stone-800">
                Pilih Program Diskon:
              </div>
              {INITIAL_DISCOUNTS.map((disc) => (
                <button
                  key={disc.id}
                  onClick={() => {
                    soundManager.playClick();
                    onDiscountChange(disc);
                    setShowDiscountSelector(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    selectedDiscount.id === disc.id
                      ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span>{disc.name}</span>
                  <span className="font-mono text-[10px] text-stone-400">
                    {disc.type === 'percent' ? `${disc.value}%` : formatRupiah(disc.value)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tax PB1 (10%) & Service Charge (5%) */}
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>Pajak Restoran PB1 (10%)</span>
          <span className="font-mono text-stone-300 tabular-nums">{formatRupiah(taxPB1)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>Service Charge (5%)</span>
          <span className="font-mono text-stone-300 tabular-nums">{formatRupiah(serviceCharge)}</span>
        </div>

        {/* Grand Total Prominent Display */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block">
              Grand Total
            </span>
            <span className="text-[11px] text-amber-400">Termasuk PB1 &amp; Service</span>
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-400 tabular-nums">
            {formatRupiah(grandTotal)}
          </span>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {/* Split Bill */}
          <button
            disabled={items.length === 0}
            onClick={() => {
              soundManager.playClick();
              onOpenSplitBill();
            }}
            className="px-2 py-2 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-[11px] font-medium text-amber-100 border border-stone-700 flex items-center justify-center gap-1 transition-colors"
            title="Pisah Tagihan (Berdasarkan Item / Nominal)"
          >
            <Split className="w-3.5 h-3.5 text-amber-400" />
            <span>Split Bill</span>
          </button>

          {/* Hold Order */}
          <button
            disabled={items.length === 0}
            onClick={() => {
              soundManager.playClick();
              onHoldOrder();
            }}
            className="px-2 py-2 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-[11px] font-medium text-amber-100 border border-stone-700 flex items-center justify-center gap-1 transition-colors"
            title="Simpan Pesanan ke Draf / Parkir"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Hold Bill</span>
          </button>

          {/* Kitchen Ticket */}
          <button
            disabled={items.length === 0}
            onClick={() => {
              soundManager.playClick();
              onPrintKitchenTicket();
            }}
            className="px-2 py-2 bg-stone-800 hover:bg-stone-750 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-[11px] font-medium text-amber-100 border border-stone-700 flex items-center justify-center gap-1 transition-colors"
            title="Cetak Tiket Pesanan Dapur / Bar"
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-400" />
            <span>Dapur</span>
          </button>
        </div>

        {/* Primary Checkout CTA Button */}
        <button
          disabled={items.length === 0}
          onClick={() => {
            soundManager.playClick();
            onOpenCheckout();
          }}
          className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-850 disabled:text-stone-500 disabled:cursor-not-allowed text-stone-950 font-black rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-between active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-stone-950" />
            <span className="text-sm font-black tracking-wide">BAYAR SEKARANG</span>
          </div>
          <span className="text-base font-black font-mono tabular-nums">
            {formatRupiah(grandTotal)}
          </span>
        </button>
      </div>
    </aside>
  );
};
