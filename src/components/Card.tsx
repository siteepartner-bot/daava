import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'accent' | 'highlight';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = false,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-purple-100/70 soft-shadow',
    subtle: 'bg-[#F6F3FA] border border-purple-50',
    accent: 'bg-gradient-to-br from-purple-50/80 to-pink-50/50 border border-purple-100/80 soft-shadow',
    highlight: 'bg-purple-900 text-white border border-purple-800 soft-shadow-lg',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`rounded-3xl p-5 md:p-6 transition-all duration-300 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
