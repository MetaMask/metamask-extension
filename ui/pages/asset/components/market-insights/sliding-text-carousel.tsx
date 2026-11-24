import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

/** Duration of the slide transition between texts in ms. */
export const SLIDE_DURATION_MS = 350;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

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
  const t = useI18nContext();
  const [isPaused, setIsPaused] = useState(false);
  const [slotAText, setSlotAText] = useState(texts[0] ?? '');
  const [slotBText, setSlotBText] = useState(texts[1] ?? texts[0] ?? '');
  const [frontIsA, setFrontIsA] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const nextIndex = useRef(2);
  const frontSlot = useRef(true);
  const slideTimeout = useRef<ReturnType<typeof setTimeout> | undefined>();
  const latest = useRef({ texts, onSlideStart, onSlideComplete });
  useLayoutEffect(() => {
    latest.current = { texts, onSlideStart, onSlideComplete };
  }, [texts, onSlideStart, onSlideComplete]);

  useEffect(() => () => clearTimeout(slideTimeout.current), []);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }
    const interval = setInterval(() => {
      latest.current.onSlideStart?.();
      setIsSliding(true);
      slideTimeout.current = setTimeout(() => {
        const { texts: currentTexts, onSlideComplete: complete } =
          latest.current;
        const text = currentTexts[nextIndex.current % currentTexts.length];
        const wasAFront = frontSlot.current;
        if (wasAFront) {
          setSlotAText(text);
        } else {
          setSlotBText(text);
        }
        nextIndex.current = (nextIndex.current + 1) % currentTexts.length;
        frontSlot.current = !wasAFront;
        setFrontIsA(!wasAFront);
        setIsSliding(false);
        complete?.();
      }, SLIDE_DURATION_MS);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPaused]);

  const getPosition = (isFront: boolean): string => {
    if (isFront) {
      return isSliding ? '-translate-x-full' : 'translate-x-0';
    }
    return isSliding ? 'translate-x-0' : 'translate-x-full';
  };

  const slotClassName = (isFront: boolean): string =>
    `absolute inset-x-0 top-0 w-full ${
      isSliding
        ? 'transition-transform duration-[350ms] ease-in-out motion-reduce:transition-none'
        : ''
    } ${getPosition(isFront)}`;

  return (
    <Box data-testid={testId}>
      <Box className="relative overflow-hidden">
        <Text
          variant={TextVariant.BodySm}
          className="invisible line-clamp-2 whitespace-pre-line"
          aria-hidden
        >
          {'Mg\nMg'}
        </Text>
        <Box className={slotClassName(frontIsA)} aria-hidden={!frontIsA}>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextDefault}
            className="line-clamp-2"
          >
            {slotAText}
          </Text>
        </Box>
        <Box className={slotClassName(!frontIsA)} aria-hidden={frontIsA}>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextDefault}
            className="line-clamp-2"
          >
            {slotBText}
          </Text>
        </Box>
      </Box>
      <button
        type="button"
        className="pointer-events-auto relative z-10 cursor-pointer text-xs text-alternative underline"
        onClick={() => setIsPaused((paused) => !paused)}
      >
        {t(
          isPaused
            ? 'marketInsightsCarouselResume'
            : 'marketInsightsCarouselPause',
        )}
      </button>
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
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false,
  );

  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!query) {
      return undefined;
    }
    const handleChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  if (texts.length <= 1 || reducedMotion) {
    return (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="line-clamp-2"
        data-testid={testId}
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
