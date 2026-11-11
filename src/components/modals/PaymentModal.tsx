import React, { useState, useMemo } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  Copy,
  Receipt
} from 'lucide-react';
import { CartItem, CompletedOrder, OrderType, PaymentMethod, PaymentRecord } from '../../types/pos';
import { formatRupiah, generateOrderNumber, formatDateTime } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface PaymentModalProps {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel?: string;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  orderType: OrderType;
  tableNumber: string;
  guestName: string;
  cashierName: string;
  onClose: () => void;
  onPaymentSuccess: (order: CompletedOrder) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  items,
  subtotal,
  discountAmount,
  discountLabel,
  tax,
  serviceCharge,
  grandTotal,
  orderType,
  tableNumber,
  guestName,
  cashierName,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);
  const [cashInputValue, setCashInputValue] = useState<string>(grandTotal.toString());
  
  // Split payment state
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [splitFirstAmount, setSplitFirstAmount] = useState<number>(Math.round(grandTotal / 2));
  const [splitSecondMethod, setSplitSecondMethod] = useState<PaymentMethod>('qris');

  // Change Calculation
  const change = useMemo(() => {
    if (selectedMethod === 'cash') {
      return Math.max(0, cashTendered - grandTotal);
    }
    return 0;
  }, [selectedMethod, cashTendered, grandTotal]);

  const isCashInsufficient = selectedMethod === 'cash' && cashTendered < grandTotal;

  const handleCashShortcut = (amount: number) => {
    soundManager.playClick();
    setCashTendered(amount);
    setCashInputValue(amount.toString());
  };

  const handleCashInputChange = (val: string) => {
    const cleanNum = parseInt(val.replace(/\D/g, '') || '0', 10);
    setCashInputValue(cleanNum.toString());
    setCashTendered(cleanNum);
  };

  const handleFinishTransaction = () => {
    if (selectedMethod === 'cash' && isCashInsufficient) {
      soundManager.playAlert();
      return;
    }

    soundManager.playCashDrawer();
    setTimeout(() => {
      soundManager.playSuccess();
    }, 150);

    let splitDetails: PaymentRecord[] | undefined = undefined;
    if (isSplitPayment) {
      const remaining = grandTotal - splitFirstAmount;
      splitDetails = [
        { method: 'cash', amount: splitFirstAmount },
        { method: splitSecondMethod, amount: remaining },
      ];
    }

    const completedOrder: CompletedOrder = {
      orderId: `ord_${Date.now()}`,
      orderNumber: generateOrderNumber(),
      timestamp: formatDateTime(),
      cashierName,
      orderType,
      tableNumber: orderType === 'dine_in' ? tableNumber || '01' : undefined,
      customerName: guestName || (orderType === 'dine_in' ? `Tamu Meja ${tableNumber || '01'}` : 'Pelanggan'),
      items,
      subtotal,
      discountAmount,
      discountLabel,
      tax,
      serviceCharge,
      grandTotal,
      paymentMethod: isSplitPayment ? 'split' : selectedMethod,
      amountPaid: selectedMethod === 'cash' ? cashTendered : grandTotal,
      change,
      splitDetails,
    };

    onPaymentSuccess(completedOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-amber-50 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>Pembayaran &amp; Checkout</span>
            </h3>
            <p className="text-xs text-stone-400">
              {orderType === 'dine_in' ? `Dine-In · Meja ${tableNumber || '01'}` : orderType.toUpperCase()} · {items.length} Menu
            </p>
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

        {/* Grand Total Banner */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 block font-medium">Total Yang Harus Dibayar:</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              setIsSplitPayment(!isSplitPayment);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isSplitPayment
                ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {isSplitPayment ? '✓ Mode Split Payment Aktif' : 'Opsi Split Payment (2 Metode)'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isSplitPayment ? (
            <>
              {/* Payment Method Tabs */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-2 uppercase tracking-wider">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedMethod('cash');
                      setCashTendered(grandTotal);
                      setCashInputValue(grandTotal.toString());
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedMethod === 'cash'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">Tunai (Cash)</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedMethod('qris');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedMethod === 'qris'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">QRIS Standar</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedMethod('card');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedMethod === 'card'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">Kartu Debit/Kredit</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedMethod('ewallet');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedMethod === 'ewallet'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">E-Wallet</span>
                  </button>
                </div>
              </div>

              {/* CASH INPUT & QUICK DENOMINATIONS */}
              {selectedMethod === 'cash' && (
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300">
                      Uang Diterima dari Pelanggan:
                    </label>
                    <div className="relative w-44">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-500">Rp</span>
                      <input
                        type="text"
                        value={cashInputValue}
                        onChange={(e) => handleCashInputChange(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-8 pr-3 py-1.5 text-sm font-mono font-bold text-amber-50 text-right focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Cash Quick Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    <button
                      onClick={() => handleCashShortcut(grandTotal)}
                      className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-semibold text-amber-400"
                    >
                      Uang Pas
                    </button>
                    <button
                      onClick={() => handleCashShortcut(50000)}
                      className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono text-stone-200"
                    >
                      50.000
                    </button>
                    <button
                      onClick={() => handleCashShortcut(100000)}
                      className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono text-stone-200"
                    >
                      100.000
                    </button>
                    <button
                      onClick={() => handleCashShortcut(200000)}
                      className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono text-stone-200"
                    >
                      200.000
                    </button>
                    <button
                      onClick={() => handleCashShortcut(50000)}
                      className="py-2 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono text-stone-200"
                    >
                      500.000
                    </button>
                  </div>

                  {/* Real-time Change Box */}
                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-300">Uang Kembalian:</span>
                    <span
                      className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
                        isCashInsufficient ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {isCashInsufficient ? `Kurang ${formatRupiah(grandTotal - cashTendered)}` : formatRupiah(change)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS SCREEN DISPLAY */}
              {selectedMethod === 'qris' && (
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="p-3 bg-white rounded-xl shadow-md shrink-0">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=00020101021226600016ID.CO.RIDEXCAFE0118936009990001020304055204581253033605408"
                      alt="QRIS Ridex Cafe"
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-[10px] font-black text-white tracking-widest uppercase">
                        QRIS
                      </span>
                      <span className="text-xs font-bold text-stone-200">RIDEX CAFE CILACAP</span>
                    </div>
                    <p className="text-xs text-stone-400 font-mono">NMID: ID1020268884920</p>
                    <p className="text-xs text-stone-300">
                      Pelanggan dapat memindai QRIS menggunakan BCA, Mandiri, GoPay, OVO, ShopeePay, atau Dana.
                    </p>
                    <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verifikasi otomatis aktif (Simulasi)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD EDC DISPLAY */}
              {selectedMethod === 'card' && (
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Integrasi Mesin EDC Bank:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['EDC BCA 01', 'EDC Mandiri 02', 'EDC BRI 03'].map((terminal, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 text-center"
                      >
                        <span className="text-xs font-medium text-stone-200 block">{terminal}</span>
                        <span className="text-[10px] text-amber-400">Siap Gesek / Tap</span>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Nomor Approval / Trace No. EDC (Opsional)"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* E-WALLET DISPLAY */}
              {selectedMethod === 'ewallet' && (
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                  <span className="text-xs font-semibold text-stone-300 block">
                    Pilih Provider Dompet Digital:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {['GoPay', 'OVO', 'ShopeePay', 'DANA'].map((w) => (
                      <div
                        key={w}
                        className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 text-center hover:border-amber-500/50 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-stone-200">{w}</span>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Nomor Telepon / Referensi E-Wallet Pelanggan"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </>
          ) : (
            /* SPLIT PAYMENT INTERFACE */
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Pengaturan Split Payment (2 Metode Pembayaran)
              </h4>

              {/* Part 1: Cash Portion */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-medium">Metode 1: Tunai (Cash)</span>
                  <span className="font-mono text-amber-400 font-bold">{formatRupiah(splitFirstAmount)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max={grandTotal - 5000}
                  step="5000"
                  value={splitFirstAmount}
                  onChange={(e) => setSplitFirstAmount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Part 2: Remainder Method */}
              <div className="space-y-1.5 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-medium">
                    Metode 2: Sisanya ({splitSecondMethod.toUpperCase()})
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    {formatRupiah(grandTotal - splitFirstAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(['qris', 'card', 'ewallet'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSplitSecondMethod(m)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border uppercase ${
                        splitSecondMethod === m
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Submit Button */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-3 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium rounded-xl border border-stone-700"
          >
            Batal
          </button>

          <button
            disabled={selectedMethod === 'cash' && isCashInsufficient}
            onClick={handleFinishTransaction}
            className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 text-sm"
          >
            <Receipt className="w-4 h-4" />
            <span>Selesaikan Transaksi &amp; Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
