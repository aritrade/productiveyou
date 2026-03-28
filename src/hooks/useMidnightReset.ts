import { useEffect, useRef, useCallback } from "react";
import { getISTDateString, msUntilMidnightIST } from "@/lib/dailyEntries";

/**
 * Calls `onDateChange` whenever the IST date changes (at midnight IST).
 * Also fires on mount if the stored date differs from current IST date.
 */
export const useMidnightReset = (onDateChange: (newDate: string, oldDate: string) => void) => {
  const currentDateRef = useRef(getISTDateString());

  const check = useCallback(() => {
    const now = getISTDateString();
    if (now !== currentDateRef.current) {
      const old = currentDateRef.current;
      currentDateRef.current = now;
      onDateChange(now, old);
    }
  }, [onDateChange]);

  useEffect(() => {
    // Check immediately on mount
    check();

    // Set timer for next midnight IST
    const scheduleNextCheck = () => {
      const ms = msUntilMidnightIST();
      // Add 1 second buffer to ensure we're past midnight
      return setTimeout(() => {
        check();
        // Schedule next one
        timerRef.current = scheduleNextCheck();
      }, ms + 1000);
    };

    const timerRef = { current: scheduleNextCheck() };

    // Also check every minute as a fallback (handles sleep/wake)
    const interval = setInterval(check, 60_000);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(interval);
    };
  }, [check]);
};
