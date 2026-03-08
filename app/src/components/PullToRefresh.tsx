// Pull-to-refresh: arrastrar hacia abajo en la parte superior para recargar datos

import { useCallback, useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  pullDistanceRef.current = pullDistance;
  isRefreshingRef.current = isRefreshing;

  const runRefresh = useCallback(async () => {
    if (disabled || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD);
    try {
      await onRefresh();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh, disabled]);

  useEffect(() => {
    const doc = document;

    const onTouchStart = (e: TouchEvent) => {
      if (disabled || isRefreshingRef.current) return;
      if (window.scrollY <= 5) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || disabled || isRefreshingRef.current) return;
      if (window.scrollY > 5) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }
      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStartY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta, MAX_PULL));
      }
    };

    const onTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      const current = pullDistanceRef.current;
      if (current >= PULL_THRESHOLD && !disabled) {
        runRefresh();
      } else {
        setPullDistance(0);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (disabled || isRefreshingRef.current) return;
      if (window.scrollY <= 5) {
        touchStartY.current = e.clientY;
        isPulling.current = true;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPulling.current || disabled || isRefreshingRef.current) return;
      if (window.scrollY > 5) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }
      const delta = e.clientY - touchStartY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta, MAX_PULL));
      }
    };

    const onMouseUp = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      const current = pullDistanceRef.current;
      if (current >= PULL_THRESHOLD && !disabled) {
        runRefresh();
      } else {
        setPullDistance(0);
      }
    };

    doc.addEventListener('touchstart', onTouchStart, { passive: true });
    doc.addEventListener('touchmove', onTouchMove, { passive: true });
    doc.addEventListener('touchend', onTouchEnd, { passive: true });
    doc.addEventListener('mousedown', onMouseDown);
    doc.addEventListener('mousemove', onMouseMove);
    doc.addEventListener('mouseup', onMouseUp);

    return () => {
      doc.removeEventListener('touchstart', onTouchStart);
      doc.removeEventListener('touchmove', onTouchMove);
      doc.removeEventListener('touchend', onTouchEnd);
      doc.removeEventListener('mousedown', onMouseDown);
      doc.removeEventListener('mousemove', onMouseMove);
      doc.removeEventListener('mouseup', onMouseUp);
    };
  }, [disabled, runRefresh]);

  const showIndicator = pullDistance > 0 || isRefreshing;
  const indicatorOpacity = showIndicator
    ? Math.min(1, (pullDistance || (isRefreshing ? PULL_THRESHOLD : 0)) / PULL_THRESHOLD)
    : 0;

  return (
    <>
      {showIndicator && (
        <div
          className="fixed left-0 right-0 z-30 flex items-center justify-center bg-gray-50 border-b border-gray-200 shadow-sm transition-all duration-150"
          style={{
            top: '4rem',
            height: '3.5rem',
            opacity: indicatorOpacity,
          }}
          aria-live="polite"
          aria-busy={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <div
                className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 mr-2"
                aria-hidden
              />
              <span className="text-sm text-gray-600">Actualizando...</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              {pullDistance >= PULL_THRESHOLD ? 'Suelta para actualizar' : 'Arrastra para actualizar'}
            </span>
          )}
        </div>
      )}
      {children}
    </>
  );
}
