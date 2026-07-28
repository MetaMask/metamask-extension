import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FontWeight, Text, TextVariant } from '@metamask/design-system-react';
import { ScreenViewedEntryPoint } from '../../../shared/constants/metametrics';
import { Page } from '../../components/multichain/pages/page';
import { ScrollContainer } from '../../contexts/scroll-container';
import { useI18nContext } from '../../hooks/useI18nContext';
import { ActivityList } from './activity-list';
import type { ActivityKindFilter } from './helpers';

const BUY_SELL_FILTER: ActivityKindFilter = 'buySell';

function readActivityFilter(state: unknown): ActivityKindFilter | undefined {
  if (
    state &&
    typeof state === 'object' &&
    'activityFilter' in state &&
    (state as { activityFilter?: unknown }).activityFilter === BUY_SELL_FILTER
  ) {
    return BUY_SELL_FILTER;
  }
  return undefined;
}

// Page shown when the Activity tab in the bottom navigation bar is clicked
// Bottom navigation bar is shown in the A/B test coreExtensionUxCeux1141AbtestBottomNav
export const ActivityPage = () => {
  const t = useI18nContext();
  const location = useLocation();
  const [entryPoint] = useState(() =>
    location.state?.entryPoint === ScreenViewedEntryPoint.BottomNavClick
      ? ScreenViewedEntryPoint.BottomNavClick
      : undefined,
  );
  const [kindFilter, setKindFilter] = useState<ActivityKindFilter | undefined>(
    () => readActivityFilter(location.state),
  );

  const filterChips = useMemo(
    () => [
      {
        id: 'all',
        label: t('activityFilterAll'),
        active: kindFilter === undefined,
        onClick: () => setKindFilter(undefined),
      },
      {
        id: BUY_SELL_FILTER,
        label: t('activityFilterBuySell'),
        active: kindFilter === BUY_SELL_FILTER,
        onClick: () => setKindFilter(BUY_SELL_FILTER),
      },
    ],
    [kindFilter, t],
  );

  return (
    <Page data-testid="activity-page">
      <Text
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Bold}
        className="pt-4 px-4 pb-2"
      >
        {t('activity')}
      </Text>
      <div className="flex gap-2 px-4 pb-2" data-testid="activity-kind-filters">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            data-testid={`activity-filter-${chip.id}`}
            aria-pressed={chip.active}
            onClick={chip.onClick}
            className={`rounded-full px-3 py-1 text-s-body-sm ${
              chip.active
                ? 'bg-background-alternative text-default'
                : 'text-alternative'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <ScrollContainer className="flex-1 overflow-auto">
        <ActivityList entryPoint={entryPoint} kindFilter={kindFilter} />
      </ScrollContainer>
    </Page>
  );
};

export default ActivityPage;
