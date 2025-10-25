import React from 'react';
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
declare function DataTable<T>({ columns, data, emptyState, loading, className }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
export default DataTable;
