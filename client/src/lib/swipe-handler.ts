import { useEffect } from "react";

type SwipeDirection = "left" | "right" | "up" | "down";

export function useSwipeHandler(onSwipe: (direction: SwipeDirection) => void) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Minimum swipe distance and maximum time for a valid swipe
      const minDistance = 100;
      const maxTime = 300;

      if (Math.abs(deltaX) < minDistance && Math.abs(deltaY) < minDistance) return;
      if (deltaTime > maxTime) return;

      // Determine direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipe("right");
        } else {
          onSwipe("left");
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipe("down");
        } else {
          onSwipe("up");
        }
      }

      // Reset
      startX = 0;
      startY = 0;
      startTime = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipe]);
}
