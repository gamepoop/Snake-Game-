import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: () => void, delay: number | null) => {
  // Fix: Initialize useRef with `null` to provide an initial value, as the environment's type checker expects one. The ref's generic type is updated to `(() => void) | null` to accommodate this.
  const savedCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
