import { isEqual } from 'lodash';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import log from 'loglevel';
import { BigNumber } from 'bignumber.js';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import type { CarouselSlide } from '../../../shared/constants/app-state';
import {
  getUserProfileLineage as getUserProfileLineageAction,
  updateSlides,
} from '../../store/actions';
import {
  getRemoteFeatureFlags,
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getShowDownloadMobileAppSlide,
  getSlides,
  getUseExternalServices,
} from '../../selectors';
import {
  FUND_SLIDE,
  CARD_SLIDE,
  ZERO_BALANCE,
  BASIC_FUNCTIONALITY_SLIDE,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  SOLANA_SLIDE,
  ///: END:ONLY_INCLUDE_IF
  DOWNLOAD_MOBILE_APP_SLIDE,
} from './constants';
import { fetchCarouselSlidesFromContentful } from './fetchCarouselSlidesFromContentful';

type UseSlideManagementProps = {
  testDate?: string; // Only used in unit/e2e tests to simulate dates for sweepstakes campaign
};

export function isActive(
  slide: { startDate?: string; endDate?: string },
  now = new Date(),
): boolean {
  const start = slide.startDate ? new Date(slide.startDate) : null;
  const end = slide.endDate ? new Date(slide.endDate) : null;

  if (start && now < start) {
    return false;
  }
  if (end && now > end) {
    return false;
  }
  return true;
}

export const useCarouselManagement = ({
  testDate,
}: UseSlideManagementProps = {}) => {
  const inTest = Boolean(process.env.IN_TEST);
  const dispatch = useDispatch();
  const slides: CarouselSlide[] = useSelector(getSlides);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const totalBalance = useSelector(getSelectedAccountCachedBalance);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const useExternalServices = useSelector(getUseExternalServices);
  const showDownloadMobileAppSlide = useSelector(getShowDownloadMobileAppSlide);
  const prevSlidesRef = useRef<CarouselSlide[]>();
  const hasZeroBalance = new BigNumber(totalBalance ?? ZERO_BALANCE).eq(
    ZERO_BALANCE,
  );

  useEffect(() => {
    const defaultSlides: CarouselSlide[] = [];

    const fundSlide = {
      ...FUND_SLIDE,
      undismissable: hasZeroBalance,
    };
    defaultSlides.push(CARD_SLIDE);
    if (!useExternalServices) {
      defaultSlides.push(BASIC_FUNCTIONALITY_SLIDE);
    }
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    defaultSlides.push(SOLANA_SLIDE);
    ///: END:ONLY_INCLUDE_IF
    defaultSlides.splice(hasZeroBalance ? 0 : 2, 0, fundSlide);

    // Handle Contentful Data
    const maybeFetchContentful = async () => {
      const contentfulEnabled =
        remoteFeatureFlags?.contentfulCarouselEnabled ?? false;

      if (useExternalServices && showDownloadMobileAppSlide) {
        const userProfileLineage = await getUserProfileLineageAction();
        if (userProfileLineage) {
          const isUserAvailableOnMobile = userProfileLineage.lineage.some(
            (lineage) => lineage.agent === Platform.MOBILE,
          );

          if (!isUserAvailableOnMobile) {
            defaultSlides.unshift(DOWNLOAD_MOBILE_APP_SLIDE);
          }
        }
      }

      if (contentfulEnabled) {
        try {
          const { prioritySlides, regularSlides } =
            await fetchCarouselSlidesFromContentful();
          const normalizeContentfulSlides = (slidesToCheck: CarouselSlide[]) =>
            slidesToCheck
              .map((slide) => {
                const existing = slides.find(
                  (s: CarouselSlide) => s.id === slide.id,
                );
                return {
                  ...slide,
                  dismissed: existing?.dismissed ?? false,
                  undismissable:
                    slide.undismissable || existing?.undismissable || false,
                };
              })
              .filter((slide) =>
                isActive(slide, testDate ? new Date(testDate) : new Date()),
              );
          const activePrioritySlides =
            normalizeContentfulSlides(prioritySlides);
          const activeRegularSlides = normalizeContentfulSlides(regularSlides);

          const mergedSlides = [
            ...activePrioritySlides,
            ...defaultSlides,
            ...activeRegularSlides,
          ];

          if (!isEqual(prevSlidesRef.current, mergedSlides)) {
            dispatch(updateSlides(mergedSlides));
            prevSlidesRef.current = mergedSlides;
          }
        } catch (err) {
          log.warn('Failed to fetch Contentful slides:', err);
          if (!isEqual(prevSlidesRef.current, defaultSlides)) {
            dispatch(updateSlides(defaultSlides));
            prevSlidesRef.current = defaultSlides;
          }
        }
      } else if (!isEqual(prevSlidesRef.current, defaultSlides)) {
        dispatch(updateSlides(defaultSlides));
        prevSlidesRef.current = defaultSlides;
      }
    };

    (async () => {
      try {
        await maybeFetchContentful();
      } catch (err) {
        log.warn('Failed to load carousel slides:', err);
      }
    })();
  }, [
    dispatch,
    hasZeroBalance,
    remoteFeatureFlags,
    testDate,
    inTest,
    slides,
    selectedAccount.address,
    useExternalServices,
    showDownloadMobileAppSlide,
  ]);

  return { slides };
};
