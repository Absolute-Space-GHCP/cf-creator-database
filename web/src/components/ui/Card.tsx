import { type HTMLAttributes } from 'react';
import './ui.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  hoverable?: boolean;
}

export default function Card({
  variant = 'light',
  hoverable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`card card-${variant} ${hoverable ? 'card-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
