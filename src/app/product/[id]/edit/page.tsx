"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { H1, Label, ErrorText, SuccessText } from "@/components/Typography";
import ProductImage from "@/components/ProductImage";
import { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const SALES_CHANNELS_OPTIONS = [
  { id: "physical_store", label: "Физический магазин", icon: "🏬" },
  { id: "avito", label: "Авито", icon: "💬" },
  { id: "ozon", label: "Озон", icon: "🔵" },
  { id: "wildberries", label: "Вайлдберис", icon: "🟣" },
  { id: "yandex_market", label: "Яндекс Маркет", icon: "🟡" },
  { id: "website", label: "Сайт-магазин", icon: "🌐" },
];

const DELIVERY_METHODS_OPTIONS = [
  { id: "post", label: "Почта России", icon: "📯" },
  { id: "yandex", label: "Яндекс Маркет Доставка", icon: "🚗" },
  { id: "wb", label: "WB доставка", icon: "📦" },
  { id: "cdek", label: "СДЭК", icon: "⚡" },
  { id: "avito", label: "Авито доставка", icon: "🚚" },
];

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {

  // Use the React.use wrapper for params in client-side code
  // We need to use React.use for unwrapping params in client components
  const [productId, setProductId] = useState<string>("");

  useEffect(() => {
    const getParamId = async () => {
      const unwrappedParams = await params;
      setProductId(unwrappedParams.id);
    };
    getParamId();
  }, [params]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    description: "",
    price: "",
    category: "",
  });
  const [salesChannels, setSalesChannels] = useState<string[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>([]);

  const toggleSalesChannel = (channel: string) => {
    setSalesChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const toggleDeliveryMethod = (method: string) => {
    setDeliveryMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<{
    message?: string;
    error?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error("Ошибка при получении данных товара");
      }

      const data = await response.json();
      setProduct(data);

      // Fill form with product data
      setFormData({
        name: data.name || "",
        quantity: data.quantity?.toString() || "",
        description: data.description || "",
        price: data.price?.toString() || "",
        category: data.category || "",
      });
      setSalesChannels(data.sales_channels || []);
      setDeliveryMethods(data.delivery_methods || []);
    } catch (err) {
      console.error("Ошибка при загрузке товара:", err);
      setResult({ error: "Не удалось загрузить информацию о товаре" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append("sales_channels", JSON.stringify(salesChannels));
      data.append("delivery_methods", JSON.stringify(deliveryMethods));

      if (files) {
        Array.from(files).forEach((file) => {
          data.append("photos", file);
        });
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setResult({
          message: "Товар успешно обновлен",
        });

        // Refresh product data
        fetchProduct();
      } else {
        setResult({
          error: result.error || "Произошла ошибка при обновлении товара",
        });
      }
    } catch (error) {
      setResult({ error: "Произошла ошибка при отправке формы" });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoPath: string) => {
    try {
      setIsDeleting(photoPath);

      const response = await fetch(`/api/products/${productId}/photo`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoPath }),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh product data after photo deletion
        fetchProduct();
        setResult({
          message: "Фотография успешно удалена",
        });
      } else {
        setResult({
          error: result.error || "Ошибка при удалении фотографии",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении фотографии:", error);
      setResult({ error: "Произошла ошибка при удалении фотографии" });
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2.5 mx-auto"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/product/${productId}`}
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Назад
        </Link>
        <H1 className="text-center flex-1">Редактирование</H1>
        <div className="w-14"></div>
      </div>

      {result && (
        <div className="mb-6">
          {result.error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
              <ErrorText>{result.error}</ErrorText>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-4">
              <SuccessText>{result.message}</SuccessText>
            </div>
          )}
        </div>
      )}

      <Card className="mb-6"><CardContent className="p-6 sm:p-8">
        {product && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Текущие фото:</h2>
            <div className="flex flex-wrap gap-4">
              {product.photo_paths && product.photo_paths.length > 0 ? (
                product.photo_paths.map((photo, index) => (
                  <div key={index} className="h-24 w-24 relative group">
                    <ProductImage
                      src={photo}
                      alt={`Фото ${index + 1}`}
                      fill
                      className="rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={isDeleting === photo}
                      className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full m-1 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Удалить фото"
                    >
                      {isDeleting === photo ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <XMarkIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Нет фотографий</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Название:</Label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1.5 block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs sm:text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Количество:</Label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="mt-1.5 block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs sm:text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание:</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1.5 block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs sm:text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <Label htmlFor="price">Цена:</Label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1.5 block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs sm:text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <Label htmlFor="category">Категория:</Label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1.5 block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs sm:text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <Label>Где продается (Каналы продаж):</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1.5">
              {SALES_CHANNELS_OPTIONS.map((option) => {
                const isSelected = salesChannels.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleSalesChannel(option.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl border transition-all duration-200 cursor-pointer text-left",
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-650 dark:text-indigo-400 font-bold"
                        : "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color-secondary)] hover:border-indigo-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                    )}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Способы доставки:</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1.5">
              {DELIVERY_METHODS_OPTIONS.map((option) => {
                const isSelected = deliveryMethods.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDeliveryMethod(option.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 text-xs sm:text-sm font-medium rounded-xl border transition-all duration-200 cursor-pointer text-left",
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-650 dark:text-indigo-400 font-bold"
                        : "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color-secondary)] hover:border-indigo-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                    )}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="photos">Добавить новые фотографии (до 10):</Label>
            <p className="text-xs text-[var(--text-color-muted)] mb-2">
              Новые фотографии будут добавлены к существующим
            </p>
            <input
              type="file"
              id="photos"
              name="photos"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="mt-1.5 block w-full text-xs text-[var(--text-color-secondary)] file:mr-4 file:py-1.5 file:px-3.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-500 dark:file:text-indigo-400 hover:file:bg-indigo-500/25 transition-colors cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              href={`/product/${productId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")}
            >
              Отмена
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
          </div>
        </form>
        </CardContent></Card>
    </div>
  );
}
