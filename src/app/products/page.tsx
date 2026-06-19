"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import ProductCard from "@/components/product/ProductCard";
import { cn } from "@/utils/cn";
import { H1, H2, Text, ErrorText } from "@/components/Typography";
import ProductImage from "@/components/ProductImage";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import JsBarcode from "jsbarcode";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deletingSingleId, setDeletingSingleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filtering and sorting state
  const [categoryFilter, setCategoryFilter] = useState("");
  const [salesChannelFilter, setSalesChannelFilter] = useState("");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("");
  const [noDeliveryFilter, setNoDeliveryFilter] = useState(false);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // State for selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // State for working with boxes
  const [boxes, setBoxes] = useState<
    { id: number; name: string; barcode: string }[]
  >([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [isAddingToBox, setIsAddingToBox] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);



  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, salesChannelFilter, deliveryMethodFilter, noDeliveryFilter, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    if (selectionMode && selectedProducts.length > 0) {
      fetchBoxes();
    }
  }, [selectionMode, selectedProducts.length]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/products?all=true");
      if (response.ok) {
        const data: Product[] = await response.json();
        const uniqueCats = Array.from(
          new Set(data.map((p) => p.category).filter((c): c is string => !!c))
        );
        setCategories(uniqueCats);
      }
    } catch (err) {
      console.error("Не удалось загрузить категории:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        category: categoryFilter,
        sales_channel: salesChannelFilter,
        delivery_method: deliveryMethodFilter,
        no_delivery: String(noDeliveryFilter),
        sort: sortBy,
        order: sortOrder,
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError("Не удалось загрузить список товаров");
      console.error(err);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось загрузить список товаров",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProductSingle = async (id: number, name: string) => {
    if (!confirm(`Вы действительно хотите удалить товар "${name}"?\nЭто действие нельзя отменить.`)) {
      return;
    }
    setDeletingSingleId(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `Товар "${name}" удален`,
        });
        fetchProducts();
        fetchCategories();
      } else {
        const data = await response.json();
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: data.error || "Произошла ошибка при удалении товара",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении товара",
      });
    } finally {
      setDeletingSingleId(null);
    }
  };

  const fetchBoxes = async () => {
    try {
      setIsLoadingBoxes(true);
      const response = await fetch("/api/boxes?all=true");
      if (!response.ok) {
        throw new Error("Ошибка при получении списка коробок");
      }
      const data = await response.json();
      setBoxes(data);
    } catch (err) {
      console.error("Не удалось загрузить список коробок:", err);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось загрузить список коробок",
      });
    } finally {
      setIsLoadingBoxes(false);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProducts([]);
    setIsAllSelected(false);
    setSelectedBoxId(null);
  };

  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) return;

    if (
      !confirm(
        `Вы действительно хотите удалить выбранные товары (${selectedProducts.length} шт.)?\nЭто действие нельзя отменить.`
      )
    ) {
      return;
    }



    try {
      const results = await Promise.all(
        selectedProducts.map((id) =>
          fetch(`/api/products/${id}`, { method: "DELETE" })
        )
      );

      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `Удалено ${selectedProducts.length} товаров`,
        });
        setSelectedProducts([]);
        fetchProducts();
        fetchCategories();
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: "Произошла ошибка при удалении некоторых товаров",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении товаров:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении товаров",
      });
    }
  };

  const addSelectedProductsToBox = async () => {
    if (selectedProducts.length === 0 || !selectedBoxId) return;

    setIsAddingToBox(true);

    try {
      const response = await fetch("/api/box-items/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          box_id: selectedBoxId,
          product_ids: selectedProducts,
          quantity: quantityToAdd,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const selectedBox = boxes.find((box) => box.id === selectedBoxId);
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `${selectedProducts.length} товаров добавлено в коробку "${selectedBox?.name}"`,
        });

        // Refresh product list to reflect new box relationships
        fetchProducts();

        // Reset selection
        setSelectedProducts([]);
        setSelectedBoxId(null);
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description:
            result.error || "Произошла ошибка при добавлении товаров в коробку",
        });
      }
    } catch (error) {
      console.error("Ошибка при добавлении товаров в коробку:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при добавлении товаров в коробку",
      });
    } finally {
      setIsAddingToBox(false);
    }
  };

  const columns = [
    ...(selectionMode
      ? [
          {
            key: "select",
            header: (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            render: (product: Product) => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            mobilePriority: 1,
          },
        ]
      : []),
    {
      key: "id",
      header: "ID",
      render: (product: Product) => (
        <div className="font-mono text-gray-600 w-[60px] text-center">
          {product.id}
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "photo",
      header: "Фото",
      render: (product: Product) =>
        product.photo_paths && product.photo_paths.length > 0 ? (
          <Link href={`/product/${product.id}`}>
            <div className="h-8 w-8 md:h-8 md:w-8 sm:w-24 sm:h-24 xs:w-20 xs:h-20 relative">
              <ProductImage
                src={product.photo_paths[0]}
                alt={product.name}
                fill
                className="rounded-md object-cover"
              />
            </div>
          </Link>
        ) : (
          <Link href={`/product/${product.id}`}>
            <div className="h-8 w-8 md:h-8 md:w-8 sm:w-24 sm:h-24 xs:w-20 xs:h-20 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-500 text-xs">Нет</span>
            </div>
          </Link>
        ),
      mobilePriority: 1,
    },
    {
      key: "name",
      header: "Название",
      render: (product: Product) => (
        <Link
          href={`/product/${product.id}`}
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          <div className="max-w-[350px] min-w-[200px]" title={product.name}>
            {product.name}
          </div>
        </Link>
      ),
      mobilePriority: 1,
    },
    {
      key: "quantity",
      header: "Количество",
      render: (product: Product) => (
        <div className="w-[70px] text-center">{product.quantity ?? "-"}</div>
      ),
      mobilePriority: 2,
    },
    {
      key: "price",
      header: "Цена",
      render: (product: Product) => (
        <div className="w-[80px] text-right">
          {product.price ? `${product.price} ₽` : "-"}
        </div>
      ),
      mobilePriority: 2,
    },
    {
      key: "category",
      header: "Категория",
      render: (product: Product) => (
        <div className="w-[120px]">{product.category || "-"}</div>
      ),
      mobilePriority: 3,
    },
    {
      key: "sales_channels",
      header: "Каналы",
      render: (product: Product) => {
        const icons: Record<string, string> = {
          physical_store: "🏬",
          avito: "💬",
          ozon: "🔵",
          wildberries: "🟣",
          yandex_market: "🟡",
          website: "🌐",
        };
        const names: Record<string, string> = {
          physical_store: "Физический магазин",
          avito: "Авито",
          ozon: "Озон",
          wildberries: "Вайлдберис",
          yandex_market: "Яндекс Маркет",
          website: "Сайт-магазин",
        };
        return product.sales_channels && product.sales_channels.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[120px]">
            {product.sales_channels.map((channel) => (
              <span
                key={channel}
                title={names[channel] || channel}
                className="text-base filter drop-shadow-sm select-none"
              >
                {icons[channel] || "📦"}
              </span>
            ))}
          </div>
        ) : (
          <div className="w-[60px] text-center">-</div>
        );
      },
      mobilePriority: 3,
    },
    {
      key: "barcode",
      header: "Штрихкод",
      render: (product: Product) => (
        <div className="font-mono w-[120px]">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadBarcode(product.barcode);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            title="Нажмите для скачивания штрихкода"
          >
            {product.barcode}
          </a>
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "boxes",
      header: "Коробки",
      render: (product: Product) =>
        product.boxes && product.boxes.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[140px]">
            {product.boxes.slice(0, 2).map((box, index) => (
              <Link
                key={index}
                href={`/box-content?barcode=${box.barcode}`}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/25 transition-colors"
              >
                {box.name.length > 10
                  ? box.name.slice(0, 10) + "..."
                  : box.name}
              </Link>
            ))}
            {product.boxes.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--background)] text-[var(--text-color-muted)] border border-[var(--card-border)]">
                +{product.boxes.length - 2}
              </span>
            )}
          </div>
        ) : (
          <div className="w-[120px] text-center">-</div>
        ),
      mobilePriority: 3,
    },
    {
      key: "actions",
      header: "Действия",
      render: (product: Product) => (
        <div className="flex gap-1.5 justify-end">
          <Link
            href={`/product/${product.id}/edit`}
            className="p-1 rounded text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Редактировать"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
          <button
            onClick={() => downloadBarcode(product.barcode)}
            className="p-1 rounded text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Скачать штрихкод"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteProductSingle(product.id, product.name)}
            disabled={deletingSingleId === product.id}
            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer disabled:opacity-50"
            title="Удалить"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      mobilePriority: 2,
    },
  ];

  // Barcode download function
  const downloadBarcode = (barcode: string) => {
    // Create a temporary canvas element with the Barcode component
    const tempCanvas = document.createElement("canvas");
    tempCanvas.id = `temp-barcode-${barcode}`;
    document.body.appendChild(tempCanvas);

    try {
      JsBarcode(tempCanvas, barcode, {
        format: "EAN13",
        width: 1.5,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      // Barcode download
      const link = document.createElement("a");
      link.download = `barcode-${barcode}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();

      // Remove temporary elements
      document.body.removeChild(link);
      document.body.removeChild(tempCanvas);

      toast.success({
        id: genId(),
        title: "Успешно",
        description: `Штрихкод ${barcode} скачан`,
      });
    } catch (error) {
      console.error("Ошибка при создании штрих-кода:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось скачать штрихкод",
      });
    }
  };

  // Add genId function based on existing code
  const genId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2.5 mx-auto"></div>
          <Text>Загрузка списка товаров...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <H2>Ошибка загрузки</H2>
        <div className="max-w-md mx-auto bg-red-50 p-4 rounded-lg mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-4">
        <H1>Список товаров</H1>
        <div className="flex gap-3">
          {selectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={toggleSelectionMode}
                className="text-sm"
              >
                Отменить выбор
              </Button>
              <Button
                variant="destructive"
                onClick={deleteSelectedProducts}
                disabled={selectedProducts.length === 0}
                className="text-sm"
              >
                Удалить выбранные ({selectedProducts.length})
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={toggleSelectionMode}
                className="text-sm hidden sm:inline-flex"
              >
                Выбрать товары
              </Button>
              <Link href="/add-product" className="w-full sm:w-auto">
                <Button className="text-sm" size="mobile" fullWidthMobile>
                  + Добавить товар
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filters, Search and Sorting */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[var(--text-color-muted)]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, ID, штрихкоду или категории..."
            className="pl-10 pr-4 py-2 w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filter by Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting & View Mode Toggle */}
        <div className="flex gap-2 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="id">Сортировка: ID</option>
            <option value="name">Сортировка: Название</option>
            <option value="quantity">Сортировка: Кол-во</option>
            <option value="price">Сортировка: Цена</option>
            <option value="created_at">Сортировка: Создан</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="asc">↑</option>
            <option value="desc">↓</option>
          </select>
          
          {/* View Mode Toggle Buttons */}
          <div className="flex bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md p-1 h-[40px] items-center">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-colors cursor-pointer",
                viewMode === "grid" 
                  ? "bg-indigo-500/10 text-indigo-505" 
                  : "text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)]"
              )}
              title="Сетка"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded transition-colors cursor-pointer",
                viewMode === "table" 
                  ? "bg-indigo-500/10 text-indigo-505" 
                  : "text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)]"
              )}
              title="Таблица"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters: Sales Channel & Delivery */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Filter by Sales Channel */}
        <div>
          <select
            value={salesChannelFilter}
            onChange={(e) => {
              setSalesChannelFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">Все каналы продаж</option>
            <option value="physical_store">🏬 Физический магазин</option>
            <option value="avito">💬 Авито</option>
            <option value="ozon">🔵 Озон</option>
            <option value="wildberries">🟣 Вайлдберис</option>
            <option value="yandex_market">🟡 Яндекс Маркет</option>
            <option value="website">🌐 Сайт-магазин</option>
          </select>
        </div>

        {/* Filter by Delivery Method */}
        <div>
          <select
            value={deliveryMethodFilter}
            disabled={noDeliveryFilter}
            onChange={(e) => {
              setDeliveryMethodFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="">Все способы доставки</option>
            <option value="post">📯 Почта России</option>
            <option value="yandex">🚗 Яндекс Маркет Доставка</option>
            <option value="wb">📦 WB доставка</option>
            <option value="ozon">🔵 Ozon доставка</option>
            <option value="cdek">⚡ СДЭК</option>
            <option value="avito">🚚 Авито доставка</option>
          </select>
        </div>

        {/* Filter by No Delivery Checkbox */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] h-[40px] text-xs">
          <input
            type="checkbox"
            id="noDeliveryFilter"
            checked={noDeliveryFilter}
            onChange={(e) => {
              const checked = e.target.checked;
              setNoDeliveryFilter(checked);
              if (checked) {
                setDeliveryMethodFilter(""); // Clear delivery method filter if checking "no delivery"
              }
              setPage(1);
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="noDeliveryFilter" className="text-[var(--text-color-secondary)] font-medium cursor-pointer select-none">
            ❌ Без доставки (не используется)
          </label>
        </div>
      </div>

      {selectionMode && selectedProducts.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-fadeIn">
          <h3 className="text-sm font-semibold mb-3">
            Выбрано товаров: {selectedProducts.length}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1.5">
                Выберите коробку:
              </label>
              <div className="flex flex-wrap gap-2">
                {isLoadingBoxes ? (
                  <div className="animate-pulse w-full h-9 bg-black/5 dark:bg-white/5 rounded"></div>
                ) : boxes.length === 0 ? (
                  <p className="text-xs text-[var(--text-color-muted)] italic">Нет доступных коробок</p>
                ) : (
                  <select
                    value={selectedBoxId || ""}
                    onChange={(e) => setSelectedBoxId(Number(e.target.value))}
                    className="block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Выберите коробку</option>
                    {boxes.map((box) => (
                      <option key={box.id} value={box.id}>
                        {box.name} (#{box.barcode})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1.5">
                Количество:
              </label>
              <input
                type="number"
                min="1"
                value={quantityToAdd}
                onChange={(e) =>
                  setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="block w-32 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={addSelectedProductsToBox}
              disabled={isAddingToBox || !selectedBoxId}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 cursor-pointer transition-colors"
            >
              {isAddingToBox ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Добавление...
                </>
              ) : (
                "Добавить в коробку"
              )}
            </button>
          </div>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="mt-6 text-center py-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
          <Text className="text-[var(--text-color-muted)] mb-0">
            {debouncedSearch.trim() || categoryFilter
              ? "По вашему запросу ничего не найдено"
              : "Список товаров пуст"}
          </Text>
        </div>
      )}

      {products.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle>
              {debouncedSearch.trim() || categoryFilter
                ? `Найдено товаров: ${totalCount}`
                : `Все товары: ${totalCount}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <DataTable
                columns={columns}
                data={products}
                emptyMessage={
                  debouncedSearch.trim() || categoryFilter
                    ? "По вашему запросу ничего не найдено"
                    : "Список товаров пуст"
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selectionMode={selectionMode}
                    isSelected={selectedProducts.includes(product.id)}
                    onToggleSelect={toggleProductSelection}
                    onDownloadBarcode={downloadBarcode}
                    onDelete={deleteProductSingle}
                    isDeleting={deletingSingleId === product.id}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)] pt-4 px-2">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Вперед
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-color-secondary)]">
                      Показано от <span className="font-semibold text-[var(--text-color-primary)]">{(page - 1) * limit + 1}</span> до{" "}
                      <span className="font-semibold text-[var(--text-color-primary)]">
                        {Math.min(page * limit, totalCount)}
                      </span>{" "}
                      из <span className="font-semibold text-[var(--text-color-primary)]">{totalCount}</span> товаров
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md px-3 py-1.5 text-[var(--text-color-muted)] ring-1 ring-inset ring-[var(--card-border)] hover:bg-[var(--background)]/50 focus:z-20 focus:outline-offset-0 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer"
                      >
                        Назад
                      </button>
                      {getPageNumbers().map((p, idx) => {
                        if (typeof p === "string") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-[var(--text-color-secondary)] ring-1 ring-inset ring-[var(--card-border)] focus:outline-none"
                            >
                              {p}
                            </span>
                          );
                        }
                        const isCurrent = p === page;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              isCurrent
                                ? "z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                : "text-[var(--text-color-primary)] ring-1 ring-inset ring-[var(--card-border)] hover:bg-[var(--background)]/50 focus:z-20 focus:outline-offset-0"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-3 py-1.5 text-[var(--text-color-muted)] ring-1 ring-inset ring-[var(--card-border)] hover:bg-[var(--background)]/50 focus:z-20 focus:outline-offset-0 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer"
                      >
                        Вперед
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
