import React from 'react';
import classNames from 'classnames';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className, children, ...rest }) => (
  <span className={classNames('badge', `badge-${tone}`, className)} {...rest}>
    {children}
  </span>
);

export default Badge;
