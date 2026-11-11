import React, { useState } from 'react';
import { X, Receipt, Search, Clock, ArrowRight, Printer, CheckCircle2 } from 'lucide-react';
import { CompletedOrder } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface HistoryModalProps {
  orders: CompletedOrder[];
  onSelectOrderForReprint: (order: CompletedOrder) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  orders,
  onSelectOrderForReprint,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    return (
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.tableNumber && o.tableNumber.includes(searchTerm)) ||
      o.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Riwayat Struk & Transaksi Kasir</h3>
              <p className="text-xs text-slate-400">
                Total {orders.length} transaksi berhasil hari ini
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

        {/* Search Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nomor struk (RDX-...), nama tamu, atau no. meja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-300">Belum Ada Transaksi</h4>
              <p className="text-xs text-slate-500 mt-1">
                Transaksi yang telah dibayar akan tersimpan otomatis di sini untuk cetak ulang struk.
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const totalItems = ord.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={ord.orderId}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{ord.orderNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                        {ord.orderType === 'dine_in' ? `Meja ${ord.tableNumber || '-'}` : ord.orderType}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold uppercase">
                        {ord.paymentMethod}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{ord.customerName || 'Pelanggan'}</span>
                      <span className="text-slate-600">·</span>
                      <span>{totalItems} Item</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatRupiah(ord.grandTotal)}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{ord.timestamp} · Kasir: {ord.cashierName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onSelectOrderForReprint(ord);
                    }}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Lihat & Cetak</span>
                  </button>
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
