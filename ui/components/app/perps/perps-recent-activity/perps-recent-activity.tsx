import React from 'react';
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
import { TransactionCard } from '../transaction-card';
import { PERPS_RECENT_ACTIVITY_MAX_TRANSACTIONS } from '../../../../../shared/constants/perps';
import { PERPS_ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import { BorderRadius } from '../../../../helpers/constants/design-system';
import { Skeleton } from '../../../component-library/skeleton';
import { PerpsCardSkeleton } from '../perps-skeletons/perps-card-skeleton';
import type { PerpsTransaction } from '../types';

export type PerpsRecentActivityProps = {
  transactions?: PerpsTransaction[];
  maxTransactions?: number;
  onTransactionClick?: (transaction: PerpsTransaction) => void;
  /** When true and there are no transactions yet, show a loading skeleton. */
  isLoading?: boolean;
  error?: string | null;
};

/**
 * PerpsRecentActivity component displays the most recent transactions
 * in the Perps tab with a "See All" button to view full history
 *
 * @param options0 - Component props
 * @param options0.transactions - Array of transactions to display
 * @param options0.maxTransactions - Maximum number of transactions to show
 * @param options0.onTransactionClick - Optional click handler for transactions
 * @param options0.isLoading - Loading state for initial fetch (skeleton when no rows yet)
 * @param options0.error - Error message when fetch failed and there are no rows
 */
export const PerpsRecentActivity: React.FC<PerpsRecentActivityProps> = ({
  transactions = [],
  maxTransactions = PERPS_RECENT_ACTIVITY_MAX_TRANSACTIONS,
  onTransactionClick,
  isLoading = false,
  error = null,
}) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const recentTransactions: PerpsTransaction[] = [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxTransactions);

  const hasTransactions = recentTransactions.length > 0;
  const showLoadingSkeleton = isLoading && !hasTransactions;

  const handleSeeAll = () => {
    navigate(PERPS_ACTIVITY_ROUTE);
  };

  if (showLoadingSkeleton) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        data-testid="perps-recent-activity-loading"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          marginBottom={2}
        >
          <Skeleton className="h-5 w-36" borderRadius={BorderRadius.SM} />
          <Skeleton className="h-4 w-14" borderRadius={BorderRadius.SM} />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column}>
          {[1, 2, 3].map((cardIndex) => (
            <PerpsCardSkeleton key={cardIndex} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!hasTransactions) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        data-testid="perps-recent-activity-empty"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          marginBottom={2}
        >
          <Text fontWeight={FontWeight.Medium}>{t('perpsRecentActivity')}</Text>
        </Box>
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Text
            variant={TextVariant.BodySm}
            color={error ? TextColor.ErrorDefault : TextColor.TextAlternative}
          >
            {error || t('perpsNoTransactions')}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-recent-activity"
    >
      {/* Section Header */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        marginBottom={2}
      >
        <Text fontWeight={FontWeight.Medium}>{t('perpsRecentActivity')}</Text>
        <ButtonBase
          onClick={handleSeeAll}
          className="bg-transparent hover:bg-transparent active:bg-transparent p-0 min-w-0 h-auto"
          data-testid="perps-recent-activity-see-all"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsSeeAll')}
          </Text>
        </ButtonBase>
      </Box>

      {/* Transaction List */}
      <Box flexDirection={BoxFlexDirection.Column}>
        {recentTransactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onClick={onTransactionClick}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PerpsRecentActivity;
