import React from 'react';
import classNames from 'classnames';

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  data: T[];
  emptyState?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

function DataTable<T>({ columns, data, emptyState, loading, className }: DataTableProps<T>) {
  return (
    <div className={classNames('table-container', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                style={{ width: column.width }}
                className={classNames({ [`align-${column.align}`]: column.align })}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyState ?? 'No data found.'}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((column) => (
                  <td key={String(column.key)} className={classNames({ [`align-${column.align}`]: column.align })}>
                    {column.render ? column.render(row) : (row as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
