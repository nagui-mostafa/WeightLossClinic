import React from 'react';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}
declare const Badge: React.FC<BadgeProps>;
export default Badge;
