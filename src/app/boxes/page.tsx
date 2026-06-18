"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  EyeIcon,
  TrashIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Box } from "@/types";
import Barcode from "@/components/Barcode";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import JsBarcode from "jsbarcode";

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boxName, setBoxName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [deletingBoxId, setDeletingBoxId] = useState<number | null>(null);
  const [expandedBarcodes, setExpandedBarcodes] = useState<Set<string>>(
    new Set()
  );

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting and search state
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add state for selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [deletingBoxesIds, setDeletingBoxesIds] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchBoxes();
  }, [page, debouncedSearch, sortBy, sortOrder]);

  const fetchBoxes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        sort: sortBy,
        order: sortOrder,
      });
      const response = await fetch(`/api/boxes?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }
      const data = await response.json();
      setBoxes(data.boxes || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError("Не удалось загрузить список коробок");
      console.error(err);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось загрузить список коробок",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boxName.trim()) {
      toast.warning({
        id: genId(),
        title: "Предупреждение",
        description: "Введите название коробки",
      });
      return;
    }

    setCreating(true);
    setCreateResult(null);

    try {
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: boxName }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success({
          id: genId(),
          title: "Коробка создана",
          description: `Артикул: ${result.barcode}`,
        });
        setBoxName("");
        fetchBoxes(); // Refresh box list
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: result.error || "Ошибка при создании коробки",
        });
      }
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при отправке формы",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBox = async (id: number) => {
    if (!confirm("Вы действительно хотите удалить эту коробку?")) return;

    try {
      setDeletingBoxId(id);
      const response = await fetch(`/api/boxes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success({
          id: genId(),
          title: "Успешно",
          description: "Коробка удалена",
        });
        fetchBoxes();
      } else {
        const data = await response.json();
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: data.error || "Ошибка при удалении коробки",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении коробки:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении коробки",
      });
    } finally {
      setDeletingBoxId(null);
    }
  };

  const copyBarcodeToClipboard = (barcode: string) => {
    navigator.clipboard
      .writeText(barcode)
      .then(() => {
        toast.success({
          id: genId(),
          title: "Скопировано",
          description: `Штрихкод ${barcode} скопирован в буфер обмена`,
        });
      })
      .catch((err) => {
        console.error("Ошибка при копировании:", err);
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: "Не удалось скопировать штрихкод",
        });
      });
  };

  const toggleBarcode = (barcode: string) => {
    setExpandedBarcodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(barcode)) {
        newSet.delete(barcode);
      } else {
        newSet.add(barcode);
      }
      return newSet;
    });
  };

  // Sorting has been moved to the backend

  const genId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

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

  // Add functions for working with selected boxes
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedBoxes([]);
    setIsAllSelected(false);
  };

  const toggleBoxSelection = (boxId: number) => {
    if (selectedBoxes.includes(boxId)) {
      setSelectedBoxes(selectedBoxes.filter((id) => id !== boxId));
    } else {
      setSelectedBoxes([...selectedBoxes, boxId]);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBoxes([]);
    } else {
      setSelectedBoxes(boxes.map((box) => box.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const deleteSelectedBoxes = async () => {
    if (selectedBoxes.length === 0) return;

    if (
      !confirm(
        `Вы действительно хотите удалить выбранные коробки (${selectedBoxes.length} шт.)?\nЭто действие нельзя отменить.`
      )
    ) {
      return;
    }

    setDeletingBoxesIds([...selectedBoxes]);

    try {
      const results = await Promise.all(
        selectedBoxes.map((id) =>
          fetch(`/api/boxes/${id}`, { method: "DELETE" })
        )
      );

      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `Удалено ${selectedBoxes.length} коробок`,
        });
        setSelectedBoxes([]);
        fetchBoxes();
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: "Произошла ошибка при удалении некоторых коробок",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении коробок:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении коробок",
      });
    } finally {
      setDeletingBoxesIds([]);
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
            render: (box: Box) => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedBoxes.includes(box.id)}
                  onChange={() => toggleBoxSelection(box.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            mobilePriority: 1,
          },
        ]
      : []),
    {
      key: "barcode",
      header: "Штрихкод",
      sortable: true,
      render: (box: Box) => (
        <div className="flex items-center space-x-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              downloadBarcode(box.barcode);
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-mono text-xs"
            title="Нажмите для скачивания штрихкода"
          >
            {box.barcode}
          </a>
          <button
            onClick={() => copyBarcodeToClipboard(box.barcode)}
            className="text-gray-400 hover:text-gray-600"
            title="Копировать штрихкод"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      mobilePriority: 1,
    },
    {
      key: "name",
      header: "Название",
      sortable: true,
      render: (box: Box) => (
        <Link
          href={`/box-content?barcode=${box.barcode}`}
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          title={box.name}
        >
          {box.name}
        </Link>
      ),
      mobilePriority: 1,
    },
    {
      key: "items_count",
      header: "Товаров",
      sortable: true,
      render: (box: Box) => (
        <div className="text-left font-medium">{box.items_count || 0}</div>
      ),
      mobilePriority: 2,
    },
    {
      key: "total_price",
      header: "Стоимость",
      sortable: true,
      render: (box: Box) => (
        <div className="text-left font-medium">
          {box.total_price
            ? `${Math.round(box.total_price).toLocaleString("ru-RU")} ₽`
            : "0 ₽"}
        </div>
      ),
      mobilePriority: 2,
    },
  ];

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
      <div className="py-8 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-2 text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-red-800 font-medium">Ошибка</h2>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[100rem] mx-auto animate-fadeIn pb-12">
      <header className="mb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-color-primary)]">
          Управление коробками
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-color-muted)]">
          Создавайте коробки для организации товаров, отслеживайте перемещения и содержимое.
        </p>
      </header>

      {/* Filters, Search and Sorting */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, штрихкоду..."
            className="px-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white h-[42px]"
          />
        </div>

        {/* Sorting */}
        <div className="flex gap-2 sm:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm h-[42px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="id">Сортировка: ID</option>
            <option value="name">Сортировка: Название</option>
            <option value="created_at">Сортировка: Создана</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm h-[42px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="asc">↑</option>
            <option value="desc">↓</option>
          </select>
        </div>
      </div>

      {/* Box List */}
      <Card className="mb-6">
        <CardHeader className="pb-3 border-b border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Список коробок</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              onClick={toggleSelectionMode}
              size="sm"
            >
              {selectionMode ? "Отменить" : "Выбрать коробки"}
            </Button>

            {selectionMode && (
              <Button
                variant="destructive"
                onClick={deleteSelectedBoxes}
                disabled={selectedBoxes.length === 0}
                size="sm"
              >
                {deletingBoxesIds.length > 0 ? (
                  <span className="flex items-center">
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
                    Удаление...
                  </span>
                ) : (
                  `Удалить (${selectedBoxes.length})`
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">

        {boxes.length === 0 ? (
          <p className="text-xs sm:text-sm text-[var(--text-color-muted)] italic py-4">
            Нет доступных коробок
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={boxes}
              emptyMessage="Нет доступных коробок"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)]/50 px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Вперед
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Показано от <span className="font-medium">{(page - 1) * limit + 1}</span> до{" "}
                      <span className="font-medium">
                        {Math.min(page * limit, totalCount)}
                      </span>{" "}
                      из <span className="font-medium">{totalCount}</span> коробок
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm dark:text-gray-300"
                      >
                        Назад
                      </button>
                      {getPageNumbers().map((p, idx) => {
                        if (typeof p === "string") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-none dark:text-gray-300"
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
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              isCurrent
                                ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm dark:text-gray-300"
                      >
                        Вперед
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>

      {/* Box Creation Form */}
      <Card>
        <CardHeader className="pb-3 border-b border-[var(--card-border)]">
          <CardTitle className="text-base font-semibold">Создать коробку</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateBox} className="max-w-md space-y-4">
            <div>
              <label
                htmlFor="boxName"
                className="block text-xs font-medium text-[var(--text-color-muted)] mb-1.5"
              >
                Название коробки:
              </label>
              <input
                type="text"
                id="boxName"
                value={boxName}
                onChange={(e) => setBoxName(e.target.value)}
                className="block w-full rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs py-2 px-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Введите название коробки"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={creating}
              size="sm"
            >
              {creating ? (
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
                  Создание...
                </>
              ) : (
                <>
                  <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                  Создать
                </>
              )}
            </Button>
          </form>

          {createResult && (
            <div
              className={`mt-4 p-3 rounded-md text-xs font-medium ${
                createResult.success
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {createResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
