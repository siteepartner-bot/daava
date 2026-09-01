import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  label?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps = 3,
  label,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span className="font-medium">
          {label || `مرحله ${currentStep} از ${totalSteps}`}
        </span>
        <span>{Math.round(percentage)}٪</span>
      </div>
      <div className="w-full h-2 bg-purple-100/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-400 to-[#7E57C2] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
