import { isEqual } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSlides } from '../../store/actions';
import { getSelectedAccountCachedBalance, getSlides } from '../../selectors';
import type { CarouselSlide } from '../../../shared/constants/app-state';
import { getIsRemoteModeEnabled } from '../../selectors/remote-mode';
import {
  FUND_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  REMOTE_MODE_SLIDE,
  SMART_ACCOUNT_UPGRADE_SLIDE,
  SWEEPSTAKES_START,
  SWEEPSTAKES_END,
  ZERO_BALANCE,
  MULTI_SRP_SLIDE,
  BACKUPANDSYNC_SLIDE,
  SWEEPSTAKES_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
} from './constants';

type UseSlideManagementProps = {
  nowFn: () => number; // Only used in unit/e2e tests to simulate dates for sweepstakes campaign
};

export function getSweepstakesCampaignActive(currentDate: number = Date.now()) {
  return getCampaignActive(SWEEPSTAKES_START, SWEEPSTAKES_END, currentDate);
}

/**
 * Checks if a time‑bounded campaign is active.
 *
 * @param start - timestamp for the campaign's start (inclusive)
 * @param end - timestamp for the campaign's end (inclusive)
 * @param now - the current date in milliseconds since the epoch
 * @returns `true` if the sweepstakes campaign is active, `false` otherwise
 */
export function getCampaignActive(
  start: number,
  end: number,
  now = Date.now(),
): boolean {
  return now >= start && now <= end;
}

/**
 * Tracks whether a time‑bounded campaign is active, waking precisely at the
 * campaign start and end boundaries.
 *
 * @param start - timestamp for the campaign's start (inclusive)
 * @param end - timestamp for the campaign's end (inclusive)
 * @param nowFn - function to get the current date in milliseconds
 * @returns `true` while the campaign is active
 */
function useCampaignClock(
  start: number,
  end: number,
  nowFn: () => number,
): boolean {
  // current time, updated only by the timer, defaults to Date.now().
  const [now, setNow] = useState(() => nowFn());

  // compute how long until the next "boundary" (start or end)?
  const nextWake = useMemo(() => {
    if (now < start) {
      return start - now;
    } // wake when campaign starts
    if (now < end) {
      return end - now;
    } // wake when campaign ends
    return null; // campaign finished
  }, [start, end, now]);

  // maybe start a single timer, depending on the `nextWake` time
  useEffect(() => {
    if (nextWake === null) {
      return undefined; // campaign finished, nothing left to do
    }
    const id = setTimeout(() => setNow(nowFn()), nextWake);
    // return a cleanup function to clear the timer when the component unmounts
    return () => clearTimeout(id);
  }, [nextWake]);

  // return derived state
  return now >= start && now <= end;
}

export const useCarouselManagement = (
  { nowFn }: UseSlideManagementProps = {
    nowFn: Date.now,
  },
) => {
  const inTest = Boolean(process.env.IN_TEST);
  const dispatch = useDispatch();
  const slides = useSelector(getSlides);
  const totalBalance = useSelector(getSelectedAccountCachedBalance);
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  // create a campaign clock for the sweepstakes with *one* wake‑up per start/end
  // boundary
  const isSweepstakesActive = useCampaignClock(
    SWEEPSTAKES_START,
    SWEEPSTAKES_END,
    nowFn,
  );

  // important: *compute slides only when its inputs change*
  const defaultSlides = useMemo(() => {
    const hasZeroBalance = totalBalance === ZERO_BALANCE;
    const fundSlide = { ...FUND_SLIDE, undismissable: hasZeroBalance };

    const baseSlides: CarouselSlide[] = [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      SMART_ACCOUNT_UPGRADE_SLIDE,
      BRIDGE_SLIDE,
      ///: END:ONLY_INCLUDE_IF
      CARD_SLIDE,
      CASH_SLIDE,
      MULTI_SRP_SLIDE,
      BACKUPANDSYNC_SLIDE,
      ///: BEGIN:ONLY_INCLUDE_IF(solana)
      SOLANA_SLIDE,
      ///: END:ONLY_INCLUDE_IF
    ];

    baseSlides.splice(hasZeroBalance ? 0 : 2, 0, fundSlide);

    if (isRemoteModeEnabled) {
      baseSlides.unshift(REMOTE_MODE_SLIDE);
    }

    // Handle sweepstakes slide
    const existingSweepstakesSlide = slides.find(
      (s: CarouselSlide) => s.id === SWEEPSTAKES_SLIDE.id,
    );
    const isSweepstakesSlideDismissed =
      existingSweepstakesSlide?.dismissed ?? false;

    // Only show the sweepstakes slide if:
    // 1. Not in test mode
    // 2. Sweepstakes campaign is active
    // 3. Slide has not been dismissed by user
    if (!inTest && isSweepstakesActive && !isSweepstakesSlideDismissed) {
      const newSweepstakesSlide = {
        ...SWEEPSTAKES_SLIDE,
        dismissed: false,
      };
      baseSlides.unshift(newSweepstakesSlide);
    } else if (isSweepstakesSlideDismissed) {
      // Add the sweepstakes slide with the dismissed state preserved
      // We need this to maintain the persisted dismissed state
      const dismissedSweepstakesSlide = {
        ...SWEEPSTAKES_SLIDE,
        dismissed: true,
      };

      baseSlides.push(dismissedSweepstakesSlide);
    }

    return baseSlides;
  }, [totalBalance, isRemoteModeEnabled, isSweepstakesActive, slides, inTest]);

  const lastPayload = useRef<CarouselSlide[] | null>(null);
  useEffect(() => {
    // finally, and *most importantly*, dispatch only when the payload is
    // *actually* different from the last one. This is important to avoid
    // unnecessary calls to `updateSlides`, which will cause the carousel to
    // re-render
    if (!isEqual(lastPayload.current, defaultSlides)) {
      dispatch(updateSlides(defaultSlides));
      lastPayload.current = defaultSlides;
    }
  }, [dispatch, defaultSlides]);

  return { slides };
};
