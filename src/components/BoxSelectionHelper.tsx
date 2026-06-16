import { BoxItem } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";

type UseBoxSelectionProps = {
  items: BoxItem[];
  onSelectionChange: (selectedIds: number[]) => void;
};

/**
 * Hook for working with item selection in a box
 * Implements multiple product selection for removal from the box
 */
export default function useBoxSelection({
  items,
  onSelectionChange,
}: UseBoxSelectionProps) {
  // Use product_id instead of id for reliable product identification
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  // Use useRef to track the previous state
  const prevItemsRef = useRef<BoxItem[]>([]);
  const prevSelectedIdsRef = useRef<number[]>([]);
  // Store onSelectionChange in ref to avoid dependency issues
  const onSelectionChangeRef = useRef(onSelectionChange);

  // Update ref when callback function changes
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Reset selection when items list changes
  useEffect(() => {
    // Check if the items list changed
    const prevItems = prevItemsRef.current;
    const itemsChanged =
      items.length !== prevItems.length ||
      items.some(
        (item, index) =>
          !prevItems[index] || prevItems[index].product_id !== item.product_id
      );

    if (itemsChanged) {
      setSelectedIds([]);
      setAllSelected(false);
      prevItemsRef.current = [...items];
    }
  }, [items]);

  // Pass selected items up only on actual changes
  useEffect(() => {
    // Check if selected items changed
    const prevSelectedIds = prevSelectedIdsRef.current;
    const hasChanged =
      selectedIds.length !== prevSelectedIds.length ||
      selectedIds.some((id, index) => prevSelectedIds[index] !== id);

    if (hasChanged) {
      // Update ref before calling callback
      prevSelectedIdsRef.current = [...selectedIds];
      // Use current value from ref
      onSelectionChangeRef.current(selectedIds);

      // Update allSelected state
      setAllSelected(items.length > 0 && selectedIds.length === items.length);
    }
  }, [selectedIds, items.length]);

  // Select/deselect a single item
  const toggleItemSelection = useCallback((productId: number) => {
    setSelectedIds((prev) => {
      // If the item is already selected - deselect it
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        // Add item to selected (multiple selection)
        return [...prev, productId];
      }
    });
  }, []);

  // Select/deselect all items
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      // Deselect all items
      setSelectedIds([]);
    } else {
      // Select all items using product_id
      const allIds = items.map((item) => item.product_id);
      setSelectedIds(allIds);
    }
  }, [allSelected, items]);

  // Render checkboxes for selection
  const renderSelectionColumn = {
    key: "select",
    header: (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          aria-label="Выбрать все товары"
        />
      </div>
    ),
    render: (item: BoxItem) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={selectedIds.includes(item.product_id)}
          onChange={() => toggleItemSelection(item.product_id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          aria-label={`Выбрать товар ${item.name || "без имени"}`}
        />
      </div>
    ),
    mobilePriority: 1,
  };

  return { selectedIds, allSelected, renderSelectionColumn };
}
