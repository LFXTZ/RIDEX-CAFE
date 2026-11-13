import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Smartphone, 
  Coffee, 
  Receipt,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Printer
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface CustomerPayItem {
  name: string;
  qty: number;
  price: number;
  variant?: string;
  sugar?: string;
  ice?: string;
  notes?: string;
}

interface CustomerPayScreenProps {
  orderId: string;
  amount: number;
  tableNumber: string;
  customerName?: string;
  rawItems?: string;
}

export const CustomerPayScreen: React.FC<CustomerPayScreenProps> = ({
  orderId,
  amount,
  tableNumber,
  customerName,
  rawItems,
}) => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentTime, setPaymentTime] = useState<string>('');
  const [showItemDetails, setShowItemDetails] = useState<boolean>(true);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<boolean>(false);

  // Absolute Scroll Rule: Strip overflow-hidden & fixed heights from html & body while in Customer Pay view
  useEffect(() => {
    const prevHtmlClass = document.documentElement.className;
    const prevBodyClass = document.body.className;

    document.documentElement.classList.remove('overflow-hidden', 'h-screen', 'h-[100dvh]', 'max-h-[100dvh]');
    document.documentElement.classList.add('overflow-y-auto');
    document.body.className = 'min-h-screen w-full overflow-y-auto bg-stone-950 text-amber-50 antialiased';

    return () => {
      document.documentElement.className = prevHtmlClass;
      document.body.className = prevBodyClass;
    };
  }, []);

  // Parse items from query param or localStorage cache
  const orderData = useMemo(() => {
    let parsedItems: CustomerPayItem[] = [];

    // 1. Try URL rawItems parameter
    if (rawItems) {
      try {
        const decoded = JSON.parse(decodeURIComponent(rawItems));
        if (Array.isArray(decoded) && decoded.length > 0) {
          parsedItems = decoded;
        }
      } catch (e) {
        console.warn('Failed to parse items from URL param', e);
      }
    }

    // 2. Try localStorage cache
    if (parsedItems.length === 0) {
      try {
        const cached = localStorage.getItem(`ridex_order_${orderId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            parsedItems = parsed.items;
          }
        }
      } catch (e) {
        console.warn('Failed to read order cache from localStorage', e);
      }
    }

    // 3. Fallback demo items if none found
    if (parsedItems.length === 0) {
      const estimatedItemsCount = Math.max(1, Math.round(amount / 35000));
      if (estimatedItemsCount === 1) {
        parsedItems = [
          {
            name: 'Ridex Signature Latte',
            qty: 1,
            price: amount > 38000 ? 38000 : amount,
            variant: 'Large',
            sugar: 'Normal (100%)',
            ice: 'Less Ice',
            notes: 'Kemasan takeaway ramah lingkungan',
          },
        ];
      } else {
        const item1Price = Math.round(amount * 0.55);
        const item2Price = amount - item1Price;
        parsedItems = [
          {
            name: 'Ridex Signature Latte',
            qty: 1,
            price: item1Price,
            variant: 'Large',
            sugar: 'Less Sugar (50%)',
            ice: 'Less Ice',
            notes: 'Extra creamy',
          },
          {
            name: 'Butter Croissant',
            qty: 1,
            price: item2Price,
            variant: 'Regular',
            notes: 'Hangatkan sebentar',
          },
        ];
      }
    }

    // Calculate subtotal and tax estimates
    const computedSubtotal = parsedItems.reduce((acc, it) => acc + (it.price * it.qty), 0);
    const taxRate = 0.10; // PB1 10%
    const serviceRate = 0.05; // Service 5%

    // If computed subtotal matches or approximates amount, calculate breakdown
    const isExactBreakdown = Math.abs((computedSubtotal * 1.15) - amount) < 1000;
    const baseSubtotal = isExactBreakdown ? computedSubtotal : Math.round(amount / 1.15);
    const taxAmount = isExactBreakdown ? Math.round(baseSubtotal * taxRate) : Math.round((amount - baseSubtotal) * (10 / 15));
    const serviceAmount = amount - baseSubtotal - taxAmount;

    return {
      items: parsedItems,
      subtotal: baseSubtotal,
      tax: taxAmount,
      serviceCharge: serviceAmount,
      customer: customerName || (tableNumber ? `Tamu Meja ${tableNumber}` : 'Pelanggan Setia'),
    };
  }, [rawItems, orderId, amount, tableNumber, customerName]);

  const paymentApps = [
    { id: 'GoPay', name: 'GoPay', color: 'from-blue-600 to-cyan-500', badge: 'E-Wallet' },
    { id: 'OVO', name: 'OVO', color: 'from-purple-700 to-indigo-600', badge: 'E-Wallet' },
    { id: 'DANA', name: 'DANA', color: 'from-sky-600 to-blue-500', badge: 'E-Wallet' },
    { id: 'ShopeePay', name: 'ShopeePay', color: 'from-orange-600 to-amber-500', badge: 'E-Wallet' },
    { id: 'BCA Mobile', name: 'BCA Mobile', color: 'from-blue-800 to-blue-900', badge: 'Mobile Banking' },
    { id: 'Mandiri Livin', name: 'Mandiri Livin', color: 'from-amber-600 to-yellow-600', badge: 'Mobile Banking' },
  ];

  const handleConfirmPayment = () => {
    if (!selectedApp) {
      soundManager.playAlert();
      return;
    }

    soundManager.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      // 1. Sensory feedback: Phone haptic vibration pulse
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 150]);
        } catch (e) {
          // ignore
        }
      }

      // 2. Sensory feedback: Audio chime
      soundManager.playSuccess();
      setIsProcessing(false);
      setIsPaid(true);

      const timeStr = formatDateTime();
      setPaymentTime(timeStr);

      const syncPayload = {
        type: 'QRIS_PAID',
        orderId,
        amount,
        table: tableNumber,
        customer: orderData.customer,
        app: selectedApp,
        timestamp: Date.now(),
      };

      // 3. BroadcastChannel across open tabs
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('ridex_qris_sync');
          bc.postMessage(syncPayload);
          setTimeout(() => bc.close(), 1000);
        } catch (e) {
          console.warn('BroadcastChannel error:', e);
        }
      }

      // 4. LocalStorage event trigger for cross-tab sync
      try {
        localStorage.setItem('ridex_last_qris_paid', JSON.stringify(syncPayload));
      } catch (e) {
        console.warn('localStorage error:', e);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1100);
  };

  const handleDownloadReceipt = () => {
    soundManager.playClick();
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);

    // Create simple downloadable receipt text file as portable digital receipt
    const receiptLines = [
      '==========================================',
      '          RIDEX CAFE CILACAP              ',
      '         "YOUR DAILY ESCAPE"              ',
      '  Jl. Ahmad Yani No. 45, Cilacap, Jateng  ',
      '          Telp: (0282) 539-888            ',
      '==========================================',
      `No. Struk    : ${orderId}`,
      `Tanggal/Jam  : ${paymentTime || formatDateTime()}`,
      `Kasir        : Rifqy Ridho P.`,
      `Meja         : Meja ${tableNumber}`,
      `Pelanggan    : ${orderData.customer}`,
      '------------------------------------------',
      'MENU PESANAN:',
      ...orderData.items.map(
        (it) => `  ${it.qty}x ${it.name}\n     @${formatRupiah(it.price)} = ${formatRupiah(it.price * it.qty)}`
      ),
      '------------------------------------------',
      `Subtotal     : ${formatRupiah(orderData.subtotal)}`,
      `PB1 (10%)    : ${formatRupiah(orderData.tax)}`,
      orderData.serviceCharge > 0 ? `Service (5%) : ${formatRupiah(orderData.serviceCharge)}` : '',
      '==========================================',
      `TOTAL DIBAYAR: ${formatRupiah(amount)}`,
      `METODE       : QRIS (${(selectedApp || 'QRIS').toUpperCase()}) - LUNAS`,
      `NMID         : ID1020268884920`,
      `Ref ID       : RDX-TXN-${Date.now().toString().slice(-6)}`,
      '==========================================',
      'WiFi Password: ridexcoffee2026',
      'Instagram    : @ridexcafe.cilacap',
      '------------------------------------------',
      ' Terima kasih atas kunjungan Anda!         ',
      ' Silakan duduk manis, barista kami        ',
      ' sedang menyiapkan pesanan Anda dengan hati.',
      '==========================================',
    ].filter(Boolean).join('\n');

    const blob = new Blob([receiptLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk_QRIS_${orderId}_RidexCafe.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    soundManager.playClick();
    window.print();
  };

  const handleResetToHome = () => {
    soundManager.playClick();
    window.location.href = window.location.href.split('?')[0];
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-stone-950 text-amber-50 pb-32 px-4 pt-6 font-sans select-none relative">
      {/* Background ambient lighting */}
      <div className="fixed -top-24 -left-24 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-24 -right-24 w-80 h-80 bg-amber-700/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto flex flex-col space-y-4 relative z-10">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#f5ede4] p-1.5 shadow-xl border border-amber-800/30 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform">
            <img 
              src="/assets/aistudio/extra-large_4af77947.png" 
              alt="Ridex Cafe Mascot Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase font-sans">RIDEX CAFE</h1>
            <p className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">YOUR DAILY ESCAPE</p>
            <p className="text-xs text-stone-400 mt-0.5">Outlet Cilacap, Jawa Tengah · Jl. Ahmad Yani No. 45</p>
          </div>
        </div>

        {!isPaid ? (
          /* ========================================= */
          /* 1. VIEW PRE-PAYMENT (ORDER REVIEW & PAY)  */
          /* ========================================= */
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-xl animate-fadeIn">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Portal Checkout QRIS Pelanggan</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded font-black tracking-wider uppercase">
                QRIS Dinamis
              </span>
            </div>

            {/* Order Bill Summary */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800/90 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>No. Tagihan Pesanan:</span>
                <span className="font-mono font-bold text-stone-200">{orderId}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Lokasi Meja &amp; Tamu:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 font-mono font-bold text-xs">
                    Meja {tableNumber}
                  </span>
                  <span className="text-stone-300 text-xs font-medium truncate max-w-[120px]">
                    {orderData.customer}
                  </span>
                </div>
              </div>

              {/* ITEM BREAKDOWN (RINCIAN ITEM MAKANAN & MINUMAN) */}
              <div className="pt-2 border-t border-stone-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rincian Item Pesanan ({orderData.items.reduce((s, i) => s + i.qty, 0)} item):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setShowItemDetails(!showItemDetails);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                  >
                    <span>{showItemDetails ? 'Ciutkan' : 'Lihat Detail'}</span>
                    {showItemDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showItemDetails && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {orderData.items.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-2 rounded-lg bg-stone-900/90 border border-stone-800/80 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 bg-amber-600/20 text-amber-400 rounded text-[10px] font-bold font-mono">
                              {item.qty}x
                            </span>
                            <span className="font-bold text-stone-100">{item.name}</span>
                          </div>
                          {(item.variant || item.sugar || item.ice) && (
                            <div className="text-[10px] text-stone-400 pl-6 flex items-center gap-1 flex-wrap">
                              {item.variant && <span>{item.variant}</span>}
                              {item.sugar && <span>· Gula: {item.sugar}</span>}
                              {item.ice && <span>· Es: {item.ice}</span>}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-amber-300/80 italic pl-6">
                              Catatan: &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-stone-200 tabular-nums shrink-0 pl-2">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtotal & Taxes breakdown */}
              <div className="pt-2 border-t border-stone-850 space-y-1.5 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Subtotal Menu:</span>
                  <span className="font-mono text-stone-300">{formatRupiah(orderData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Restoran (PB1 10%):</span>
                  <span className="font-mono text-stone-300">{formatRupiah(orderData.tax)}</span>
                </div>
                {orderData.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge (5%):</span>
                    <span className="font-mono text-stone-300">{formatRupiah(orderData.serviceCharge)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Row */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Total Tagihan:</span>
                  <span className="text-[10px] text-stone-500">Bebas Biaya Admin QRIS</span>
                </div>
                <span className="text-2xl font-black font-mono text-amber-400 tabular-nums">
                  {formatRupiah(amount)}
                </span>
              </div>
            </div>

            {/* Choose E-Wallet / M-Banking App (ALL UNSELECTED BY DEFAULT) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-300">
                  Pilih Aplikasi Pembayaran Anda:
                </label>
                {!selectedApp && (
                  <span className="text-[10px] font-bold text-amber-400 animate-pulse">
                    Wajib pilih 1 metode
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {paymentApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedApp(app.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
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
          </div>
        ) : (
          /* ============================================================== */
          /* 2. VIEW POST-PAYMENT (BUKTI BAYAR DIGITAL & STRUK THERMAL)     */
          /* ============================================================== */
          <div className="space-y-4 animate-fadeIn">
            {/* Bukti Pembayaran Digital Berhasil (LUNAS) */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase tracking-wider">
                  Pembayaran Berhasil · LUNAS
                </span>
                <h2 className="text-xl font-black text-white pt-1">Bukti Pembayaran Digital</h2>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Transaksi QRIS Anda telah diverifikasi otomatis oleh kasir Ridex Cafe. Scroll ke bawah untuk melihat struk lengkap.
                </p>
              </div>

              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">No. Tagihan:</span>
                  <span className="font-mono font-bold text-stone-200">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">ID Referensi:</span>
                  <span className="font-mono text-amber-400 font-bold">RDX-TXN-{orderId.replace(/\D/g, '').slice(-6) || '928102'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total Nominal:</span>
                  <span className="font-mono font-black text-emerald-400 text-base">{formatRupiah(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Waktu Transaksi:</span>
                  <span className="font-mono text-stone-300">{paymentTime || formatDateTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Metode &amp; Meja:</span>
                  <span className="font-bold text-stone-200">QRIS ({(selectedApp || 'QRIS').toUpperCase()}) · Meja {tableNumber}</span>
                </div>
              </div>
            </div>

            {/* 100% WHITE THERMAL RECEIPT CONTAINER (FULL SCROLLABLE) */}
            <div className="bg-white text-slate-900 font-mono p-6 rounded-xl shadow-2xl w-full max-w-md mx-auto mt-6 mb-12 space-y-3 border border-stone-200">
              {/* Receipt Brand Header */}
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-[#f5ede4] p-1 mx-auto border border-amber-800/20 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/assets/aistudio/extra-large_4af77947.png" 
                    alt="Ridex Cafe" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-black text-base tracking-wider text-slate-900">RIDEX CAFE</h3>
                <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">YOUR DAILY ESCAPE</p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Jl. Ahmad Yani No. 45, Cilacap, Jawa Tengah<br />
                  Telp: (0282) 539-888
                </p>
              </div>

              {/* Dashed Separator */}
              <div className="border-b-2 border-dashed border-slate-300 my-2"></div>

              {/* Receipt Metadata */}
              <div className="text-[11px] space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>No. Struk</span>
                  <span className="font-bold text-slate-900">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Bayar</span>
                  <span>{paymentTime || formatDateTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir</span>
                  <span className="font-bold">Rifqy Ridho P.</span>
                </div>
                <div className="flex justify-between">
                  <span>Meja / Tamu</span>
                  <span>Meja {tableNumber} · {orderData.customer}</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-b-2 border-dashed border-slate-300 my-2"></div>

              {/* Itemized Table */}
              <div className="space-y-1.5 text-xs">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{item.qty}x {item.name}</span>
                      <span>{formatRupiah(item.price * item.qty)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pl-4">
                      <span>@{formatRupiah(item.price)} {item.variant ? `(${item.variant})` : ''}</span>
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-800 italic pl-4">
                        &ldquo;{item.notes}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dashed Separator */}
              <div className="border-b-2 border-dashed border-slate-300 my-2"></div>

              {/* Calculation Summary */}
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(orderData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PB1 (10%)</span>
                  <span>{formatRupiah(orderData.tax)}</span>
                </div>
                {orderData.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge (5%)</span>
                    <span>{formatRupiah(orderData.serviceCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-200">
                  <span>TOTAL DIBAYAR</span>
                  <span className="tabular-nums">{formatRupiah(amount)}</span>
                </div>
              </div>

              {/* Payment Method & NMID */}
              <div className="bg-slate-100 p-2.5 rounded-lg text-[10px] space-y-0.5 text-slate-700">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>METODE PEMBAYARAN</span>
                  <span className="text-emerald-700">QRIS ({(selectedApp || 'QRIS').toUpperCase()}) - LUNAS</span>
                </div>
                <div className="flex justify-between">
                  <span>NMID</span>
                  <span>ID1020268884920</span>
                </div>
                <div className="flex justify-between">
                  <span>Ref No.</span>
                  <span>RDX-TXN-{Date.now().toString().slice(-6)}</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-b-2 border-dashed border-slate-300 my-2"></div>

              {/* WiFi & Social */}
              <div className="text-center text-[10px] text-slate-600 space-y-0.5">
                <p>WiFi: <strong className="text-slate-900">ridexcoffee2026</strong></p>
                <p>Instagram: <strong className="text-slate-900">@ridexcafe.cilacap</strong></p>
                <p className="pt-1 text-[9px] text-slate-400">
                  Terima kasih atas kunjungan Anda! Silakan duduk manis menunggu pesanan disajikan.
                </p>
              </div>
            </div>

            {/* Receipt Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="py-3 px-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-950" />
                <span>Unduh / Simpan Struk</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-3 px-3 bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-stone-700 active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-300" />
                <span>Cetak Struk (PDF)</span>
              </button>
            </div>

            {downloadSuccessToast && (
              <div className="p-2.5 bg-emerald-900/80 border border-emerald-500 text-emerald-200 text-xs rounded-xl text-center animate-fadeIn font-medium">
                Struk digital berhasil diunduh ke ponsel Anda!
              </div>
            )}

            <button
              type="button"
              onClick={handleResetToHome}
              className="w-full py-2.5 bg-transparent hover:bg-stone-900 text-stone-400 hover:text-stone-200 text-xs font-semibold rounded-xl transition-colors text-center"
            >
              Kembali ke Menu Utama
            </button>
          </div>
        )}

        {/* Unified Sleek Bottom Checkout Sheet (Visible during checkout, hidden after payment) */}
        {!isPaid && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-xl border-t border-amber-500/20 px-4 py-3.5 shadow-[0_-12px_30px_rgba(0,0,0,0.85)]">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[11px] text-stone-400 block font-medium">Total Tagihan (QRIS)</span>
                <span className="text-amber-400 font-extrabold text-lg font-mono tabular-nums block truncate">
                  {formatRupiah(amount)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!selectedApp || isProcessing}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition whitespace-nowrap shrink-0 disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer text-sm sm:text-base"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Memproses...</span>
                  </span>
                ) : !selectedApp ? (
                  <span>Pilih Metode Bayar</span>
                ) : (
                  <span>Bayar Sekarang →</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <p className="text-[10px] text-stone-500 text-center font-mono pt-2">
          Powered by Loka POS Engine · Ridex Cafe QRIS Integration
        </p>
      </div>
    </div>
  );
};
