import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import classNames from 'classnames';
const Card = ({ padded = true, header, actions, className, children, ...rest }) => {
    return (_jsxs("div", { className: classNames('card', className), ...rest, children: [(header || actions) && (_jsxs("div", { className: "card-header", children: [_jsx("div", { children: header }), _jsx("div", { children: actions })] })), _jsx("div", { className: classNames('card-body', { 'card-body-padded': padded }), children: children })] }));
};
export default Card;
