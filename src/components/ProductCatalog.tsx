import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ScanBarcode, 
  Coffee, 
  Flame, 
  CupSoda, 
  Croissant, 
  UtensilsCrossed, 
  PlusCircle, 
  Sparkles,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Product, CategoryId } from '../types/pos';
import { CATEGORIES } from '../data/mockProducts';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface ProductCatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenBarcodeModal: () => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Coffee,
  Flame,
  CupSoda,
  Croissant,
  UtensilsCrossed,
  PlusCircle,
};

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  onOpenBarcodeModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-950 overflow-hidden">
      {/* Top Controls: Search Bar & Barcode Scanner */}
      <div className="p-3.5 bg-stone-900/95 border-b border-stone-800 flex items-center gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari menu kafe atau ketik SKU (misal: RDX-ESP-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-10 pr-9 py-2 text-sm text-amber-50 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              aria-label="Hapus Pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Barcode scanner action button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenBarcodeModal();
          }}
          className="px-3.5 py-2 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded-lg text-amber-100 text-xs font-medium flex items-center gap-2 transition-colors shrink-0"
          title="Buka Scanner Barcode / SKU"
        >
          <ScanBarcode className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Scan SKU</span>
        </button>
      </div>

      {/* Horizontal Category Tabs */}
      <div className="px-3.5 py-2.5 bg-stone-900/70 border-b border-stone-800 overflow-x-auto no-scrollbar shrink-0 flex items-center gap-1.5">
        {CATEGORIES.map((cat) => {
          const IconComponent = CATEGORY_ICONS[cat.icon] || Coffee;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playClick();
                setActiveCategory(cat.id as CategoryId);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border ${
                isActive
                  ? 'bg-amber-600 border-amber-500 text-stone-950 font-bold shadow-md'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Grid Viewport */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 pb-24 md:pb-4">
        {filteredProducts.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-stone-300 mb-1">Menu Tidak Ditemukan</h4>
            <p className="text-xs text-stone-500 max-w-xs mb-4">
              Tidak ada produk yang cocok dengan &quot;{searchQuery}&quot; pada kategori ini.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 rounded-lg border border-stone-700"
            >
              Reset Filter &amp; Cari Ulang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= 8;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectProduct(product);
                  }}
                  className="group relative bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 flex flex-col justify-between active:scale-[0.985] shadow-sm hover:shadow-stone-950/40"
                >
                  {/* Product Image / Visual Area */}
                  <div className="relative aspect-[4/3] w-full bg-stone-950 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950 text-stone-600">
                        <Coffee className="w-8 h-8 mb-1 text-stone-600" />
                        <span className="text-[10px] text-stone-500 font-mono">{product.sku}</span>
                      </div>
                    )}

                    {/* Gradient scrim for visual contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Stock status indicator badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border backdrop-blur-md ${
                          isLowStock
                            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                            : 'bg-stone-950/80 border-stone-700/60 text-stone-300'
                        }`}
                      >
                        {isLowStock ? `Sisa ${product.stock}` : 'Tersedia'}
                      </span>
                    </div>

                    {/* Has Variants indicator */}
                    {product.hasVariants && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-950/80 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-1 backdrop-blur-md">
                          <SlidersHorizontal className="w-2.5 h-2.5" />
                          <span>Varian</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info Content */}
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-amber-50 line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                      <span className="text-xs sm:text-sm font-bold font-mono text-amber-400">
                        {formatRupiah(product.basePrice)}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {product.sku}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog Quick Footer Info */}
      <div className="px-4 py-2 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Menampilkan <strong className="text-stone-200">{filteredProducts.length}</strong> menu</span>
          <span className="text-stone-600">·</span>
          <span>Kategori: <strong className="text-amber-400 capitalize">{activeCategory.replace('_', ' ')}</strong></span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-stone-500 text-[11px]">
          <span>Klik kartu untuk tambah cepat</span>
        </div>
      </div>
    </div>
  );
};
