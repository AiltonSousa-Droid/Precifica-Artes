import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBRL } from '../../utils/calculations';

interface AnimatedPriceProps {
  value: number;
  decimals?: number;
  className?: string;
  showSparkle?: boolean;
}

export const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
  value,
  decimals = 0,
  className = '',
  showSparkle = false,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setHasChanged(true);
      const start = prevValueRef.current;
      const end = value;
      const duration = 300; // ms
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const currentVal = start + (end - start) * easeProgress;

        setDisplayValue(currentVal);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(end);
          prevValueRef.current = end;
          const timer = setTimeout(() => setHasChanged(false), 350);
          return () => clearTimeout(timer);
        }
      };

      const animId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animId);
    }
  }, [value]);

  return (
    <motion.span
      className={`inline-block transition-colors duration-300 ${className} ${
        hasChanged ? 'text-indigo-200' : ''
      }`}
      animate={
        hasChanged
          ? {
              scale: [1, 1.04, 1],
              transition: { duration: 0.3, ease: 'easeInOut' },
            }
          : { scale: 1 }
      }
    >
      {formatBRL(displayValue, decimals)}
    </motion.span>
  );
};
