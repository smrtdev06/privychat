import { useEffect } from "react";

type SwipeDirection = "left" | "right" | "up" | "down";

export function useSwipeHandler(onSwipe: (direction: SwipeDirection) => void) {
  useEffect(() => {
    let startX = NaN;
    let startY = NaN;
    let startTime = 0;
    let isPointerDown = false;

    // Handle touch events
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isNaN(startX) || isNaN(startY)) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      
      handleSwipeEnd(endX, endY, endTime);
    };

    // Handle mouse events (for testing and desktop)
    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      isPointerDown = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isPointerDown || isNaN(startX) || isNaN(startY)) return;
      
      const endX = e.clientX;
      const endY = e.clientY;
      const endTime = Date.now();
      
      isPointerDown = false;
      handleSwipeEnd(endX, endY, endTime);
    };

    const handleSwipeEnd = (endX: number, endY: number, endTime: number) => {

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Minimum swipe distance and maximum time for a valid swipe
      const minDistance = 70;
      const maxTime = 600;

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
      startX = NaN;
      startY = NaN;
      startTime = 0;
    };

    // Add event listeners for both touch and mouse events
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onSwipe]);
}
