import React, { useState } from 'react';
import { X, Split, Users, Calculator, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CartItem, OrderType } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface SplitBillModalProps {
  items: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  onClose: () => void;
  onProceedGuestCheckout: (guestName: string, guestItems: CartItem[]) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  items,
  orderType,
  tableNumber,
  onClose,
  onProceedGuestCheckout,
}) => {
  const [splitMode, setSplitMode] = useState<'by_item' | 'even'>('by_item');
  const [evenCount, setEvenCount] = useState<number>(2);

  // By-item distribution: guest 1 and guest 2 allocations
  const [guest1Items, setGuest1Items] = useState<CartItem[]>(() =>
    items.map((item) => ({ ...item }))
  );
  const [guest2Items, setGuest2Items] = useState<CartItem[]>([]);

  // Calculate totals
  const totalOriginal = items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);
  const guest1Subtotal = guest1Items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);
  const guest2Subtotal = guest2Items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

  const moveItemToGuest2 = (item: CartItem) => {
    soundManager.playClick();
    if (item.quantity <= 1) {
      setGuest1Items(guest1Items.filter((i) => i.cartItemId !== item.cartItemId));
    } else {
      setGuest1Items(
        guest1Items.map((i) =>
          i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }

    const existingIn2 = guest2Items.find((i) => i.cartItemId === item.cartItemId);
    if (existingIn2) {
      setGuest2Items(
        guest2Items.map((i) =>
          i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setGuest2Items([...guest2Items, { ...item, quantity: 1 }]);
    }
  };

  const moveItemToGuest1 = (item: CartItem) => {
    soundManager.playClick();
    if (item.quantity <= 1) {
      setGuest2Items(guest2Items.filter((i) => i.cartItemId !== item.cartItemId));
    } else {
      setGuest2Items(
        guest2Items.map((i) =>
          i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }

    const existingIn1 = guest1Items.find((i) => i.cartItemId === item.cartItemId);
    if (existingIn1) {
      setGuest1Items(
        guest1Items.map((i) =>
          i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setGuest1Items([...guest1Items, { ...item, quantity: 1 }]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Split Bill & Pisah Tagihan</h3>
              <p className="text-xs text-slate-400">
                Loka F&B POS Engine · Total Order: {formatRupiah(totalOriginal)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setSplitMode('by_item');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              splitMode === 'by_item'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pisah Berdasarkan Item (Per Tamu)</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setSplitMode('even');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              splitMode === 'even'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Bagi Rata (Equal Split)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {splitMode === 'by_item' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box Tamu 1 */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">Sub-Tagihan Tamu A</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {formatRupiah(guest1Subtotal)}
                    </span>
                  </div>

                  <div className="py-2 space-y-1.5 min-h-[160px]">
                    {guest1Items.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">
                        Semua item dipindahkan ke Tamu B
                      </p>
                    ) : (
                      guest1Items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-200 font-medium block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.quantity}x @ {formatRupiah(item.finalUnitPrice)}
                            </span>
                          </div>
                          <button
                            onClick={() => moveItemToGuest2(item)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded flex items-center gap-1 text-[11px]"
                            title="Pindahkan 1 item ke Tamu B"
                          >
                            <span>Pindah</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  disabled={guest1Items.length === 0}
                  onClick={() => {
                    soundManager.playClick();
                    onProceedGuestCheckout('Tamu A', guest1Items);
                  }}
                  className="w-full mt-3 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bayar Tagihan Tamu A ({formatRupiah(guest1Subtotal)})</span>
                </button>
              </div>

              {/* Box Tamu 2 */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">Sub-Tagihan Tamu B</span>
                    <span className="text-xs font-bold font-mono text-cyan-400">
                      {formatRupiah(guest2Subtotal)}
                    </span>
                  </div>

                  <div className="py-2 space-y-1.5 min-h-[160px]">
                    {guest2Items.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">
                        Klik &quot;Pindah&quot; dari Tamu A untuk memisah pesanan ke sini
                      </p>
                    ) : (
                      guest2Items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <button
                            onClick={() => moveItemToGuest1(item)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded flex items-center gap-1 text-[11px]"
                            title="Kembalikan 1 item ke Tamu A"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Balik</span>
                          </button>

                          <div className="flex-1 min-w-0 text-right">
                            <span className="text-slate-200 font-medium block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.quantity}x @ {formatRupiah(item.finalUnitPrice)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  disabled={guest2Items.length === 0}
                  onClick={() => {
                    soundManager.playClick();
                    onProceedGuestCheckout('Tamu B', guest2Items);
                  }}
                  className="w-full mt-3 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bayar Tagihan Tamu B ({formatRupiah(guest2Subtotal)})</span>
                </button>
              </div>
            </div>
          ) : (
            /* EVEN SPLIT */
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Bagi Rata Antar Jumlah Orang
              </span>

              <div className="flex items-center justify-center gap-3">
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => {
                      soundManager.playClick();
                      setEvenCount(cnt);
                    }}
                    className={`w-12 h-12 rounded-xl text-base font-bold font-mono transition-all border ${
                      evenCount === cnt
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Nominal per Orang:</span>
                <span className="text-2xl font-black font-mono text-cyan-400 block tabular-nums">
                  {formatRupiah(Math.round(totalOriginal / evenCount))}
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Tagihan {formatRupiah(totalOriginal)} dibagi {evenCount} orang
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
