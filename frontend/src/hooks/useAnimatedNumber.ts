// src/hooks/useAnimatedNumber.ts
import { useEffect, useState, useRef } from 'react';

export function useAnimatedNumber(
  target: number,
  duration: number = 800
) {
  const [current, setCurrent] = useState(target);
  const prevTarget = useRef(target);

  useEffect(() => {
    // Don't animate on first render
    if (prevTarget.current === target) return;

    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        prevTarget.current = target;
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return current;
}