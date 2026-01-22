import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { ButtonFilter } from '../../components/component-library';
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { mockTransactions } from '../../components/app/perps/mocks';
import { TransactionCard } from '../../components/app/perps/transaction-card';
import {
  groupTransactionsByDate,
  filterTransactionsByType,
} from '../../components/app/perps/utils';
import type { PerpsTransactionFilter } from '../../components/app/perps/types';

// Filter tab configuration (matches mobile PerpsTransactionsView)
const FILTER_TABS: { key: PerpsTransactionFilter; labelKey: string }[] = [
  { key: 'trade', labelKey: 'perpsTrades' },
  { key: 'order', labelKey: 'perpsOrders' },
  { key: 'funding', labelKey: 'perpsFunding' },
  { key: 'deposit', labelKey: 'perpsDeposits' },
];

/**
 * PerpsActivityPage component
 * Displays the full transaction history with filter tabs
 * Accessible via /perps/activity route
 */
const PerpsActivityPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isPerpsEnabled = useSelector(getIsPerpsEnabled);
  const [activeFilter, setActiveFilter] =
    useState<PerpsTransactionFilter>('trade');

  // Filter and group transactions
  const filteredTransactions = useMemo(
    () => filterTransactionsByType(mockTransactions, activeFilter),
    [activeFilter],
  );

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  // Navigation handlers
  const handleBackClick = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  // Guard: redirect if perps feature is disabled
  if (!isPerpsEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <Box
      className="main-container asset__container"
      data-testid="perps-activity-page"
    >
      {/* Header */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
        gap={2}
      >
        {/* Back Button */}
        <Box
          data-testid="perps-activity-back-button"
          onClick={handleBackClick}
          aria-label={t('back')}
          className="p-2 -ml-2 cursor-pointer"
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>

        {/* Title */}
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Medium}>
          {t('perpsRecentActivity')}
        </Text>
      </Box>

      {/* Filter Tabs */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
        data-testid="perps-activity-filter-tabs"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          className="overflow-x-auto"
        >
          {FILTER_TABS.map((tab) => (
            <ButtonFilter
              key={tab.key}
              isActive={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
              data-testid={`perps-activity-filter-${tab.key}`}
            >
              {t(tab.labelKey)}
            </ButtonFilter>
          ))}
        </Box>
      </Box>

      {/* Transaction List */}
      <Box flexDirection={BoxFlexDirection.Column}>
        {groupedTransactions.length === 0 ? (
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingTop={8}
            paddingBottom={8}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsNoTransactions')}
            </Text>
          </Box>
        ) : (
          groupedTransactions.map((group) => (
            <Box
              key={group.date}
              flexDirection={BoxFlexDirection.Column}
              data-testid={`perps-activity-group-${group.date}`}
            >
              {/* Date Header */}
              <Box
                paddingLeft={4}
                paddingRight={4}
                paddingTop={3}
                paddingBottom={2}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                >
                  {group.date}
                </Text>
              </Box>

              {/* Transactions */}
              <Box flexDirection={BoxFlexDirection.Column}>
                {group.transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default PerpsActivityPage;
