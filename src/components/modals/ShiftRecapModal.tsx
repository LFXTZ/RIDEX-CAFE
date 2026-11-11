import React, { useState } from 'react';
import { 
  X, 
  BarChart3, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Printer, 
  Clock, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { CashAdjustment, CompletedOrder } from '../../types/pos';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface ShiftRecapModalProps {
  cashierName: string;
  initialDrawerCash: number;
  completedOrders: CompletedOrder[];
  cashAdjustments: CashAdjustment[];
  onAddCashAdjustment: (adj: CashAdjustment) => void;
  onClose: () => void;
}

export const ShiftRecapModal: React.FC<ShiftRecapModalProps> = ({
  cashierName,
  initialDrawerCash,
  completedOrders,
  cashAdjustments,
  onAddCashAdjustment,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'adjust'>('summary');
  const [adjType, setAdjType] = useState<'in' | 'out'>('in');
  const [adjAmount, setAdjAmount] = useState<string>('50000');
  const [adjReason, setAdjReason] = useState<string>('');
  const [showPrintBanner, setShowPrintBanner] = useState<boolean>(false);

  // Sales Totals by Payment Method
  const cashSales = completedOrders.reduce((sum, ord) => {
    if (ord.paymentMethod === 'cash') return sum + ord.grandTotal;
    if (ord.paymentMethod === 'split' && ord.splitDetails) {
      const c = ord.splitDetails.find((d) => d.method === 'cash');
      return sum + (c ? c.amount : 0);
    }
    return sum;
  }, 0);

  const qrisSales = completedOrders.reduce((sum, ord) => {
    if (ord.paymentMethod === 'qris') return sum + ord.grandTotal;
    if (ord.paymentMethod === 'split' && ord.splitDetails) {
      const q = ord.splitDetails.find((d) => d.method === 'qris');
      return sum + (q ? q.amount : 0);
    }
    return sum;
  }, 0);

  const cardSales = completedOrders.reduce((sum, ord) => {
    if (ord.paymentMethod === 'card') return sum + ord.grandTotal;
    if (ord.paymentMethod === 'split' && ord.splitDetails) {
      const c = ord.splitDetails.find((d) => d.method === 'card');
      return sum + (c ? c.amount : 0);
    }
    return sum;
  }, 0);

  const ewalletSales = completedOrders.reduce((sum, ord) => {
    if (ord.paymentMethod === 'ewallet') return sum + ord.grandTotal;
    return sum;
  }, 0);

  const totalGrossSales = completedOrders.reduce((sum, ord) => sum + ord.grandTotal, 0);

  // Cash In and Cash Out sums
  const totalCashIn = cashAdjustments
    .filter((a) => a.type === 'in')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalCashOut = cashAdjustments
    .filter((a) => a.type === 'out')
    .reduce((sum, a) => sum + a.amount, 0);

  // Expected Physical Drawer Cash
  const expectedDrawerCash = initialDrawerCash + cashSales + totalCashIn - totalCashOut;

  const handleSaveAdjustment = () => {
    const num = parseInt(adjAmount.replace(/\D/g, '') || '0', 10);
    if (num <= 0 || !adjReason.trim()) {
      soundManager.playAlert();
      return;
    }

    soundManager.playClick();
    onAddCashAdjustment({
      id: `adj_${Date.now()}`,
      type: adjType,
      amount: num,
      reason: adjReason.trim(),
      timestamp: formatDateTime(),
      cashier: cashierName,
    });

    setAdjReason('');
    setActiveTab('summary');
  };

  const handlePrintReport = () => {
    soundManager.playClick();
    setShowPrintBanner(true);
    setTimeout(() => {
      setShowPrintBanner(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Rekap Shift & Laci Kasir</h3>
              <p className="text-xs text-slate-400">Shift Pagi · {cashierName} · Main Outlet</p>
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

        {/* Tab switcher: Summary vs Cash In/Out */}
        <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('summary');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'summary'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ringkasan Penjualan & Saldo Laci
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('adjust');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'adjust'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Catat Cash In / Cash Out (Petty Cash)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showPrintBanner && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Laporan X-Report Shift berhasil dikirim ke printer thermal kasir!</span>
            </div>
          )}

          {activeTab === 'summary' ? (
            <>
              {/* Highlight Drawer Cash Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">
                    Total Uang Fisik Kasir Seharusnya di Laci:
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
                    {formatRupiah(expectedDrawerCash)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Modal Awal ({formatRupiah(initialDrawerCash)}) + Tunai ({formatRupiah(cashSales)}) + In ({formatRupiah(totalCashIn)}) - Out ({formatRupiah(totalCashOut)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Total Transaksi:</span>
                  <span className="text-lg font-bold font-mono text-white">
                    {completedOrders.length} Struk
                  </span>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Rincian Penjualan per Metode Pembayaran
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Tunai (Cash)</span>
                    <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                      {formatRupiah(cashSales)}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">QRIS Standar</span>
                    <span className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
                      {formatRupiah(qrisSales)}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Debit / Kartu</span>
                    <span className="text-sm font-bold font-mono text-indigo-400 tabular-nums">
                      {formatRupiah(cardSales)}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">E-Wallet</span>
                    <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                      {formatRupiah(ewalletSales)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gross Sales Total */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Total Omset Kotor Penjualan (Gross Sales)</span>
                <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  {formatRupiah(totalGrossSales)}
                </span>
              </div>

              {/* Recent Adjustments Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Riwayat Cash In & Cash Out Shift Ini
                </h4>
                {cashAdjustments.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    Belum ada penyesuaian kas masuk / kas keluar selama shift berlangsung.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {cashAdjustments.map((a) => (
                      <div
                        key={a.id}
                        className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {a.type === 'in' ? (
                            <ArrowDownCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <div>
                            <span className="text-slate-200 font-medium block">{a.reason}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{a.timestamp}</span>
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            a.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {a.type === 'in' ? `+${formatRupiah(a.amount)}` : `-${formatRupiah(a.amount)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* CASH ADJUSTMENT FORM */
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Tipe Penyesuaian Kas Laci:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjType('in')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjType === 'in'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    <span>Cash In (Kas Masuk / Tambah Modal)</span>
                  </button>
                  <button
                    onClick={() => setAdjType('out')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjType === 'out'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4 text-rose-400" />
                    <span>Cash Out (Kas Keluar / Biaya Operasional)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nominal Uang (Rupiah):
                </label>
                <input
                  type="text"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Keterangan / Alasan Kasir:
                </label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Contoh: Tambah uang kembalian pecahan Rp 5.000 atau Beli es batu darurat"
                />
              </div>

              <button
                onClick={handleSaveAdjustment}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Simpan Penyesuaian Kas Laci
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cetak X-Report Shift</span>
          </button>

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
