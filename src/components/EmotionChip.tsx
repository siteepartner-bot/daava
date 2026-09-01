import React from 'react';
import { motion } from 'motion/react';

interface EmotionChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  className?: string;
}

export const EmotionChip: React.FC<EmotionChipProps> = ({
  label,
  selected,
  onClick,
  emoji,
  className = '',
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
        selected
          ? 'bg-[#7E57C2] text-white border-[#7E57C2] shadow-sm shadow-purple-200'
          : 'bg-white text-[#2D2A32] border-purple-100 hover:border-purple-300 hover:bg-purple-50/40 text-slate-700'
      } ${className}`}
    >
      {emoji && <span className="text-sm">{emoji}</span>}
      <span>{label}</span>
    </motion.button>
  );
};
