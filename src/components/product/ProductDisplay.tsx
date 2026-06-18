"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ProductImage from "@/components/ProductImage";
import Barcode from "@/components/Barcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductDisplayProps {
  productId: string;
}

export default function ProductDisplay({ productId }: ProductDisplayProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError("Не удалось загрузить информацию о товаре");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextPhoto = () => {
    if (!product || !product.photo_paths || product.photo_paths.length <= 1)
      return;
    setCurrentPhotoIndex((currentPhotoIndex + 1) % product.photo_paths.length);
  };

  const prevPhoto = () => {
    if (!product || !product.photo_paths || product.photo_paths.length <= 1)
      return;
    setCurrentPhotoIndex(
      (currentPhotoIndex - 1 + product.photo_paths.length) %
        product.photo_paths.length
    );
  };

  const downloadBarcode = () => {
    if (!product) return;

    const barcodeCanvas = document.getElementById(
      `barcode-${product.barcode}`
    ) as HTMLCanvasElement;
    if (barcodeCanvas) {
      const a = document.createElement("a");
      a.href = barcodeCanvas.toDataURL("image/png");
      a.download = `barcode-${product.barcode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      console.error("Штрихкод не найден на странице");
      alert("Не удалось скачать штрихкод");
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (
      !confirm(
        `Вы действительно хотите удалить товар "${product.name}"?\nЭто действие нельзя отменить.`
      )
    )
      return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert(`Товар "${product.name}" успешно удален`);
        router.push("/products");
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении товара");
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      alert("Произошла ошибка при удалении товара");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-2 text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-red-800 font-medium">Ошибка</h2>
          <p className="text-red-700 mt-1">{error || "Товар не найден"}</p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Вернуться к списку товаров
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/products"
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Вернуться к списку товаров
        </Link>

        <div className="flex space-x-3">
          <Link
            href={`/product/${product.id}/edit`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "no-underline")}
          >
            <PencilIcon className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Редактировать</span>
          </Link>

          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            {isDeleting ? (
              <svg
                className="animate-spin h-4 w-4 sm:mr-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <TrashIcon className="h-4 w-4 sm:mr-1" />
            )}
            <span className="hidden sm:inline">Удалить</span>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
        <div className="md:flex">
          {/* Photos block */}
          <div className="md:w-[35%] p-4 flex flex-col justify-center bg-transparent">
            <div className="relative h-80 w-full bg-transparent overflow-hidden flex items-center justify-center">
              {product.photo_paths && product.photo_paths.length > 0 ? (
                <>
                  <ProductImage
                    src={product.photo_paths[currentPhotoIndex]}
                    alt={product.name}
                    fill
                    className="object-contain transition-all duration-300 rounded-2xl"
                  />
                  {product.photo_paths.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-[var(--card-border)]/50 rounded-full p-2 hover:shadow transition-all duration-200 cursor-pointer z-10"
                      >
                        <ArrowLeftIcon className="h-5 w-5 text-[var(--text-color-primary)]" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-[var(--card-border)]/50 rounded-full p-2 hover:shadow transition-all duration-200 cursor-pointer z-10"
                      >
                        <ArrowRightIcon className="h-5 w-5 text-[var(--text-color-primary)]" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-650 font-mono text-sm">
                  <span>НЕТ ФОТОГРАФИЙ</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.photo_paths && product.photo_paths.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 justify-center">
                {product.photo_paths.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`h-16 w-16 relative flex-shrink-0 rounded-xl overflow-hidden border transition-all duration-200 bg-transparent ${
                      index === currentPhotoIndex 
                        ? "border-indigo-500 ring-2 ring-indigo-500/25" 
                        : "border-[var(--card-border)] hover:border-indigo-500/50"
                    }`}
                  >
                    <ProductImage
                      src={photo}
                      alt={`Миниатюра ${index + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Information block */}
          <div className="md:w-[65%] p-8 border-t md:border-t-0 md:border-l border-[var(--card-border)] bg-[var(--background)]/10 flex flex-col justify-between">
            <div>
              {/* Category Tag */}
              {product.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-500/20">
                  {product.category}
                </span>
              )}

              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-color-primary)] tracking-tight mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Price & Stock status info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/50 dark:bg-black/25 border border-[var(--card-border)]/50 rounded-xl">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[var(--text-color-muted)] font-bold mb-0.5">Цена</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-450">
                    {product.price ? `${product.price} ₽` : "—"}
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-[var(--card-border)]/45 hidden sm:block"></div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[var(--text-color-muted)] font-bold mb-0.5">Статус склада</span>
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                    product.quantity && product.quantity > 15
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20"
                      : product.quantity && product.quantity > 0
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-450 border-red-500/20"
                  )}>
                    {product.quantity ? `${product.quantity} шт. в наличии` : "Нет на складе"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--text-color-muted)] font-bold mb-2">Описание</h3>
                  <p className="text-sm text-[var(--text-color-secondary)] leading-relaxed bg-[var(--background)]/30 p-4 rounded-xl border border-[var(--card-border)]/20">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Key Specs */}
              <div className="mb-6 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-color-muted)] font-bold mb-1">Спецификации</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--background)]/35 border border-[var(--card-border)]/30 rounded-xl">
                    <span className="block text-[10px] text-[var(--text-color-muted)] mb-0.5">Артикул / ID</span>
                    <span className="text-sm font-mono font-semibold text-[var(--text-color-primary)]">{product.id}</span>
                  </div>
                  <div className="p-3 bg-[var(--background)]/35 border border-[var(--card-border)]/30 rounded-xl">
                    <span className="block text-[10px] text-[var(--text-color-muted)] mb-0.5">Штрихкод (EAN-13)</span>
                    <span className="text-sm font-mono font-semibold text-[var(--text-color-primary)]">{product.barcode}</span>
                  </div>
                </div>
              </div>

              {/* Boxes section */}
              {product.boxes && product.boxes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--text-color-muted)] font-bold mb-2">Находится в коробках</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.boxes.map((box, index) => (
                      <Link
                        key={index}
                        href={`/box-content?barcode=${box.barcode}`}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/10 transition-all duration-150"
                      >
                        📦 {box.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barcode & Download Section */}
            <div className="mt-6 pt-6 border-t border-[var(--card-border)]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="bg-white p-3 border border-[var(--card-border)] rounded-xl shadow-sm inline-block">
                <Barcode
                  value={product.barcode}
                  height={60}
                  width={1.5}
                  fontSize={14}
                  margin={8}
                  className="max-w-full"
                  textMargin={4}
                  id={`barcode-${product.barcode}`}
                />
              </div>
              <Button
                onClick={downloadBarcode}
                size="default"
                className="w-full sm:w-auto shadow-md"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Скачать штрихкод
              </Button>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
