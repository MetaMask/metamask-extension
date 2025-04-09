import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeSlide, updateSlides } from '../../store/actions';
import { getSlides } from '../../selectors';
import type { CarouselSlide } from '../../../shared/constants/app-state';
import {
  FUND_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BRIDGE_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  CARD_SLIDE,
  CASH_SLIDE,
  SWEEPSTAKES_SLIDE,
  SWEEPSTAKES_START,
  SWEEPSTAKES_END,
} from './constants';

type UseSlideManagementProps = {
  hasZeroBalance: boolean;
  testDate?: string; // Only used in unit/e2e tests to simulate dates for sweepstakes campaign
};

export function getSweepstakesCampaignActive(currentDate: Date) {
  return currentDate >= SWEEPSTAKES_START && currentDate <= SWEEPSTAKES_END;
}

export const useCarouselManagement = ({
  hasZeroBalance,
  testDate,
}: UseSlideManagementProps) => {
  const inTest = Boolean(process.env.IN_TEST);
  const dispatch = useDispatch();
  const slides = useSelector(getSlides);

  const buildSlideArray = useCallback(
    (isSweepstakesActive: boolean) => {
      const defaultSlides: CarouselSlide[] = [];
      const fundSlide = {
        ...FUND_SLIDE,
        undismissable: hasZeroBalance,
      };

      if (isSweepstakesActive) {
        defaultSlides.push({
          ...SWEEPSTAKES_SLIDE,
          dismissed: false,
        });
      }

      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      defaultSlides.push(BRIDGE_SLIDE);
      ///: END:ONLY_INCLUDE_IF
      defaultSlides.push(CARD_SLIDE);
      defaultSlides.push(CASH_SLIDE);

      const fundPosition = isSweepstakesActive ? 1 : 0;
      defaultSlides.splice(fundPosition, 0, fundSlide);

      return defaultSlides;
    },
    [hasZeroBalance],
  );

  const checkSweepstakesActive = useCallback((currentDate: Date) => {
    // Due to this is a time condition,
    // which will affect the number of slides in the carousel on e2e testing,
    // hence, we set a `inTest` condition to by pass it for e2e test.
    const isActive = !inTest && getSweepstakesCampaignActive(currentDate);

    return isActive;
  }, []);

  useEffect(() => {
    const currentDate = testDate
      ? new Date(testDate)
      : new Date(new Date().toISOString());
    const isSweepstakesActive = checkSweepstakesActive(currentDate);

    if (!isSweepstakesActive) {
      const existingSweepstakes = slides.find(
        (s: CarouselSlide) => s.id === SWEEPSTAKES_SLIDE.id,
      );
      if (existingSweepstakes) {
        dispatch(removeSlide(SWEEPSTAKES_SLIDE.id));
      }
    }

    const newSlides = buildSlideArray(isSweepstakesActive);
    dispatch(updateSlides(newSlides));
  }, [hasZeroBalance, testDate, buildSlideArray, checkSweepstakesActive]);

  return { slides };
};
