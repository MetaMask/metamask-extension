import { useEffect, useCallback } from 'react';
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

  const checkSweepstakesActive = useCallback((currentDate: Date) => {
    return getSweepstakesCampaignActive(currentDate);
  }, []);

  useEffect(() => {
    const defaultSlides: CarouselSlide[] = [];

    const fundSlide = {
      ...FUND_SLIDE,
      undismissable: hasZeroBalance,
    };

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    defaultSlides.push(BRIDGE_SLIDE);
    ///: END:ONLY_INCLUDE_IF
    defaultSlides.push(CARD_SLIDE);
    defaultSlides.push(CASH_SLIDE);

    defaultSlides.splice(hasZeroBalance ? 0 : 2, 0, fundSlide);

    // If enabled, insert remote mode slide at the beginning
    if (isRemoteModeEnabled) {
      defaultSlides.unshift(REMOTE_MODE_SLIDE);
    }

    // If enabled, insert sweepstakes slide at the beginning
    const currentDate = testDate
      ? new Date(testDate)
      : new Date(new Date().toISOString());

    const isSweepstakesActive = checkSweepstakesActive(currentDate);

    // Due to this is a time condition,
    // which will affect the number of slides in the carousel on e2e testing,
    // hence, we set a `inTest` condition to by pass it for e2e test.
    if (!inTest && isSweepstakesActive) {
      defaultSlides.unshift({
        ...SWEEPSTAKES_SLIDE,
        dismissed: false,
      });
    }

    dispatch(updateSlides(defaultSlides));
  }, [
    checkSweepstakesActive,
    dispatch,
    hasZeroBalance,
    isRemoteModeEnabled,
    testDate,
  ]);

  return { slides };
};
