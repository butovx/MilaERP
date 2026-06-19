"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { H1, Label, ErrorText, SuccessText } from "@/components/Typography";
import Barcode from "@/components/Barcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  { id: "ozon", label: "Ozon доставка", icon: "🔵" },
  { id: "cdek", label: "СДЭК", icon: "⚡" },
  { id: "avito", label: "Авито доставка", icon: "🚚" },
];

export default function AddProductPage() {
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
    setSalesChannels((prev) => {
      const isCurrentlySelected = prev.includes(channel);
      const next = isCurrentlySelected ? prev.filter((c) => c !== channel) : [...prev, channel];
      
      if (!isCurrentlySelected) {
        if (channel === "ozon" && !deliveryMethods.includes("ozon")) {
          setDeliveryMethods((d) => [...d, "ozon"]);
        } else if (channel === "wildberries" && !deliveryMethods.includes("wb")) {
          setDeliveryMethods((d) => [...d, "wb"]);
        } else if (channel === "yandex_market" && !deliveryMethods.includes("yandex")) {
          setDeliveryMethods((d) => [...d, "yandex"]);
        }
      } else {
        if (channel === "ozon") {
          setDeliveryMethods((d) => d.filter((m) => m !== "ozon"));
        } else if (channel === "wildberries") {
          setDeliveryMethods((d) => d.filter((m) => m !== "wb"));
        } else if (channel === "yandex_market") {
          setDeliveryMethods((d) => d.filter((m) => m !== "yandex"));
        }
      }
      return next;
    });
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
    barcode?: string;
  } | null>(null);
  const [barcodeDownloaded, setBarcodeDownloaded] = useState(false);

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

  // Barcode download function
  const downloadBarcode = (barcode: string) => {
    const barcodeCanvas = document.getElementById(
      `barcode-${barcode}`
    ) as HTMLCanvasElement;
    if (barcodeCanvas) {
      const a = document.createElement("a");
      a.href = barcodeCanvas.toDataURL("image/png");
      a.download = `barcode-${barcode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setBarcodeDownloaded(true);
    } else {
      console.error("Штрихкод не найден на странице");
      alert("Не удалось скачать штрихкод");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setBarcodeDownloaded(false);

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

      const response = await fetch("/api/products", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        // Use the barcode field returned from the server
        const barcode = result.barcode;

        setResult({
          message: result.message,
          barcode: barcode,
        });

        setFormData({
          name: "",
          quantity: "",
          description: "",
          price: "",
          category: "",
        });
        setSalesChannels([]);
        setDeliveryMethods([]);
        setFiles(null);

        // Reset file input
        const fileInput = document.getElementById("photos") as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        // If the barcode is found, download it
        if (barcode) {
          // Add a small delay to allow the Barcode component to render
          setTimeout(() => {
            downloadBarcode(barcode); // Automatically download the barcode
          }, 500);
        }
      } else {
        setResult({
          error: result.error || "Произошла ошибка при добавлении товара",
        });
      }
    } catch (error) {
      setResult({ error: "Произошла ошибка при отправке формы" });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[100rem] mx-auto animate-fadeIn pb-12">
      <header className="mb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-color-primary)]">
          Добавить товар
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-color-muted)]">
          Быстро создавайте новые товары с описанием, фотографиями и штрих-кодами.
        </p>
      </header>

      <Card>
        <CardContent className="p-6 sm:p-8">
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
            <Label htmlFor="photos">Фотографии товара (до 10):</Label>
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

          <div>
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
                  Добавление...
                </>
              ) : (
                <>
                  <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                  Добавить товар
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

      {result && (
        <div className="mt-4">
          {result.message && <SuccessText>{result.message}</SuccessText>}
          {result.error && <ErrorText>{result.error}</ErrorText>}
          {result.barcode && (
            <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg max-w-md">
              <p className="text-[var(--text-color-primary)] font-semibold text-sm mb-2">Штрих-код товара:</p>
              <div className="bg-white p-2 rounded border border-[var(--card-border)] inline-block">
                <Barcode
                  value={result.barcode}
                  height={60}
                  width={1.3}
                  fontSize={12}
                  margin={4}
                  className="max-w-full"
                  textMargin={4}
                  id={`barcode-${result.barcode}`}
                />
              </div>
              <p className="text-xs text-[var(--text-color-secondary)] mt-2">
                {barcodeDownloaded ? (
                  "Штрихкод был автоматически скачан."
                ) : (
                  <>
                    Если загрузка не началась, нажмите{" "}
                    <button
                      onClick={() => downloadBarcode(result.barcode!)}
                      className="text-indigo-500 underline font-semibold hover:text-indigo-600 cursor-pointer"
                    >
                      здесь
                    </button>{" "}
                    для скачивания.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
