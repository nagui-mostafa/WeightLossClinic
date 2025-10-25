import React from 'react';
import classNames from 'classnames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, hint, icon, trailing, className, ...rest }) => {
  return (
    <label className={classNames('form-control', className)}>
      {label ? <span className="form-label">{label}</span> : null}
      <div
        className={classNames('input-wrapper', {
          'has-icon': !!icon,
          'has-trailing': !!trailing,
          error: !!error,
        })}
      >
        {icon ? <span className="input-icon">{icon}</span> : null}
        <input className="input-field" {...rest} />
        {trailing ? <span className="input-trailing">{trailing}</span> : null}
      </div>
      {error ? <span className="form-error">{error}</span> : hint ? <span className="form-hint">{hint}</span> : null}
    </label>
  );
};

export default Input;
