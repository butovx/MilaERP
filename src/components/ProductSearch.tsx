"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  onBarcodeInput?: (barcode: string) => void;
}

export default function ProductSearch({
  onSelect,
  onBarcodeInput,
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (searchTerm.length < 2) {
        setProducts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(searchTerm)}`
        );
        if (!response.ok) {
          throw new Error("Ошибка при поиске товаров");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError("Не удалось загрузить товары");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const barcode = e.target.value;
    if (onBarcodeInput) {
      onBarcodeInput(barcode);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="Штрихкод..."
          onChange={handleBarcodeChange}
          className="w-full sm:w-48 px-3 py-2 border rounded-md"
        />
      </div>

      {loading && <div className="mt-2 text-sm text-gray-500">Загрузка...</div>}
      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}

      {products.length > 0 && (
        <div className="mt-2 border rounded-md max-h-60 overflow-y-auto w-full">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelect(product)}
              className="px-3 py-3 sm:py-2 hover:bg-gray-100 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between border-b last:border-b-0 min-h-[44px] sm:min-h-0"
            >
              <div className="mb-1 sm:mb-0">
                <div className="font-medium truncate">{product.name}</div>
                <div className="text-sm text-gray-500">
                  Штрихкод: {product.barcode}
                </div>
              </div>
              <div className="text-sm text-gray-500 sm:ml-2">
                {product.quantity} шт.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
