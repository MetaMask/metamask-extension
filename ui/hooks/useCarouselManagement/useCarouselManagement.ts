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
import { fetchCarouselSlidesFromContentful } from './fetchCarouselSlidesFromContentful';

type UseSlideManagementProps = { testDate?: string; enabled?: boolean };
const ZERO_BALANCE = '0x0';

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

// preserve dismissed/undismissable across re-fetches
const normalize = (
  raw: CarouselSlide | undefined,
  existing: CarouselSlide[],
) => {
  if (!raw) {
    return undefined;
  }
  const prev = existing.find((s) => s.id === raw.id);
  return {
    ...raw,
    dismissed: prev?.dismissed ?? false,
    undismissable: raw.undismissable || prev?.undismissable || false,
  } as CarouselSlide;
};

function orderByCardPlacement(slides: CarouselSlide[]): CarouselSlide[] {
  const placed: (CarouselSlide | undefined)[] = [];
  const unplaced: CarouselSlide[] = [];

  for (const s of slides) {
    const raw = s.cardPlacement;
    const n = typeof raw === 'string' ? Number(raw) : raw;
    if (typeof n === 'number' && Number.isFinite(n)) {
      const idx = Math.max(0, Math.floor(n) - 1);
      if (idx >= placed.length) {
        placed.length = idx + 1;
      }
      placed[idx] = s;
    } else {
      unplaced.push(s);
    }
  }

  let up = 0;
  for (let i = 0; i < placed.length && up < unplaced.length; i++) {
    if (!placed[i]) {
      placed[i] = unplaced[up];
      up += 1;
    }
  }

  while (up < unplaced.length) {
    placed.push(unplaced[up]);
    up += 1;
  }

  return placed.filter(Boolean) as CarouselSlide[];
}

export const useCarouselManagement = ({
  testDate,
  enabled = true,
}: UseSlideManagementProps = {}) => {
  const inTest = Boolean(process.env.IN_TEST);
  const dispatch = useDispatch();
  const slides = useSelector(getSlides);
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
    // If carousel is disabled, clear the slides
    if (!enabled) {
      const empty: CarouselSlide[] = [];
      if (!isEqual(prevSlidesRef.current, empty)) {
        dispatch(updateSlides(empty));
        prevSlidesRef.current = empty;
      }
      return;
    }
    const maybeFetchContentful = async () => {
      const contentfulEnabled =
        remoteFeatureFlags?.contentfulCarouselEnabled ?? false;

      // Early Return if Contentful is disabled
      if (!contentfulEnabled) {
        const empty: CarouselSlide[] = [];
        if (!isEqual(prevSlidesRef.current, empty)) {
          dispatch(updateSlides(empty));
          prevSlidesRef.current = empty;
        }
        return;
      }

      if (contentfulEnabled) {
        try {
          const { prioritySlides, regularSlides } =
            await fetchCarouselSlidesFromContentful();

          const pRaw = [...prioritySlides];
          const rRaw = [...regularSlides];

          const isNowActive = (s: CarouselSlide) =>
            isActive(s, testDate ? new Date(testDate) : new Date());

          const normalizeList = (list: CarouselSlide[]) =>
            list
              .map((s) => normalize(s, slides))
              .filter((s): s is CarouselSlide => Boolean(s))
              .filter(isNowActive);

          // Fund: force undismissable on zero balance
          const fundCheck = (s: CarouselSlide): CarouselSlide => {
            if (s.variableName === 'fund') {
              return {
                ...s,
                undismissable: hasZeroBalance || s.undismissable,
              };
            }
            return s;
          };

          const downloadEligible = await (async () => {
            if (!useExternalServices || !showDownloadMobileAppSlide) {
              return false;
            }
            const lineage = await getUserProfileLineageAction();
            const onMobile = Boolean(
              lineage?.lineage?.some((l) => l.agent === Platform.MOBILE),
            );
            return !onMobile;
          })();

          const isEligible = (s: CarouselSlide) => {
            // Show Download Mobile App (only if not already on mobile + flags)
            if (s.variableName === 'downloadMobileApp') {
              return downloadEligible;
            }
            return true;
          };

          const activePrioritySlides = normalizeList(pRaw)
            .map(fundCheck)
            .filter(isEligible);
          const activeRegularSlides = normalizeList(rRaw)
            .map(fundCheck)
            .filter(isEligible);

          // Order based on cardPlacement
          const orderedNonPriority = orderByCardPlacement(activeRegularSlides);
          const mergedSlides = [...activePrioritySlides, ...orderedNonPriority];

          if (!isEqual(prevSlidesRef.current, mergedSlides)) {
            dispatch(updateSlides(mergedSlides));
            prevSlidesRef.current = mergedSlides;
          }
        } catch (err) {
          log.warn('Failed to fetch Contentful slides:', err);
          if (!isEqual(prevSlidesRef.current, [])) {
            dispatch(updateSlides([]));
            prevSlidesRef.current = [];
          }
        }
      }
    };

    (async () => {
      try {
        // console.log('Effect to fetch carousel slides');
        // await maybeFetchContentful();
      } catch (err) {
        log.warn('Failed to load carousel slides:', err);
      }
    })();
  }, [
    enabled,
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
