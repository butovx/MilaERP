import React from "react";

interface DataTableProps {
  columns: { header: string; accessor: string; render?: (row: any) => React.ReactNode }[];
  data: any[];
}

export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-muted border-b">
            {columns.map((col, idx) => (
              <th key={idx} className="p-3 font-semibold">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="border-b hover:bg-muted/50">
              {columns.map((col, cIdx) => (
                <td key={cIdx} className="p-3">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
