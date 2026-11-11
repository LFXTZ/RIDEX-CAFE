import React, { useState } from 'react';
import { X, ScanBarcode, CheckCircle2, Search, Zap } from 'lucide-react';
import { Product } from '../../types/pos';
import { formatRupiah } from '../../utils/formatters';
import { soundManager } from '../../utils/audio';

interface BarcodeScannerModalProps {
  products: Product[];
  onScanProduct: (product: Product) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onScanProduct,
  onClose,
}) => {
  const [manualSku, setManualSku] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleManualScan = () => {
    const found = products.find(
      (p) => p.sku.toLowerCase() === manualSku.trim().toLowerCase()
    );

    if (found) {
      soundManager.playScanBeep();
      onScanProduct(found);
      onClose();
    } else {
      soundManager.playAlert();
      setErrorMessage(`SKU "${manualSku}" tidak terdaftar dalam sistem.`);
    }
  };

  const handleSimulateQuickScan = (product: Product) => {
    soundManager.playScanBeep();
    onScanProduct(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scanner Barcode & SKU Ridex Cafe</h3>
              <p className="text-xs text-slate-400">Pindai kode fisik atau klik cepat SKU</p>
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

        {/* Laser Scanner Viewport Simulation */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800 relative overflow-hidden">
          <div className="w-64 h-36 border-2 border-dashed border-emerald-500/50 rounded-xl relative flex flex-col items-center justify-center bg-slate-900/40">
            {/* Animated Laser Line */}
            <div className="absolute left-2 right-2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />
            
            <ScanBarcode className="w-12 h-12 text-slate-600 mb-2 opacity-50" />
            <span className="text-[11px] text-slate-400 font-mono">ARAHKAN BARCODE KE SINI</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 text-center">
            Mendukung barcode scanner USB / Bluetooth fisik (otomatis mendeteksi Enter)
          </p>
        </div>

        {/* Input Manual SKU */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Atau Ketik Kode SKU Manual:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualSku}
              onChange={(e) => {
                setManualSku(e.target.value);
                setErrorMessage('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualScan();
              }}
              placeholder="Contoh: RDX-ESP-001"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
              autoFocus
            />
            <button
              onClick={handleManualScan}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
            >
              Scan
            </button>
          </div>
          {errorMessage && (
            <p className="text-xs text-rose-400 mt-1">{errorMessage}</p>
          )}
        </div>

        {/* Quick SKU simulation tags */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Daftar SKU Cepat (Klik untuk Simulasi Scan):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {products.slice(0, 8).map((p) => (
              <button
                key={p.id}
                onClick={() => handleSimulateQuickScan(p)}
                className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-emerald-400">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.sku}</span>
                </div>
                <Zap className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end shrink-0">
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
