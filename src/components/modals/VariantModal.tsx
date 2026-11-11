import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, Coffee, SlidersHorizontal } from 'lucide-react';
import { Product, CartItem } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface VariantModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

const AVAILABLE_EXTRAS = [
  { name: 'Extra Double Espresso Shot', price: 8000 },
  { name: 'Caramel Artisan Syrup', price: 5000 },
  { name: 'Vanilla Bean Syrup', price: 5000 },
  { name: 'Roasted Hazelnut Syrup', price: 5000 },
  { name: 'Oatside Barista Oat Milk Sub', price: 7000 },
  { name: 'Fluffy Whipped Cream', price: 4000 },
];

export const VariantModal: React.FC<VariantModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<'Regular' | 'Large'>('Regular');
  const [sugarLevel, setSugarLevel] = useState<'100%' | '50%' | '0%'>('100%');
  const [iceLevel, setIceLevel] = useState<'Normal' | 'Less Ice' | 'No Ice'>('Normal');
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Compute unit price based on modifications
  const unitPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.basePrice;
    if (selectedSize === 'Large') price += 6000;
    const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price, 0);
    return price + extrasTotal;
  }, [product, selectedSize, selectedExtras]);

  const totalCalculated = unitPrice * quantity;

  if (!product) return null;

  const toggleExtra = (extra: { name: string; price: number }) => {
    soundManager.playClick();
    if (selectedExtras.some((e) => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const handleConfirm = () => {
    soundManager.playClick();
    const newItem: CartItem = {
      cartItemId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      name: product.name,
      basePrice: product.basePrice,
      finalUnitPrice: unitPrice,
      quantity,
      size: selectedSize,
      sugarLevel,
      iceLevel,
      extras: selectedExtras,
      notes: notes.trim() || undefined,
    };
    onAddToCart(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-50">{product.name}</h3>
              <p className="text-xs text-stone-400">Pilihan Varian &amp; Kustomisasi Rasa</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group 1: Ukuran (Size) */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-2 uppercase tracking-wider">
              1. Pilihan Ukuran (Size)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSize('Regular');
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedSize === 'Regular'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold block text-slate-100">Regular (12 oz)</span>
                  <span className="text-[11px] text-slate-400">Standar Kafe</span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-400">+Rp 0</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSize('Large');
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedSize === 'Large'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold block text-slate-100">Large (16 oz)</span>
                  <span className="text-[11px] text-slate-400">Ukuran Besar</span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-400">+Rp 6.000</span>
              </button>
            </div>
          </div>

          {/* Group 2: Level Gula (Sugar Level) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              2. Level Kemanisan (Sugar Level)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['100%', '50%', '0%'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSugarLevel(level);
                  }}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    sugarLevel === level
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'
                  }`}
                >
                  <span className="text-xs block">
                    {level === '100%' ? 'Normal (100%)' : level === '50%' ? 'Less (50%)' : 'No Sugar (0%)'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: Level Es (Ice Level) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              3. Level Es (Ice Level)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Normal', 'Less Ice', 'No Ice'] as const).map((ice) => (
                <button
                  key={ice}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setIceLevel(ice);
                  }}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    iceLevel === ice
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'
                  }`}
                >
                  <span className="text-xs block">{ice}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group 4: Extra Shots / Syrups / Add-ons */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              4. Tambahan & Topping (Opsional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_EXTRAS.map((extra) => {
                const isSelected = selectedExtras.some((e) => e.name === extra.name);
                return (
                  <button
                    key={extra.name}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs leading-tight">{extra.name}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 shrink-0 ml-2">
                      +{formatRupiah(extra.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              5. Catatan Khusus Barista / Dapur
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pisahkan es di cup terpisah, tanpa sedotan plastik..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity & Confirm CTA */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => {
                soundManager.playClick();
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 flex items-center justify-center"
              aria-label="Kurangi Qty"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-mono font-bold text-amber-50 tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => {
                soundManager.playClick();
                setQuantity(quantity + 1);
              }}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 flex items-center justify-center"
              aria-label="Tambah Qty"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-xl transition-all shadow-lg shadow-amber-950/30 flex items-center justify-between text-xs sm:text-sm active:scale-[0.99]"
          >
            <span>Tambahkan ke Keranjang</span>
            <span className="font-mono font-black text-sm sm:text-base tabular-nums">
              {formatRupiah(totalCalculated)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
