import { useEffect } from 'react';
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
  SWEEPSTAKES_SLIDE,
  SWEEPSTAKES_START,
  SWEEPSTAKES_END,
  ZERO_BALANCE,
  MULTI_SRP_SLIDE,
} from './constants';

type UseSlideManagementProps = {
  testDate?: string; // Only used in unit/e2e tests to simulate dates for sweepstakes campaign
};

export function getSweepstakesCampaignActive(currentDate: Date) {
  return currentDate >= SWEEPSTAKES_START && currentDate <= SWEEPSTAKES_END;
}

export const useCarouselManagement = ({
  testDate,
}: UseSlideManagementProps = {}) => {
  const inTest = Boolean(process.env.IN_TEST);
  const dispatch = useDispatch();
  const slides = useSelector(getSlides);
  const totalBalance = useSelector(getSelectedAccountCachedBalance);
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  const hasZeroBalance = totalBalance === ZERO_BALANCE;

  useEffect(() => {
    const defaultSlides: CarouselSlide[] = [];
    const existingSweepstakesSlide = slides.find(
      (slide: CarouselSlide) => slide.id === SWEEPSTAKES_SLIDE.id,
    );
    const isSweepstakesSlideDismissed =
      existingSweepstakesSlide?.dismissed ?? false;

    const fundSlide = {
      ...FUND_SLIDE,
      undismissable: hasZeroBalance,
    };

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    defaultSlides.push(BRIDGE_SLIDE);
    ///: END:ONLY_INCLUDE_IF
    defaultSlides.push(CARD_SLIDE);
    defaultSlides.push(CASH_SLIDE);
    defaultSlides.push(MULTI_SRP_SLIDE);

    defaultSlides.splice(hasZeroBalance ? 0 : 2, 0, fundSlide);

    if (isRemoteModeEnabled) {
      defaultSlides.unshift(REMOTE_MODE_SLIDE);
    }

    // Handle sweepstakes slide
    const currentDate = testDate
      ? new Date(testDate)
      : new Date(new Date().toISOString());
    const isSweepstakesActive = getSweepstakesCampaignActive(currentDate);

    // Only show the sweepstakes slide if:
    // 1. Not in test mode
    // 2. Sweepstakes campaign is active
    // 3. Slide has not been dismissed by user
    if (!inTest && isSweepstakesActive && !isSweepstakesSlideDismissed) {
      const newSweepstakesSlide = {
        ...SWEEPSTAKES_SLIDE,
        dismissed: false,
      };
      defaultSlides.unshift(newSweepstakesSlide);
    } else if (existingSweepstakesSlide?.dismissed) {
      // Add the sweepstakes slide with the dismissed state preserved
      // We need this to maintain the persisted dismissed state
      const dismissedSweepstakesSlide = {
        ...SWEEPSTAKES_SLIDE,
        dismissed: true,
      };

      defaultSlides.push(dismissedSweepstakesSlide);
    }

    dispatch(updateSlides(defaultSlides));
  }, [dispatch, hasZeroBalance, isRemoteModeEnabled, slides, testDate, inTest]);

  return { slides };
};
