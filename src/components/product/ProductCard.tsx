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
      {/* Selection Overlay */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(product.id)}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm"
          />
        </div>
      )}

      {/* Product Image Wrapper */}
      <div className="relative aspect-[4/3] w-full bg-slate-50 dark:bg-slate-950/40 overflow-hidden border-b border-[var(--card-border)]/50">
        {product.photo_paths && product.photo_paths.length > 0 ? (
          <ProductImage
            src={product.photo_paths[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600 text-xs font-mono">
            НЕТ ФОТО
          </div>
        )}

        {/* Overlay category badge */}
        {product.category && (
          <span className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-black/60 dark:bg-black/80 text-white backdrop-blur-md border border-white/10">
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
          <Link
            href={`/product/${product.id}`}
            className="text-sm font-semibold text-[var(--text-color-primary)] hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 min-h-[40px] leading-snug"
          >
            {product.name}
          </Link>
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
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
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
        <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]/50 mt-auto">
          <div className="text-base font-bold text-[var(--text-color-primary)]">
            {product.price ? `${product.price} ₽` : "—"}
          </div>
          <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border", stock.color)}>
            {stock.label}
          </span>
        </div>
      </div>

      {/* Hover Action Overlay */}
      {!selectionMode && (
        <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10">
          <Link
            href={`/product/${product.id}`}
            className="p-2 rounded-full bg-white text-gray-900 hover:bg-indigo-500 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0"
            title="Открыть"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </Link>
          <Link
            href={`/product/${product.id}/edit`}
            className="p-2 rounded-full bg-white text-gray-900 hover:bg-indigo-500 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 delay-[50ms]"
            title="Редактировать"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={() => onDownloadBarcode(product.barcode)}
            className="p-2 rounded-full bg-white text-gray-900 hover:bg-indigo-500 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 delay-[100ms] cursor-pointer"
            title="Скачать штрихкод"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(product.id, product.name)}
            disabled={isDeleting}
            className="p-2 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 delay-[150ms] cursor-pointer disabled:opacity-50"
            title="Удалить"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
