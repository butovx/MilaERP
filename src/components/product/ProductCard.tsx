"use client";

import { Product } from "@/types";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import {
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/utils/cn";

interface ProductCardProps {
  product: Product;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onDownloadBarcode: (barcode: string) => void;
  onDelete: (id: number, name: string) => void;
  isDeleting: boolean;
}

export default function ProductCard({
  product,
  selectionMode,
  isSelected,
  onToggleSelect,
  onDownloadBarcode,
  onDelete,
  isDeleting,
}: ProductCardProps) {
  // Stock level style helper
  const getStockStatus = (qty: number) => {
    if (qty <= 0) {
      return { 
        label: "Нет на складе", 
        color: "bg-red-500/10 text-red-600 dark:text-red-450 border-red-500/20 dark:border-red-500/10" 
      };
    }
    if (qty <= 15) {
      return { 
        label: `Мало: ${qty} шт.`, 
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20 dark:border-amber-500/10" 
      };
    }
    return { 
      label: `${qty} шт.`, 
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 dark:border-emerald-500/10" 
    };
  };

  const stock = getStockStatus(product.quantity ?? 0);

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_4px_20px_rgba(99,102,241,0.08)]",
        isSelected && "ring-2 ring-indigo-500 border-transparent bg-indigo-50/5 dark:bg-indigo-950/5"
      )}
    >
      {/* Full Card Overlay Link */}
      <Link 
        href={`/product/${product.id}`} 
        className="absolute inset-0 z-10 cursor-pointer" 
        aria-label={`Открыть товар ${product.name}`}
      />

      {/* Selection Checkbox */}
      {selectionMode && (
        <div 
          className="absolute top-3 left-3 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(product.id)}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm bg-[var(--card-bg)]"
          />
        </div>
      )}

      {/* Floating Action Buttons Toolbar on Hover */}
      {!selectionMode && (
        <div 
          className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-4px] group-hover:translate-y-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={`/product/${product.id}/edit`}
            className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm transition-all duration-200 cursor-pointer"
            title="Редактировать"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDownloadBarcode(product.barcode)}
            className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm transition-all duration-200 cursor-pointer"
            title="Скачать штрихкод"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(product.id, product.name)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 text-red-600 dark:text-red-400 hover:bg-red-650 hover:text-white dark:hover:bg-red-650 dark:hover:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
            title="Удалить"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Product Image Wrapper */}
      <div className="relative aspect-[16/10] w-full bg-transparent overflow-hidden p-2">
        {product.photo_paths && product.photo_paths.length > 0 ? (
          <ProductImage
            src={product.photo_paths[0]}
            alt={product.name}
            fill
            className="object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600 text-xs font-mono">
            НЕТ ФОТО
          </div>
        )}

        {/* Overlay category badge */}
        {product.category && (
          <span 
            className={cn(
              "absolute z-10 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase bg-black/60 dark:bg-slate-900/80 text-white backdrop-blur-md border border-white/10 transition-opacity duration-300",
              selectionMode 
                ? "top-3 right-3" 
                : "top-3 left-3 group-hover:opacity-0 sm:group-hover:opacity-100 lg:group-hover:opacity-0" // Hide on hover to make room for action buttons if not selection mode
            )}
          >
            {product.category}
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Name and ID */}
        <div className="mb-2">
          <span className="text-[10px] font-mono text-[var(--text-color-muted)] block mb-1">
            ID: {product.id}
          </span>
          <div
            className="text-sm font-semibold text-[var(--text-color-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 min-h-[40px] leading-snug transition-colors"
          >
            {product.name}
          </div>
        </div>

        {/* Boxes relation */}
        <div className="mb-4 flex-1">
          {product.boxes && product.boxes.length > 0 ? (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[10px] text-[var(--text-color-muted)] mr-1">Коробки:</span>
              {product.boxes.slice(0, 2).map((box, index) => (
                <Link
                  key={index}
                  href={`/box-content?barcode=${box.barcode}`}
                  onClick={(e) => e.stopPropagation()}
                  className="relative z-20 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                >
                  {box.name.length > 10 ? box.name.slice(0, 10) + "..." : box.name}
                </Link>
              ))}
              {product.boxes.length > 2 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--background)] text-[var(--text-color-muted)] border border-[var(--card-border)]">
                  +{product.boxes.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] italic text-[var(--text-color-muted)]">
              Вне коробок
            </span>
          )}
        </div>

        {/* Price and Stock Row */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)] mt-auto">
          <div className="text-base font-bold text-[var(--text-color-primary)]">
            {product.price ? `${product.price} ₽` : "—"}
          </div>
          <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border", stock.color)}>
            {stock.label}
          </span>
        </div>
      </div>
    </div>
  );
}
