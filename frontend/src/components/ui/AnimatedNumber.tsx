// src/components/ui/AnimatedNumber.tsx
'use client';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  suffix?: string;   // e.g. "%"
  prefix?: string;   // e.g. "$"
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  duration = 800,
  className = '',
}: AnimatedNumberProps) {
  const animated = useAnimatedNumber(value, duration);

  return (
    <span className={className}>
      {prefix}{animated}{suffix}
    </span>
  );
}