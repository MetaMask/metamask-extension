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
import { mockTransactions } from '../mocks';
import { PERPS_ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import type { PerpsTransaction } from '../types';

export type PerpsRecentActivityProps = {
  maxTransactions?: number;
  onTransactionClick?: (transaction: PerpsTransaction) => void;
};

/**
 * PerpsRecentActivity component displays the most recent transactions
 * in the Perps tab with a "See All" button to view full history
 *
 * @param options0 - Component props
 * @param options0.maxTransactions - Maximum number of transactions to show (default: 5)
 * @param options0.onTransactionClick - Optional click handler for transactions
 */
export const PerpsRecentActivity: React.FC<PerpsRecentActivityProps> = ({
  maxTransactions = 5,
  onTransactionClick,
}) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  // Sort by timestamp and take the most recent transactions
  const recentTransactions = [...mockTransactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxTransactions);

  const hasTransactions = recentTransactions.length > 0;

  const handleSeeAll = () => {
    navigate(PERPS_ACTIVITY_ROUTE);
  };

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
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsNoTransactions')}
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
        >
          <Text variant={TextVariant.BodySm} color={TextColor.PrimaryDefault}>
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
