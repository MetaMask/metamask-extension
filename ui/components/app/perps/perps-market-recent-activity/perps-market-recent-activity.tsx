import React, { useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  ButtonBase,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsMarketFills } from '../../../../hooks/perps';
import { transformFillsToTransactions } from '../utils/transactionTransforms';
import { TransactionCard } from '../transaction-card';
import { PERPS_CONSTANTS } from '../constants';
import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';
import { PERPS_ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import { Skeleton } from '../../../component-library/skeleton';
import type { PerpsTransaction } from '../types';

const SKELETON_ITEMS = [1, 2, 3];

const RecentActivitySkeleton: React.FC = () => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    className="overflow-hidden rounded-xl"
  >
    {SKELETON_ITEMS.map((i) => (
      <Skeleton key={i} className="h-[72px] w-full rounded-none" />
    ))}
  </Box>
);

const RecentActivityEmpty: React.FC = () => {
  const t = useI18nContext();
  return (
    <Box paddingBottom={4}>
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {t('perpsNoTransactions')}
      </Text>
    </Box>
  );
};

const RecentActivityList: React.FC<{
  transactions: PerpsTransaction[];
  onTransactionClick: () => void;
}> = ({ transactions, onTransactionClick }) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    className="overflow-hidden rounded-xl"
  >
    {transactions.map((transaction, index) => (
      <TransactionCard
        key={transaction.id}
        transaction={transaction}
        variant="muted"
        showTopBorder={index > 0}
        onClick={onTransactionClick}
        screenName={PERPS_EVENT_VALUE.SCREEN_NAME.MARKET_DETAIL}
      />
    ))}
  </Box>
);

export type PerpsMarketRecentActivityProps = {
  symbol: string;
};

export const PerpsMarketRecentActivity: React.FC<
  PerpsMarketRecentActivityProps
> = ({ symbol }) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const { fills, isInitialLoading } = usePerpsMarketFills({
    symbol,
    throttleMs: 0,
  });

  const transactions = useMemo(() => {
    return transformFillsToTransactions(fills).slice(
      0,
      PERPS_CONSTANTS.RECENT_ACTIVITY_LIMIT,
    );
  }, [fills]);

  const hasTransactions = transactions.length > 0;
  const showSkeleton = isInitialLoading && !hasTransactions;

  const handleSeeAll = () => navigate(PERPS_ACTIVITY_ROUTE);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {hasTransactions ? (
        <ButtonBase
          onClick={handleSeeAll}
          className="w-full flex flex-row justify-between items-center px-4 py-2 bg-transparent rounded-none hover:bg-hover active:bg-pressed"
          data-testid="perps-market-detail-view-all-activity"
          aria-label={`${t('perpsRecentActivity')}, ${t('perpsSeeAll')}`}
        >
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
            {t('perpsRecentActivity')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </ButtonBase>
      ) : (
        <Box paddingLeft={4} paddingRight={4} paddingTop={2} paddingBottom={2}>
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
            {t('perpsRecentActivity')}
          </Text>
        </Box>
      )}
      <Box paddingLeft={4} paddingRight={4}>
        {showSkeleton && <RecentActivitySkeleton />}
        {!showSkeleton && !hasTransactions && <RecentActivityEmpty />}
        {!showSkeleton && hasTransactions && (
          <RecentActivityList
            transactions={transactions}
            onTransactionClick={handleSeeAll}
          />
        )}
      </Box>
    </Box>
  );
};
