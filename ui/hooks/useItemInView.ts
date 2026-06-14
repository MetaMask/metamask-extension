import { useCallback, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

const defaultRootMargin = '300px 0px';

/**
 * Returns an `itemRef` callback for a virtualized list that invokes
 * `onVisible` when the item at `targetIndex` scrolls into view.
 *
 * @param options
 * @param options.targetIndex - Index of the item to observe.
 * @param options.onVisible - Called when the target item enters view.
 * @param options.root - Scroll container to observe within. Defaults to the viewport.
 * @param options.rootMargin - Margin around `root` used to expand the intersection area.
 */
export function useItemInView({
  targetIndex,
  onVisible,
  root = null,
  rootMargin = defaultRootMargin,
}: {
  targetIndex: number;
  onVisible: () => void;
  root?: Element | null;
  rootMargin?: string;
}) {
  const { ref: targetRef } = useIntersectionObserver({
    root,
    rootMargin,
    onChange: (isIntersecting) => {
      if (isIntersecting) {
        onVisible();
      }
    },
  });

  const observedNodeRef = useRef<HTMLDivElement | null>(null);

  return useCallback(
    (node: HTMLDivElement | null, { index }: { index: number }) => {
      if (index === targetIndex) {
        observedNodeRef.current = node;
        targetRef(node);
      } else if (node && observedNodeRef.current === node) {
        observedNodeRef.current = null;
        targetRef(null);
      }
    },
    [targetIndex, targetRef],
  );
}
