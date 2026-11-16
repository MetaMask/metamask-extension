import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

/** Duration of the slide transition between texts in ms. */
export const SLIDE_DURATION_MS = 350;

/** Interval between text rotations in ms. */
export const ROTATE_INTERVAL_MS = 5000;

export type SlidingTextCarouselProps = {
  /** List of text strings to cycle through. */
  texts: string[];
  /** Called when a slide transition begins. */
  onSlideStart?: () => void;
  /** Called after each slide transition completes. */
  onSlideComplete?: () => void;
  /** Optional test id applied to the container. */
  testId?: string;
};

type CarouselInnerProps = Omit<SlidingTextCarouselProps, 'texts'> & {
  texts: string[];
};

/**
 * Shows one text item at a time, sliding each one out to the left and bringing
 * the next in from the right every ROTATE_INTERVAL_MS milliseconds.
 *
 * Uses a double-buffer approach: two slots (A and B) alternate roles between
 * "front" (visible, about to slide out) and "back" (off-screen right, about to
 * slide in). After each slide the departing slot teleports off-screen right
 * while still invisible and its text is refreshed — avoiding any flash. The
 * teleport is invisible because both off-screen positions sit outside the
 * `overflow: hidden` container.
 */
const CarouselInner = ({
  texts,
  onSlideStart,
  onSlideComplete,
  testId,
}: CarouselInnerProps) => {
  const [slotAText, setSlotAText] = useState(texts[0] ?? '');
  const [slotBText, setSlotBText] = useState(texts[1] ?? texts[0] ?? '');
  const [frontIsA, setFrontIsA] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const isSlidingRef = useRef(false);
  const upcomingIndexRef = useRef(2);

  const onSlideEnd = useCallback(
    (wasAFront: boolean, capturedIndex: number) => {
      const currentTexts = texts;
      setFrontIsA(!wasAFront);
      const nextText = currentTexts[capturedIndex % currentTexts.length];
      if (wasAFront) {
        setSlotAText(nextText);
      } else {
        setSlotBText(nextText);
      }
      upcomingIndexRef.current =
        (capturedIndex + 1) % Math.max(currentTexts.length, 1);
      onSlideComplete?.();
      isSlidingRef.current = false;
    },
    [texts, onSlideComplete],
  );

  const advanceSlide = useCallback(() => {
    if (texts.length <= 1 || isSlidingRef.current) {
      return;
    }
    isSlidingRef.current = true;
    onSlideStart?.();
    const wasAFront = frontIsA;
    const capturedIndex = upcomingIndexRef.current;
    setIsSliding(true);
    setTimeout(() => {
      setIsSliding(false);
      onSlideEnd(wasAFront, capturedIndex);
    }, SLIDE_DURATION_MS);
  }, [texts.length, frontIsA, onSlideStart, onSlideEnd]);

  useEffect(() => {
    if (texts.length <= 1) {
      return undefined;
    }
    const interval = setInterval(advanceSlide, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [texts.length, advanceSlide]);

  const getPosition = (isFront: boolean): string => {
    if (isFront) {
      return isSliding ? '-translate-x-full' : 'translate-x-0';
    }
    return 'translate-x-full';
  };

  const slotClassName = (isFront: boolean): string =>
    `market-insights-carousel__slot w-full ${
      isSliding ? 'market-insights-carousel__slot--transition' : ''
    } ${getPosition(isFront)}`;

  return (
    <Box className="market-insights-carousel" data-testid={testId}>
      <Text
        variant={TextVariant.BodySm}
        className="market-insights-carousel__sizer line-clamp-2"
        aria-hidden
      >
        {'Mg\nMg'}
      </Text>
      <Box className={slotClassName(frontIsA)}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          className="line-clamp-2"
        >
          {slotAText}
        </Text>
      </Box>
      <Box className={slotClassName(!frontIsA)}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          className="line-clamp-2"
        >
          {slotBText}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Shows one text item at a time, sliding each one out to the left and bringing
 * the next in from the right every ROTATE_INTERVAL_MS milliseconds. When there
 * is only one item, it renders statically without animation.
 *
 * The inner carousel is keyed on the text content so a change in texts remounts
 * it with fresh state instead of resetting through effects.
 */
export const SlidingTextCarousel = ({
  texts,
  onSlideStart,
  onSlideComplete,
  testId,
}: SlidingTextCarouselProps) => {
  const textsKey = texts.join('\0');

  if (texts.length <= 1) {
    return (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="line-clamp-2"
      >
        {texts[0] ?? ''}
      </Text>
    );
  }

  return (
    <CarouselInner
      key={textsKey}
      texts={texts}
      onSlideStart={onSlideStart}
      onSlideComplete={onSlideComplete}
      testId={testId}
    />
  );
};
