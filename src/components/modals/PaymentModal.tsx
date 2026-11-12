import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  Receipt,
  ExternalLink,
  Smartphone,
  Sparkles,
  RefreshCw
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

  // Dynamic QRIS & Customer checkout link
  const [currentOrderId] = useState<string>(() => 'RDX-' + Math.floor(100000 + Math.random() * 900000));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrisPaidStatus, setQrisPaidStatus] = useState<boolean>(false);
  const [qrisPaidApp, setQrisPaidApp] = useState<string>('');
  const hasFinishedRef = useRef<boolean>(false);

  const customerPayUrl = useMemo(() => {
    const baseUrl = window.location.href.split('?')[0];
    const tableNum = tableNumber || '01';
    const custName = guestName || (orderType === 'dine_in' ? `Tamu Meja ${tableNum}` : 'Pelanggan');
    const compactItems = items.map((it) => ({
      name: it.name,
      qty: it.quantity,
      price: it.finalUnitPrice,
      variant: it.size || '',
      sugar: it.sugarLevel || '',
      ice: it.iceLevel || '',
      notes: it.notes || '',
    }));
    const itemsParam = encodeURIComponent(JSON.stringify(compactItems));

    try {
      localStorage.setItem(`ridex_order_${currentOrderId}`, JSON.stringify({
        orderId: currentOrderId,
        amount: grandTotal,
        subtotal,
        tax,
        serviceCharge,
        discountAmount,
        discountLabel,
        tableNumber: tableNum,
        customerName: custName,
        items: compactItems,
      }));
    } catch (e) {
      // quota safeguard
    }

    return `${baseUrl}?mode=customer-pay&orderId=${encodeURIComponent(currentOrderId)}&amount=${grandTotal}&table=${encodeURIComponent(tableNum)}&customer=${encodeURIComponent(custName)}&items=${itemsParam}`;
  }, [currentOrderId, grandTotal, tableNumber, guestName, orderType, items, subtotal, tax, serviceCharge, discountAmount, discountLabel]);

  useEffect(() => {
    QRCode.toDataURL(customerPayUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#140E0B',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [customerPayUrl]);

  // Sync listener: BroadcastChannel and localStorage
  useEffect(() => {
    const handlePaymentReceived = (data: any) => {
      if (hasFinishedRef.current) return;
      if (data && data.type === 'QRIS_PAID') {
        hasFinishedRef.current = true;
        setQrisPaidStatus(true);
        setQrisPaidApp(data.app || 'GoPay');
        soundManager.playCashDrawer();
        setTimeout(() => {
          soundManager.playSuccess();
          handleFinishTransaction('qris');
        }, 1200);
      }
    };

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('ridex_qris_sync');
        bc.onmessage = (event) => {
          handlePaymentReceived(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ridex_last_qris_paid' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handlePaymentReceived(data);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

  const handleFinishTransaction = (overrideMethod?: PaymentMethod) => {
    const finalMethod = overrideMethod || (isSplitPayment ? 'split' : selectedMethod);
    if (finalMethod === 'cash' && isCashInsufficient) {
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
      orderId: currentOrderId,
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
      paymentMethod: finalMethod,
      amountPaid: finalMethod === 'cash' ? cashTendered : grandTotal,
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

              {/* QRIS SCREEN DISPLAY (SCANNABLE DINAMIS + LIVE POLLING + SIMULASI SCAN) */}
              {selectedMethod === 'qris' && (
                <div className="bg-stone-950 p-4 sm:p-5 rounded-2xl border border-stone-800 space-y-4">
                  {qrisPaidStatus ? (
                    <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-5 text-center space-y-3 animate-fadeIn">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Pembayaran QRIS Berhasil Diterima!
                        </span>
                        <h4 className="text-lg font-black text-white mt-0.5">Lunas via {qrisPaidApp.toUpperCase()}</h4>
                        <p className="text-xs text-stone-300 font-mono mt-1">
                          Nominal: {formatRupiah(grandTotal)} · Meja {tableNumber || '01'}
                        </p>
                      </div>
                      <div className="text-[11px] text-emerald-300/80 animate-pulse">
                        Menyimpan transaksi dan mencetak struk...
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                      {/* Dynamic Scannable QR Code */}
                      <div className="p-3 bg-white rounded-xl shadow-xl shrink-0 flex flex-col items-center border-2 border-amber-800/30">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="QRIS Dinamis Ridex Cafe"
                            className="w-36 h-36 object-contain"
                          />
                        ) : (
                          <div className="w-36 h-36 flex items-center justify-center bg-stone-100 text-stone-500 text-xs">
                            Membuat QR...
                          </div>
                        )}
                        <span className="text-[9px] font-mono text-stone-600 font-bold mt-1">SCAN VIA SMARTPHONE</span>
                      </div>

                      {/* QRIS Merchant & Live Polling Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-[10px] font-black text-white tracking-widest uppercase">
                            QRIS
                          </span>
                          <span className="text-xs font-bold text-stone-200">RIDEX CAFE CILACAP</span>
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          NMID: <strong className="text-stone-300">ID1020268884920</strong> · No: <strong className="text-amber-400">{currentOrderId}</strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-between">
                          <span className="text-xs text-stone-400">Total Tagihan:</span>
                          <span className="text-lg font-mono font-bold text-amber-400">{formatRupiah(grandTotal)}</span>
                        </div>

                        {/* Live Polling Status */}
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-600/30 px-3 py-1.5 rounded-xl">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="font-medium text-[11px]">Menunggu pemindaian &amp; pembayaran pelanggan...</span>
                        </div>

                        {/* Quick Test Buttons */}
                        <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playClick();
                              window.open(customerPayUrl, '_blank');
                            }}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-stone-700 active:scale-95 transition-all"
                            title="Buka Halaman Checkout Pelanggan di Tab Baru"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Simulasi Scan HP Pelanggan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playClick();
                              const fakePayload = {
                                type: 'QRIS_PAID',
                                orderId: currentOrderId,
                                amount: grandTotal,
                                table: tableNumber || '01',
                                app: 'BCA Mobile',
                                timestamp: Date.now(),
                              };
                              if ('BroadcastChannel' in window) {
                                try {
                                  const bc = new BroadcastChannel('ridex_qris_sync');
                                  bc.postMessage(fakePayload);
                                  setTimeout(() => bc.close(), 500);
                                } catch (e) {}
                              }
                              try {
                                localStorage.setItem('ridex_last_qris_paid', JSON.stringify(fakePayload));
                              } catch (e) {}
                            }}
                            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                            title="Konfirmasi Lunas Langsung (Uji 1 Tab)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Simulasi Bayar di Tab Ini</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
            onClick={() => handleFinishTransaction()}
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
