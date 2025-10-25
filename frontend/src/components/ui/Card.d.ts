import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padded?: boolean;
    header?: React.ReactNode;
    actions?: React.ReactNode;
}
declare const Card: React.FC<CardProps>;
export default Card;
