import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Download, 
  Share2, 
  ChefHat, 
  Receipt as ReceiptIcon,
  Coffee
} from 'lucide-react';
import { CompletedOrder } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface ReceiptModalProps {
  order: CompletedOrder | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onClose,
  onNewTransaction,
}) => {
  const [viewMode, setViewMode] = useState<'customer' | 'kitchen'>('customer');
  const [isPrinted, setIsPrinted] = useState<boolean>(false);

  if (!order) return null;

  const handlePrint = () => {
    soundManager.playCashDrawer();
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/90 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white">
      <div className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Header - Screen only */}
        <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setViewMode('customer');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'customer'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ReceiptIcon className="w-3.5 h-3.5" />
              <span>Struk Pelanggan</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setViewMode('kitchen');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kitchen'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Tiket Dapur / Bar</span>
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Paper Scrollable Container */}
        <div className="flex-1 p-4 sm:p-6 bg-slate-950 flex justify-center overflow-hidden">
          {viewMode === 'customer' ? (
            /* CUSTOMER THERMAL RECEIPT 80mm - Strict Single Parent White Div */
            <div className="bg-white text-slate-900 font-mono p-6 rounded-md shadow-2xl w-full max-w-sm mx-auto max-h-[75vh] overflow-y-auto space-y-3 text-xs select-text">
              {/* Header Struk: Logo Ridex Cafe (SVG), Nama "RIDEX CAFE", Sub-header, Alamat, Telp & NPWP */}
              <div className="text-center pb-1">
                <div className="w-16 h-16 mx-auto mb-1.5 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" fill="#fdfbf7" stroke="#4a2c11" strokeWidth="2"/>
                    <circle cx="30" cy="26" r="10" fill="#4a2c11"/>
                    <circle cx="70" cy="26" r="10" fill="#4a2c11"/>
                    <circle cx="30" cy="26" r="5" fill="#e8d5c4"/>
                    <circle cx="70" cy="26" r="5" fill="#e8d5c4"/>
                    <circle cx="50" cy="48" r="28" fill="#ffffff" stroke="#4a2c11" strokeWidth="3"/>
                    <circle cx="42" cy="44" r="3" fill="#4a2c11"/>
                    <circle cx="58" cy="44" r="3" fill="#4a2c11"/>
                    <ellipse cx="50" cy="53" rx="7" ry="5" fill="#fdf3e7"/>
                    <ellipse cx="50" cy="51" rx="4" ry="2.8" fill="#4a2c11"/>
                    <path d="M46 55 Q50 59 54 55" stroke="#4a2c11" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <path d="M33 66 H67 V79 C67 85 61 88 50 88 C39 88 33 85 33 79 Z" fill="#4a2c11"/>
                    <path d="M67 70 H73 C75 70 76 72 75 75 C74 77 72 78 67 78" stroke="#4a2c11" strokeWidth="2.5" fill="none"/>
                    <ellipse cx="50" cy="77" rx="4.5" ry="6" fill="#fdf3e7"/>
                    <path d="M50 72 Q52 77 50 82" stroke="#4a2c11" strokeWidth="1.6" fill="none"/>
                  </svg>
                </div>
                <h2 className="text-base font-black tracking-wider uppercase text-slate-950 font-sans">RIDEX CAFE</h2>
                <p className="text-[9px] font-bold tracking-widest text-emerald-800 uppercase font-sans">YOUR DAILY ESCAPE</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-0.5">Specialty Coffee &amp; Artisan Bakery</p>
                <p className="text-[9px] text-slate-600 mt-1 leading-tight">
                  Jl. Ahmad Yani No. 45, Cilacap, Jawa Tengah<br />
                  Telp: (0282) 539-888 · NPWP: 94.882.112.4-522.000
                </p>
              </div>

              <hr className="border-t border-dashed border-slate-300 my-3" />

              {/* Metadata Transaksi */}
              <div className="text-[10px] space-y-0.5 font-mono text-slate-800">
                <div className="flex justify-between">
                  <span>No. Struk :</span>
                  <span className="font-bold">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu     :</span>
                  <span>{order.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir     :</span>
                  <span className="font-bold">
                    {order.cashierName && order.cashierName !== 'Budi Pratama' ? order.cashierName : 'Rifqy Ridho P.'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe      :</span>
                  <span className="uppercase font-bold">
                    {order.orderType === 'dine_in' ? `DINE-IN (MEJA ${order.tableNumber || '01'})` : order.orderType.toUpperCase()}
                  </span>
                </div>
                {order.customerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan :</span>
                    <span>{order.customerName}</span>
                  </div>
                )}
              </div>

              <hr className="border-t border-dashed border-slate-300 my-3" />

              {/* List Item Pesanan */}
              <div className="space-y-1.5 font-mono text-[10px]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span className="flex-1 pr-2 truncate">
                        {item.quantity}x {item.name}
                      </span>
                      <span>{formatRupiah(item.finalUnitPrice * item.quantity)}</span>
                    </div>

                    {/* Variant and notes in smaller italic font */}
                    {(item.size !== 'Regular' || item.sugarLevel !== '100%' || item.iceLevel !== 'Normal' || (item.extras && item.extras.length > 0)) && (
                      <div className="text-[9px] text-slate-600 italic pl-3">
                        {item.size !== 'Regular' && `[${item.size}] `}
                        {item.sugarLevel !== '100%' && `Gula:${item.sugarLevel} `}
                        {item.iceLevel !== 'Normal' && `Es:${item.iceLevel} `}
                        {item.extras.map((e) => `+${e.name} `)}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[9px] text-slate-500 italic pl-3">
                        *{item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <hr className="border-t border-dashed border-slate-300 my-3" />

              {/* Rincian Keuangan */}
              <div className="text-[10px] space-y-0.5 font-mono text-slate-800">
                <div className="flex justify-between">
                  <span>Subtotal :</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Diskon ({order.discountLabel || 'Promo'}) :</span>
                    <span>-{formatRupiah(order.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>PB1 Restoran (10%) :</span>
                  <span>{formatRupiah(order.tax)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Service Charge (5%) :</span>
                  <span>{formatRupiah(order.serviceCharge)}</span>
                </div>

                <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-slate-400 text-slate-950">
                  <span>TOTAL :</span>
                  <span>{formatRupiah(order.grandTotal)}</span>
                </div>
              </div>

              <hr className="border-t border-dashed border-slate-300 my-3" />

              {/* Rincian Pembayaran */}
              <div className="text-[10px] space-y-0.5 font-mono text-slate-800">
                <div className="flex justify-between">
                  <span>Metode Bayar :</span>
                  <span className="uppercase font-bold">{order.paymentMethod}</span>
                </div>

                {order.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai Diterima :</span>
                      <span>{formatRupiah(order.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Kembalian :</span>
                      <span className="font-bold text-slate-900">{formatRupiah(order.change)}</span>
                    </div>
                  </>
                )}

                {order.paymentMethod === 'split' && order.splitDetails && (
                  <div className="text-[9px] space-y-0.5 pt-1">
                    {order.splitDetails.map((s, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="uppercase">Split {s.method} :</span>
                        <span>{formatRupiah(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-t border-dashed border-slate-300 my-3" />

              {/* Footer Struk (Tetap Di Dalam Kertas Putih) */}
              <div className="pt-1 pb-4 text-center space-y-1 text-[9px] text-slate-600 font-mono">
                <p className="font-bold text-slate-900 text-[10px]">Terima Kasih atas Kunjungan Anda!</p>
                <p>Follow IG: @ridexcafe.cilacap | Password WiFi: ridexcoffee2026</p>
                <p className="pt-1 text-slate-500 text-[8px] uppercase tracking-wider font-semibold">LOKA POS SYSTEM · CILACAP OUTLET</p>
              </div>
            </div>
          ) : (
            /* KITCHEN / BAR TICKET */
            <div className="bg-white text-slate-900 font-mono p-6 rounded-md shadow-2xl w-full max-w-sm mx-auto max-h-[75vh] overflow-y-auto space-y-3 text-xs select-text">
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <span className="text-xs font-bold uppercase tracking-widest block bg-slate-900 text-white py-1">
                  ORDER DAPUR &amp; BAR
                </span>
                <h3 className="text-xl font-black mt-2">
                  {order.orderType === 'dine_in' ? `MEJA: ${order.tableNumber || '01'}` : order.orderType.toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  No: {order.orderNumber} · {order.timestamp}
                </p>
              </div>

              <div className="py-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="border-b border-dashed border-slate-300 pb-2">
                    <div className="flex items-start justify-between text-sm font-black">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-200 rounded">{item.size}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 pl-2 mt-1 space-y-0.5 font-medium">
                      {item.sugarLevel !== '100%' && <div>• Gula: {item.sugarLevel}</div>}
                      {item.iceLevel !== 'Normal' && <div>• Es: {item.iceLevel}</div>}
                      {item.extras.map((e, i) => (
                        <div key={i} className="text-slate-900 font-bold">• EXTRA: {e.name}</div>
                      ))}
                      {item.notes && (
                        <div className="text-rose-600 font-bold underline mt-1">
                          CATATAN: {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500">
                Dicetak untuk Barista & Kitchen Ridex Cafe
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3.5 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-amber-100 text-xs font-semibold rounded-xl border border-stone-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Fisik Struk</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-3 py-2.5 text-stone-400 hover:text-stone-200 text-xs font-medium"
            >
              Tutup
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onNewTransaction();
              }}
              className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
