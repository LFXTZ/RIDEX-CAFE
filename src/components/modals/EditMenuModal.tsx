import React, { useState } from 'react';
import { X, Plus, Edit3, DollarSign, Package, Check } from 'lucide-react';
import { Product, CategoryId } from '../../types/pos';
import { CATEGORIES } from '../../data/mockProducts';
import { soundManager } from '../../utils/audio';

interface EditMenuModalProps {
  productToEdit: Product | null;
  onSaveProduct: (product: Product) => void;
  onClose: () => void;
}

export const EditMenuModal: React.FC<EditMenuModalProps> = ({
  productToEdit,
  onSaveProduct,
  onClose,
}) => {
  const isEditing = Boolean(productToEdit);

  const [name, setName] = useState<string>(productToEdit?.name || '');
  const [category, setCategory] = useState<CategoryId>(productToEdit?.category || 'espresso');
  const [basePrice, setBasePrice] = useState<string>(productToEdit?.basePrice?.toString() || '30000');
  const [costPrice, setCostPrice] = useState<string>(productToEdit?.costPrice?.toString() || '10000');
  const [stock, setStock] = useState<string>(productToEdit?.stock?.toString() || '30');
  const [sku, setSku] = useState<string>(productToEdit?.sku || `RDX-NEW-${Math.floor(100 + Math.random() * 900)}`);
  const [description, setDescription] = useState<string>(productToEdit?.description || '');
  const [hasVariants, setHasVariants] = useState<boolean>(productToEdit?.hasVariants ?? true);
  const [badge, setBadge] = useState<'Tersedia' | 'Stok Menipis' | 'Habis'>(productToEdit?.badge || 'Tersedia');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundManager.playClick();
    const finalProduct: Product = {
      id: productToEdit?.id || `prod_${Date.now()}`,
      name: name.trim(),
      category,
      basePrice: parseInt(basePrice.replace(/\D/g, '') || '0', 10),
      costPrice: parseInt(costPrice.replace(/\D/g, '') || '0', 10),
      stock: parseInt(stock.replace(/\D/g, '') || '0', 10),
      sku: sku.trim().toUpperCase(),
      description: description.trim() || 'Menu artisan pilihan Ridex Cafe',
      hasVariants,
      badge,
      image: productToEdit?.image,
    };

    onSaveProduct(finalProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditing ? 'Ubah Informasi Menu & Harga' : 'Tambah Menu Baru ke Katalog'}
              </h3>
              <p className="text-xs text-slate-400">Panel Manajemen Owner Ridex Cafe</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Nama Menu:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Caramel Macchiato Iced"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Kategori:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Kode SKU Barcode:</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="RDX-ESP-004"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Harga Jual Kasir (IDR):</label>
              <input
                type="text"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="32000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Estimasi HPP / Modal (HPP):</label>
              <input
                type="text"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="11000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Jumlah Stok Fisik:</label>
              <input
                type="text"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Status Ketersediaan:</label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value as 'Tersedia' | 'Stok Menipis' | 'Habis')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Tersedia">Tersedia (Ready)</option>
                <option value="Stok Menipis">Stok Menipis</option>
                <option value="Habis">Habis (Sold Out)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Deskripsi Menu:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan cita rasa, bahan baku utama, atau cara penyajian..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Memiliki Opsi Varian (Size, Sugar, Ice, Extras)</span>
            </label>
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 -mx-4 -mb-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
