import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft-pink' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl font-medium gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-2xl font-medium gap-2',
    lg: 'px-6 py-3.5 text-base rounded-2xl font-semibold gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#7E57C2] hover:bg-[#6C47B2] text-white shadow-sm shadow-purple-200/50 hover:shadow-md hover:shadow-purple-300/40 focus:ring-4 focus:ring-purple-200',
    secondary:
      'bg-purple-50 hover:bg-purple-100/80 text-[#7E57C2] border border-purple-100 hover:border-purple-200 focus:ring-4 focus:ring-purple-100',
    'soft-pink':
      'bg-pink-50/80 hover:bg-pink-100 text-purple-900 border border-pink-100 hover:border-pink-200 focus:ring-4 focus:ring-pink-100',
    outline:
      'bg-transparent hover:bg-purple-50/50 text-[#2D2A32] border border-purple-200/80 hover:border-[#7E57C2] focus:ring-4 focus:ring-purple-100',
    ghost:
      'bg-transparent hover:bg-purple-50/60 text-[#64748B] hover:text-[#7E57C2] focus:ring-2 focus:ring-purple-100',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 focus:ring-4 focus:ring-emerald-100',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none outline-none ${
        fullWidth ? 'w-full' : ''
      } ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'right' && <span>{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'left' && <span>{icon}</span>}
    </motion.button>
  );
};
