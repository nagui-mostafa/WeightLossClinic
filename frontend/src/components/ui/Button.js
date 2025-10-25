import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import classNames from 'classnames';
const Button = ({ variant = 'primary', fullWidth, loading, disabled, children, leftIcon, rightIcon, className, ...rest }) => {
    const classes = classNames('btn', `btn-${variant}`, { 'btn-full': fullWidth, loading }, className);
    return (_jsxs("button", { className: classes, disabled: disabled || loading, ...rest, children: [leftIcon ? _jsx("span", { className: "btn-icon", children: leftIcon }) : null, _jsx("span", { className: "btn-label", children: children }), rightIcon ? _jsx("span", { className: "btn-icon", children: rightIcon }) : null] }));
};
export default Button;
