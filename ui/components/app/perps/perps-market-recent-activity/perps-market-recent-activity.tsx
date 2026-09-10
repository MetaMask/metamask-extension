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
  Skeleton,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsMarketFills } from '../../../../hooks/perps';
import { transformFillsToTransactions } from '../utils/transactionTransforms';
import { getPerpsTransactionDestination } from '../utils/getPerpsTransactionDestination';
import { TransactionCard } from '../transaction-card';
import { PERPS_CONSTANTS } from '../constants';
import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';
import { PERPS_ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import type { PerpsTransaction } from '../types';

const SKELETON_ITEMS = [1, 2, 3];

const RecentActivitySkeleton = () => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    className="overflow-hidden rounded-xl"
  >
    {SKELETON_ITEMS.map((i) => (
      <Skeleton
        key={i}
        className="h-[72px] w-full rounded-none"
        data-testid="perps-recent-activity-skeleton"
      />
    ))}
  </Box>
);

const RecentActivityEmpty = () => {
  const t = useI18nContext();
  return (
    <Box paddingBottom={4}>
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {t('perpsNoTransactions')}
      </Text>
    </Box>
  );
};

const RecentActivityList = ({
  transactions,
  onTransactionClick,
}: {
  transactions: PerpsTransaction[];
  onTransactionClick: (transaction: PerpsTransaction) => void;
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
        onClick={onTransactionClick}
        screenName={PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_MARKET_DETAILS}
      />
    ))}
  </Box>
);

export type PerpsMarketRecentActivityProps = {
  symbol: string;
};

export const PerpsMarketRecentActivity = ({
  symbol,
}: PerpsMarketRecentActivityProps) => {
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

  // Navigate to the transaction's details view instead of falling back to
  // the general activity list (see `getPerpsTransactionDestination`).
  const handleTransactionClick = (transaction: PerpsTransaction) => {
    const destination = getPerpsTransactionDestination(transaction);
    if (destination) {
      navigate(destination.pathname, { state: destination.state });
      return;
    }
    handleSeeAll();
  };

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {hasTransactions ? (
        <ButtonBase
          onClick={handleSeeAll}
          className="w-auto self-start h-auto justify-start gap-1 bg-transparent px-4 pt-4 rounded-none hover:bg-transparent active:bg-transparent"
          data-testid="perps-market-detail-view-all-activity"
          aria-label={`${t('perpsRecentActivity')}, ${t('perpsSeeAll')}`}
        >
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
            {t('perpsRecentActivity')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </ButtonBase>
      ) : (
        <Box paddingLeft={4} paddingRight={4} paddingTop={4} paddingBottom={2}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
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
            onTransactionClick={handleTransactionClick}
          />
        )}
      </Box>
    </Box>
  );
};
