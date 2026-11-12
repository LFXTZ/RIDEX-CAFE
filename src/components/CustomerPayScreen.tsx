import React, { useState } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Smartphone, 
  Coffee, 
  ArrowRight,
  ExternalLink,
  Receipt,
  Store
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface CustomerPayScreenProps {
  orderId: string;
  amount: number;
  tableNumber: string;
}

export const CustomerPayScreen: React.FC<CustomerPayScreenProps> = ({
  orderId,
  amount,
  tableNumber,
}) => {
  const [selectedApp, setSelectedApp] = useState<string>('gopay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentTime, setPaymentTime] = useState<string>('');

  const paymentApps = [
    { id: 'gopay', name: 'GoPay', color: 'from-blue-600 to-cyan-500', badge: 'E-Wallet' },
    { id: 'ovo', name: 'OVO', color: 'from-purple-700 to-indigo-600', badge: 'E-Wallet' },
    { id: 'dana', name: 'DANA', color: 'from-sky-600 to-blue-500', badge: 'E-Wallet' },
    { id: 'shopeepay', name: 'ShopeePay', color: 'from-orange-600 to-amber-500', badge: 'E-Wallet' },
    { id: 'bca', name: 'BCA Mobile', color: 'from-blue-800 to-blue-900', badge: 'Mobile Banking' },
    { id: 'mandiri', name: 'Mandiri Livin', color: 'from-amber-600 to-yellow-600', badge: 'Mobile Banking' },
  ];

  const handleConfirmPayment = () => {
    soundManager.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      soundManager.playSuccess();
      setIsProcessing(false);
      setIsPaid(true);
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setPaymentTime(timeStr);

      const syncPayload = {
        type: 'QRIS_PAID',
        orderId,
        amount,
        table: tableNumber,
        app: selectedApp,
        timestamp: Date.now(),
      };

      // 1. BroadcastChannel across open tabs
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('ridex_qris_sync');
          bc.postMessage(syncPayload);
          setTimeout(() => bc.close(), 1000);
        } catch (e) {
          console.warn('BroadcastChannel error:', e);
        }
      }

      // 2. LocalStorage event trigger for cross-tab sync
      try {
        localStorage.setItem('ridex_last_qris_paid', JSON.stringify(syncPayload));
      } catch (e) {
        console.warn('localStorage error:', e);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-stone-950 text-amber-50 flex flex-col items-center justify-between p-4 sm:p-6 font-sans select-none overflow-y-auto">
      {/* Background glow effects */}
      <div className="fixed -top-24 -left-24 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-24 -right-24 w-80 h-80 bg-amber-700/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto my-auto flex flex-col space-y-4 relative z-10">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#f5ede4] p-1.5 shadow-xl border border-amber-800/30 flex items-center justify-center overflow-hidden">
            <img 
              src="/assets/aistudio/extra-large_4af77947.png" 
              alt="Ridex Cafe Mascot" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase font-sans">RIDEX CAFE</h1>
            <p className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">YOUR DAILY ESCAPE</p>
            <p className="text-xs text-stone-400 mt-0.5">Outlet Cilacap, Jawa Tengah</p>
          </div>
        </div>

        {!isPaid ? (
          /* PAYMENT FORM VIEW */
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-xl">
            {/* Tagline Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Portal Checkout QRIS Pelanggan</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded font-black tracking-wider uppercase">
                QRIS Dinamis
              </span>
            </div>

            {/* Order Bill Card */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800/90 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>No. Tagihan Pesanan:</span>
                <span className="font-mono font-bold text-stone-200">{orderId}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Lokasi Meja:</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 font-mono font-bold text-xs">
                  Meja {tableNumber}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Total yang Harus Dibayar:</span>
                  <span className="text-[10px] text-stone-500">Termasuk PB1 &amp; Service</span>
                </div>
                <span className="text-2xl font-black font-mono text-amber-400 tabular-nums">
                  {formatRupiah(amount)}
                </span>
              </div>
            </div>

            {/* Choose E-Wallet / M-Banking App */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-300 block">
                Pilih Aplikasi Pembayaran Anda:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedApp(app.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedApp === app.id
                        ? 'border-amber-500 bg-amber-600/15 shadow-md shadow-amber-950/50'
                        : 'border-stone-800 bg-stone-950/80 hover:bg-stone-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-stone-200">{app.name}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedApp === app.id
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-stone-600'
                      }`}>
                        {selectedApp === app.id && <div className="w-1.5 h-1.5 rounded-full bg-stone-950"></div>}
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1">{app.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Merchant NMID Verification Info */}
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 text-[11px] text-stone-400 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span>Merchant: <strong>RIDEX CAFE CILACAP</strong></span>
                <span className="font-mono text-stone-400">NMID: ID1020268884920</span>
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                Pembayaran Anda dilindungi enkripsi standar Bank Indonesia (QRIS ASPI).
              </p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black rounded-xl transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] text-base"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Pembayaran...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-stone-950" />
                  <span>Konfirmasi &amp; Bayar Sekarang ({formatRupiah(amount)})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-center space-y-5 animate-fadeIn backdrop-blur-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase tracking-wider">
                Pembayaran Berhasil!
              </span>
              <h2 className="text-xl font-black text-white pt-1">Terima Kasih!</h2>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Transaksi QRIS Anda telah diverifikasi otomatis oleh sistem kasir Ridex Cafe.
              </p>
            </div>

            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">No. Transaksi:</span>
                <span className="font-mono font-bold text-stone-200">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Total Dibayar:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Meja:</span>
                <span className="font-mono text-stone-300">Meja {tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Waktu Bayar:</span>
                <span className="font-mono text-stone-300">{paymentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Metode:</span>
                <span className="font-bold text-amber-400 uppercase">QRIS ({selectedApp})</span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-xl text-xs text-amber-300/90 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Pesanan Anda telah diteruskan ke Barista &amp; Dapur. Silakan duduk manis menunggu pesanan disajikan!</span>
            </div>

            <div className="pt-2 text-[11px] text-stone-500 font-mono">
              Password WiFi: <strong className="text-stone-300">ridexcoffee2026</strong> · IG: <strong className="text-stone-300">@ridexcafe.cilacap</strong>
            </div>
          </div>
        )}

        {/* Footer info */}
        <p className="text-[10px] text-stone-500 text-center font-mono">
          Powered by Loka POS Engine · Ridex Cafe QRIS Integration
        </p>
      </div>
    </div>
  );
};
