import { useState, useCallback } from "react";

/**
 * Custom hook to disable buttons after click to prevent double submissions
 * @param delay - Time in milliseconds before re-enabling the button (default: 2000ms)
 * @returns [isDisabled, handleClick] - isDisabled state and click handler
 */
export const useButtonDisable = (delay: number = 2000) => {
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClick = useCallback(
    async (callback: () => void | Promise<void>) => {
      if (isDisabled) return;

      setIsDisabled(true);
      try {
        await callback();
      } catch (error) {
        console.error("Error in button action:", error);
      } finally {
        setTimeout(() => {
          setIsDisabled(false);
        }, delay);
      }
    },
    [isDisabled, delay]
  );

  return [isDisabled, handleClick] as const;
};

