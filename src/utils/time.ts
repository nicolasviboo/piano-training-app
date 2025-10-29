// Timing utilities using performance.now() for high precision

/**
 * Get current timestamp in milliseconds
 * Uses performance.now() for better precision
 */
export function getCurrentTime(): number {
  return performance.now();
}

/**
 * Calculate elapsed time between two timestamps
 */
export function getElapsedTime(startTime: number, endTime: number): number {
  return endTime - startTime;
}

/**
 * Debounce function for optimizing rapid calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, waitMs);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRan: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = getCurrentTime();

    if (lastRan === null || now - lastRan >= limitMs) {
      func.apply(this, args);
      lastRan = now;
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(
        () => {
          func.apply(this, args);
          lastRan = getCurrentTime();
        },
        limitMs - (now - lastRan)
      );
    }
  };
}

