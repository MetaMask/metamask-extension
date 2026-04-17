import React, { useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  ButtonBase,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsMarketFills } from '../../../../hooks/perps';
import { transformFillsToTransactions } from '../utils/transactionTransforms';
import { TransactionCard } from '../transaction-card';
import { PERPS_CONSTANTS } from '../constants';
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

const RecentActivityList: React.FC<{ transactions: PerpsTransaction[] }> = ({
  transactions,
}) => (
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

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingTop={4}
        paddingBottom={2}
      >
        <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
          {t('perpsRecentActivity')}
        </Text>
        {hasTransactions && (
          <ButtonBase
            onClick={() => navigate(PERPS_ACTIVITY_ROUTE)}
            className="bg-transparent hover:bg-transparent active:bg-transparent p-0 min-w-0 h-auto"
            data-testid="perps-market-detail-view-all-activity"
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsSeeAll')}
            </Text>
          </ButtonBase>
        )}
      </Box>
      {showSkeleton && <RecentActivitySkeleton />}
      {!showSkeleton && !hasTransactions && <RecentActivityEmpty />}
      {!showSkeleton && hasTransactions && (
        <RecentActivityList transactions={transactions} />
      )}
    </>
  );
};
