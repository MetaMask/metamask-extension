import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconName,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { DEFAULT_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyActivityItems } from '../../hooks/money/use-money-activity-items';
import { useMoneyActivityItemClick } from '../../hooks/money/use-money-activity-item-click';
import { getPrivacyMode } from '../../selectors/selectors';
import { MoneyActivityRow } from './components/money-activity-row';
import { MoneyActivityRetryButton } from './components/money-activity-retry-button';
import { MoneyActivitySettlingSkeletons } from './components/money-activity-settling-skeletons';
import { MoneyActivityFilter } from './utils/money-activity-filters';
import { groupMoneyActivityItems } from './utils/group-money-activity';
import { resetOverflowAncestorScroll } from './utils/reset-overflow-ancestor-scroll';

const ACTIVITY_FILL_COUNT = 15;

const FILTERS: {
  id: MoneyActivityFilter;
  labelKey: string;
  testId: string;
}[] = [
  {
    id: MoneyActivityFilter.All,
    labelKey: 'moneyActivityFilterAll',
    testId: 'money-activity-filter-all',
  },
  {
    id: MoneyActivityFilter.Deposits,
    labelKey: 'moneyActivityFilterDeposits',
    testId: 'money-activity-filter-deposits',
  },
  {
    id: MoneyActivityFilter.Transfers,
    labelKey: 'moneyActivityFilterSends',
    testId: 'money-activity-filter-sends',
  },
];

export function MoneyActivityPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const privacyMode = useSelector(getPrivacyMode);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const [filter, setFilter] = useState(MoneyActivityFilter.All);
  const {
    buckets,
    hasMore,
    loadMore,
    isLoadingMore,
    isSettling,
    error,
    refetch,
  } = useMoneyActivityItems({
    fill: { bucket: filter, count: ACTIVITY_FILL_COUNT },
  });
  const handleItemClick = useMoneyActivityItemClick();
  const pageRef = useRef<HTMLDivElement>(null);
  const [sentinelRef, isSentinelIntersecting] = useIntersectionObserver({
    rootMargin: '400px 0px',
  });

  useLayoutEffect(() => {
    resetOverflowAncestorScroll(pageRef.current);
  }, []);

  useEffect(() => {
    if (isSentinelIntersecting && hasMore) {
      loadMore();
    }
  }, [isSentinelIntersecting, hasMore, loadMore]);

  const filteredItems = buckets[filter];
  const sections = useMemo(
    () => groupMoneyActivityItems(filteredItems, t('moneyActivityPending')),
    [filteredItems, t],
  );

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  const scrollSentinel = hasMore ? (
    <div ref={sentinelRef} data-testid="money-activity-scroll-sentinel" />
  ) : null;

  let body: React.ReactNode;
  if (isAvailabilityLoading) {
    body = (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-activity-loading"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
    );
  } else if (availability.isAvailable) {
    let listBody: React.ReactNode;
    if (isSettling) {
      listBody = (
        <MoneyActivitySettlingSkeletons className="flex flex-col gap-3 px-4 py-4">
          {scrollSentinel}
        </MoneyActivitySettlingSkeletons>
      );
    } else if (filteredItems.length === 0) {
      listBody = (
        <Box paddingLeft={4} paddingRight={4} paddingTop={8}>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-activity-empty"
          >
            {t(error ? 'moneyActivityLoadError' : 'moneyActivityEmpty')}
          </Text>
          {error ? (
            <MoneyActivityRetryButton
              className="mt-4"
              onClick={() => {
                refetch();
              }}
            />
          ) : null}
          {scrollSentinel}
        </Box>
      );
    } else {
      listBody = (
        <>
          {sections.map((section) => (
            <section key={section.isPending ? 'pending' : section.title}>
              <Box
                paddingLeft={4}
                paddingRight={4}
                paddingTop={2}
                paddingBottom={1}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                  data-testid={
                    section.isPending
                      ? 'money-activity-pending-header'
                      : 'money-activity-date-header'
                  }
                >
                  {section.title}
                </Text>
              </Box>
              {section.data.map((item) => (
                <MoneyActivityRow
                  key={item.id}
                  item={item}
                  privacyMode={privacyMode}
                  onItemClick={handleItemClick}
                />
              ))}
            </section>
          ))}
          {isLoadingMore ? (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
              data-testid="money-activity-loading-more"
            >
              <Skeleton className="h-12 w-full" />
            </Box>
          ) : null}
          {error ? (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
              data-testid="money-activity-load-error"
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('moneyActivityLoadError')}
              </Text>
              <MoneyActivityRetryButton
                className="mt-3"
                onClick={() => {
                  refetch();
                }}
              />
            </Box>
          ) : null}
          {scrollSentinel}
        </>
      );
    }

    body = (
      <main
        className="min-h-full bg-background-default pb-5"
        data-testid="money-activity-page"
      >
        <div className="flex items-center px-2 py-2">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            onClick={handleBack}
            data-testid="money-activity-back-button"
          />
        </div>

        <Box paddingLeft={4} paddingRight={4} paddingTop={2} paddingBottom={4}>
          <Text
            variant={TextVariant.HeadingLg}
            fontWeight={FontWeight.Bold}
            data-testid="money-activity-title"
          >
            {t('moneyActivity')}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={3}
          className="flex-wrap"
        >
          {FILTERS.map((chip) => {
            const isActive = chip.id === filter;
            return (
              <Button
                key={chip.id}
                variant={
                  isActive ? ButtonVariant.Primary : ButtonVariant.Secondary
                }
                size={ButtonSize.Md}
                aria-pressed={isActive}
                onClick={() => setFilter(chip.id)}
                data-testid={chip.testId}
              >
                {t(chip.labelKey)}
              </Button>
            );
          })}
        </Box>

        {listBody}
      </main>
    );
  } else {
    body = <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div ref={pageRef} className="contents">
      {body}
    </div>
  );
}

export default MoneyActivityPage;
