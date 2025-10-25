import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import classNames from 'classnames';
function DataTable({ columns, data, emptyState, loading, className }) {
    return (_jsx("div", { className: classNames('table-container', className), children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { style: { width: column.width }, className: classNames({ [`align-${column.align}`]: column.align }), children: column.header }, String(column.key)))) }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "table-empty", children: "Loading..." }) })) : data.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "table-empty", children: emptyState ?? 'No data found.' }) })) : (data.map((row, idx) => (_jsx("tr", { children: columns.map((column) => (_jsx("td", { className: classNames({ [`align-${column.align}`]: column.align }), children: column.render ? column.render(row) : row[column.key] }, String(column.key)))) }, idx)))) })] }) }));
}
export default DataTable;
