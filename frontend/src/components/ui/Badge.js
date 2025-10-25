import { jsx as _jsx } from "react/jsx-runtime";
import classNames from 'classnames';
const Badge = ({ tone = 'neutral', className, children, ...rest }) => (_jsx("span", { className: classNames('badge', `badge-${tone}`, className), ...rest, children: children }));
export default Badge;
