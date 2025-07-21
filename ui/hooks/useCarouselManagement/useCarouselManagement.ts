import { isEqual } from 'lodash';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import log from 'loglevel';
import { BigNumber } from 'bignumber.js';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { isSolanaAddress } from '../../../shared/lib/multichain/accounts';
import type { CarouselSlide } from '../../../shared/constants/app-state';
import {
  getUserProfileMetaMetrics as getUserProfileMetaMetricsAction,
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
import { getIsRemoteModeEnabled } from '../../selectors/remote-mode';
import {
  FUND_SLIDE,
  BRIDGE_SLIDE,
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

export function getSweepstakesCampaignActive(currentDate: Date) {
  return currentDate >= SWEEPSTAKES_START && currentDate <= SWEEPSTAKES_END;
}

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
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const useExternalServices = useSelector(getUseExternalServices);
  const showDownloadMobileAppSlide = useSelector(getShowDownloadMobileAppSlide);
  const prevSlidesRef = useRef<CarouselSlide[]>();
  const hasZeroBalance = new BigNumber(totalBalance ?? ZERO_BALANCE).eq(
    ZERO_BALANCE,
  );

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

    if (!isSolanaAddress(selectedAccount.address)) {
      defaultSlides.push(SMART_ACCOUNT_UPGRADE_SLIDE);
    }
    defaultSlides.push(BRIDGE_SLIDE);
    defaultSlides.push(CARD_SLIDE);
    defaultSlides.push(CASH_SLIDE);
    defaultSlides.push(MULTI_SRP_SLIDE);
    defaultSlides.push(BACKUPANDSYNC_SLIDE);
    if (!useExternalServices) {
      defaultSlides.push(BASIC_FUNCTIONALITY_SLIDE);
    }
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    defaultSlides.push(SOLANA_SLIDE);
    ///: END:ONLY_INCLUDE_IF
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
    // Handle Contentful Data
    const maybeFetchContentful = async () => {
      const contentfulEnabled =
        remoteFeatureFlags?.contentfulCarouselEnabled ?? false;

      if (useExternalServices && showDownloadMobileAppSlide) {
        const userProfileMetaMetrics = await getUserProfileMetaMetricsAction();
        if (userProfileMetaMetrics) {
          const isUserAvailableOnMobile = userProfileMetaMetrics.lineage.some(
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
    isRemoteModeEnabled,
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
