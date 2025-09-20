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
      console.log("Swipe started:", { startX, startY, startTime });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      console.log("Swipe ended:", { 
        startX, startY, endX, endY, 
        deltaX, deltaY, deltaTime,
        absX: Math.abs(deltaX), absY: Math.abs(deltaY)
      });

      // Minimum swipe distance and maximum time for a valid swipe
      const minDistance = 100;
      const maxTime = 300;

      if (Math.abs(deltaX) < minDistance && Math.abs(deltaY) < minDistance) {
        console.log("Swipe rejected: insufficient distance");
        return;
      }
      if (deltaTime > maxTime) {
        console.log("Swipe rejected: too slow");
        return;
      }

      // Determine direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          console.log("Swipe detected: RIGHT");
          onSwipe("right");
        } else {
          console.log("Swipe detected: LEFT");
          onSwipe("left");
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          console.log("Swipe detected: DOWN");
          onSwipe("down");
        } else {
          console.log("Swipe detected: UP");
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
