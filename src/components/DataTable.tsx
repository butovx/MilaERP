import React, { useState } from "react";

interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render: (item: T) => React.ReactNode;
  mobilePriority?: number; // Display priority on mobile devices (1 - highest)
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = "Нет данных",
  className = "",
  onRowClick,
}: DataTableProps<T>) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Sort columns by priority for mobile devices
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityA = a.mobilePriority || 999;
    const priorityB = b.mobilePriority || 999;
    return priorityA - priorityB;
  });

  // Primary columns (high priority)
  const primaryColumns = sortedColumns.filter(
    (col) => col.mobilePriority && col.mobilePriority <= 2
  );
  // Secondary columns (low priority)
  const secondaryColumns = sortedColumns.filter(
    (col) => !col.mobilePriority || col.mobilePriority > 2
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop version */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--card-border)]">
        <table className="min-w-full divide-y divide-[var(--card-border)] text-sm border-none mb-0">
          <thead className="bg-[var(--background)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-color-muted)] uppercase tracking-wider border-b border-[var(--card-border)]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--card-border)]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-[var(--text-color-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors duration-150 border-b border-[var(--card-border)] last:border-b-0 ${
                    onRowClick ? "cursor-pointer hover:bg-indigo-500/5" : "hover:bg-indigo-500/3"
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 whitespace-normal text-sm text-[var(--text-color-secondary)] align-middle"
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile version */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="text-center text-[var(--text-color-muted)] py-8 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                onClick={() => onRowClick?.(item)}
                className={`bg-[var(--card-bg)] rounded-lg shadow-sm p-4 border border-[var(--card-border)] transition-all duration-200 ${
                  onRowClick ? "cursor-pointer hover:border-indigo-500/20 active:scale-[0.99]" : ""
                }`}
              >
                {/* Primary information */}
                <div className="flex flex-row items-start gap-4">
                  {/* Photo */}
                  {primaryColumns.some((col) => col.key === "photo") && (
                    <div className="flex-shrink-0 w-20 sm:w-24">
                      {primaryColumns
                        .find((col) => col.key === "photo")
                        ?.render(item)}
                    </div>
                  )}

                  {/* Other primary data */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {primaryColumns
                      .filter((column) => column.key !== "photo")
                      .map((column) => (
                        <div key={column.key} className="flex flex-col">
                          <span className="text-[10px] font-semibold text-[var(--text-color-muted)] uppercase tracking-wider mb-0.5">
                            {column.header}
                          </span>
                          <span className="text-sm text-[var(--text-color-primary)] break-words font-medium">
                            {column.render(item)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Additional information */}
                {secondaryColumns.length > 0 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRow(expandedRow === index ? null : index);
                      }}
                      className="mt-3 text-xs text-indigo-500 dark:text-indigo-400 font-semibold flex items-center min-h-[32px] py-1 px-2 -mx-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-colors"
                    >
                      {expandedRow === index ? "Скрыть детали" : "Показать детали"}
                    </button>
                    {expandedRow === index && (
                      <div className="mt-3 pt-3 border-t border-[var(--card-border)] space-y-3 animate-fadeIn">
                        {secondaryColumns.map((column) => (
                          <div key={column.key} className="flex flex-col">
                            <span className="text-[10px] font-semibold text-[var(--text-color-muted)] uppercase tracking-wider mb-0.5">
                              {column.header}
                            </span>
                            <span className="text-sm text-[var(--text-color-secondary)]">
                              {column.render(item)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
