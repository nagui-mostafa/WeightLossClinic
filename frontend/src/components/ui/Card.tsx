import React from 'react';
import classNames from 'classnames';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  header?: React.ReactNode;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ padded = true, header, actions, className, children, ...rest }) => {
  return (
    <div className={classNames('card', className)} {...rest}>
      {(header || actions) && (
        <div className="card-header">
          <div>{header}</div>
          <div>{actions}</div>
        </div>
      )}
      <div className={classNames('card-body', { 'card-body-padded': padded })}>{children}</div>
    </div>
  );
};

export default Card;
