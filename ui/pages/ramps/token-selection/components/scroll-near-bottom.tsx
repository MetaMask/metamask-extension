import React, { useEffect, useRef } from 'react';
import { useScrollContainer } from '../../../../contexts/scroll-container';

const DEFAULT_THRESHOLD_PX = 200;

type ScrollNearBottomProps = {
  /**
   * Called when the scroll container reaches the bottom of its content, either
   * by a scroll event landing within the threshold or when the content is
   * measured and found to be too short to scroll at all.
   */
  onNearBottom: () => void;
  /**
   * When false, no scroll handling is attached and no callbacks fire.
   */
  enabled?: boolean;
  /**
   * Current number of rendered list rows. Changing it re-runs the short-content
   * check so callers can keep loading until the list is scrollable.
   */
  observedLength?: number;
  /**
   * Distance from the bottom (px) that counts as "near the bottom".
   */
  thresholdPx?: number;
};

/**
 * Invisible helper rendered inside a `ScrollContainer`. Reports when the user
 * scrolls near the bottom of the container so callers can reveal more content
 * (infinite-scroll style) instead of rendering an expand button.
 *
 * @param props - Component props.
 * @param props.onNearBottom - Callback fired when near the bottom.
 * @param props.enabled - Whether to report at all.
 * @param props.observedLength - Rendered row count, re-checks short lists.
 * @param props.thresholdPx - Proximity threshold in pixels.
 */
export function ScrollNearBottom({
  onNearBottom,
  enabled = true,
  observedLength = 0,
  thresholdPx = DEFAULT_THRESHOLD_PX,
}: ScrollNearBottomProps) {
  const scrollContainerRef = useScrollContainer();
  const lastObservedLength = useRef(observedLength);
  const hasTriggeredForLength = useRef(false);

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current;
    if (!enabled || !scrollElement) {
      return undefined;
    }

    if (lastObservedLength.current !== observedLength) {
      lastObservedLength.current = observedLength;
      hasTriggeredForLength.current = false;
    }

    const readMetrics = () => {
      const { scrollTop, clientHeight, scrollHeight } = scrollElement;
      // jsdom renders no layout, where both metrics read 0 and would be
      // mistaken for "already at the bottom". Skip measurement entirely.
      if (scrollHeight === 0 && clientHeight === 0) {
        return null;
      }

      return { scrollTop, clientHeight, scrollHeight };
    };

    const triggerNearBottom = () => {
      if (hasTriggeredForLength.current) {
        return;
      }
      hasTriggeredForLength.current = true;
      onNearBottom();
    };

    // Scroll events use proximity: the user reached the end of the
    // scrollable content. Only one page is requested per observed list length,
    // even if several native scroll events fire before React commits the page.
    const handleScroll = () => {
      const metrics = readMetrics();
      if (
        metrics &&
        metrics.scrollHeight - (metrics.scrollTop + metrics.clientHeight) <=
          thresholdPx
      ) {
        triggerNearBottom();
      }
    };

    // Content too short to scroll never produces a scroll event, so check up
    // front (and whenever the content grows) until the list is scrollable.
    const metrics = readMetrics();
    if (metrics && metrics.scrollHeight <= metrics.clientHeight) {
      triggerNearBottom();
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, onNearBottom, observedLength, scrollContainerRef, thresholdPx]);

  return null;
}

export default ScrollNearBottom;
