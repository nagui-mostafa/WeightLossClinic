import React from 'react';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth,
  loading,
  disabled,
  children,
  leftIcon,
  rightIcon,
  className,
  ...rest
}) => {
  const { type = 'button', ...restProps } = rest;

  const classes = classNames(
    'btn',
    `btn-${variant}`,
    { 'btn-full': fullWidth, loading },
    className,
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...restProps}
    >
      {leftIcon ? <span className="btn-icon">{leftIcon}</span> : null}
      <span className="btn-label">{children}</span>
      {rightIcon ? <span className="btn-icon">{rightIcon}</span> : null}
    </button>
  );
};

export default Button;
