import React from 'react';
import { X, Bookmark, ArrowRight, Trash2, Clock, Utensils } from 'lucide-react';
import { HoldOrder } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface HoldOrdersModalProps {
  holdOrders: HoldOrder[];
  onRestoreHoldOrder: (order: HoldOrder) => void;
  onDeleteHoldOrder: (id: string) => void;
  onClose: () => void;
}

export const HoldOrdersModal: React.FC<HoldOrdersModalProps> = ({
  holdOrders,
  onRestoreHoldOrder,
  onDeleteHoldOrder,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Daftar Hold Order / Tagihan Diparkir</h3>
              <p className="text-xs text-slate-400">
                {holdOrders.length} Pesanan tersimpan sementara
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {holdOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-300">Tidak Ada Order yang Ditahan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Gunakan tombol &quot;Hold Bill&quot; di keranjang untuk menyimpan transaksi sementara saat tamu masih ingin menambah menu.
              </p>
            </div>
          ) : (
            holdOrders.map((hold) => {
              const totalItems = hold.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={hold.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{hold.holdNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase">
                        {hold.orderType === 'dine_in' ? `Meja ${hold.tableNumber || '-'}` : hold.orderType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{hold.customerName || 'Tamu'}</span>
                      <span className="text-slate-600">·</span>
                      <span>{totalItems} Item</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-emerald-400 font-semibold">{formatRupiah(hold.subtotal)}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{hold.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        soundManager.playAlert();
                        onDeleteHoldOrder(hold.id);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Batalkan / Hapus Draf"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onRestoreHoldOrder(hold);
                        onClose();
                      }}
                      className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>Lanjutkan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
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
