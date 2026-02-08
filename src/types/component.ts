/**
 * Common component prop types
 */

import type { ReactNode } from 'react';

export interface BaseProps {
  children?: ReactNode;
  className?: string;
  id?: string;
}

export interface ContainerProps extends BaseProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TextProps extends BaseProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  weight?: 'light' | 'normal' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'error';
}

export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
}

export interface CardProps extends ContainerProps {
  bordered?: boolean;
  hover?: boolean;
}

export interface GridProps extends ContainerProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export interface LoadingProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export interface ErrorProps extends ContainerProps {
  error: Error | string;
  retry?: () => void;
}

export interface FormProps extends BaseProps {
  onSubmit: (data: unknown) => void | Promise<void>;
  loading?: boolean;
}

export interface InputProps extends BaseProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}
