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
          <div className="md:w-1/2 p-6">
            <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
              {product.photo_paths && product.photo_paths.length > 0 ? (
                <>
                  <ProductImage
                    src={product.photo_paths[currentPhotoIndex]}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                  {product.photo_paths.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1 hover:bg-opacity-100"
                      >
                        <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1 hover:bg-opacity-100"
                      >
                        <ArrowRightIcon className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">Нет фотографий</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.photo_paths && product.photo_paths.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto">
                {product.photo_paths.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`h-16 w-16 relative flex-shrink-0 rounded-md overflow-hidden ${
                      index === currentPhotoIndex ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <ProductImage
                      src={photo}
                      alt={`Миниатюра ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Information block */}
          <div className="md:w-1/2 p-6 border-t md:border-t-0 md:border-l border-[var(--card-border)] bg-[var(--background)]/20">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            <div className="py-4 border-t border-b border-[var(--card-border)]/50 mb-4 divide-y divide-[var(--card-border)]/30 space-y-2 text-xs sm:text-sm">
              <p className="text-[var(--text-color-muted)] pb-1.5 flex justify-between">
                Артикул: <span className="text-[var(--text-color-primary)] font-semibold">{product.id}</span>
              </p>
              <p className="text-[var(--text-color-muted)] pb-1.5 flex justify-between">
                Штрихкод:{" "}
                <span className="text-[var(--text-color-primary)] font-semibold">{product.barcode}</span>
              </p>
              <p className="text-[var(--text-color-muted)] pb-1.5 flex justify-between">
                Количество:{" "}
                <span className="text-[var(--text-color-primary)] font-semibold">{product.quantity ?? "-"}</span>
              </p>
              <p className="text-[var(--text-color-muted)] pb-1.5 flex justify-between">
                Цена:{" "}
                <span className="text-[var(--text-color-primary)] font-semibold">
                  {product.price ? `${product.price} ₽` : "-"}
                </span>
              </p>
              <p className="text-[var(--text-color-muted)] pb-1.5 flex justify-between">
                Категория:{" "}
                <span className="text-[var(--text-color-primary)] font-semibold">{product.category || "-"}</span>
              </p>
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Описание</h2>
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {product.boxes && product.boxes.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Находится в коробках
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.boxes.map((box, index) => (
                    <Link
                      key={index}
                      href={`/box-content?barcode=${box.barcode}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/25 transition-all duration-150"
                    >
                      {box.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Штрихкод</h2>
              <div className="bg-white p-3 border border-[var(--card-border)] rounded-lg inline-block">
                <Barcode
                  value={product.barcode}
                  height={80}
                  width={1.5}
                  fontSize={16}
                  margin={10}
                  className="max-w-full"
                  textMargin={5}
                  id={`barcode-${product.barcode}`}
                />
              </div>
            </div>

            <Button
              onClick={downloadBarcode}
              size="sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Скачать штрихкод
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
