import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import classNames from 'classnames';
const Input = ({ label, error, hint, icon, className, ...rest }) => {
    return (_jsxs("label", { className: classNames('form-control', className), children: [label ? _jsx("span", { className: "form-label", children: label }) : null, _jsxs("div", { className: classNames('input-wrapper', { 'has-icon': !!icon, error: !!error }), children: [icon ? _jsx("span", { className: "input-icon", children: icon }) : null, _jsx("input", { className: "input-field", ...rest })] }), error ? _jsx("span", { className: "form-error", children: error }) : hint ? _jsx("span", { className: "form-hint", children: hint }) : null] }));
};
export default Input;
