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
} from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { Content, Header, Page } from '../../components/multichain/pages/page';
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
import {
  Dropdown,
  type DropdownOption,
} from './market-list/components/dropdown';

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

  // Filter options for dropdown
  const filterOptions: DropdownOption<PerpsTransactionFilter>[] = useMemo(
    () => [
      { id: 'trade', label: t('perpsTrades') },
      { id: 'order', label: t('perpsOrders') },
      { id: 'funding', label: t('perpsFunding') },
      { id: 'deposit', label: t('perpsDeposits') },
    ],
    [t],
  );

  // Filter and group transactions
  const filteredTransactions = useMemo(
    () => filterTransactionsByType(mockTransactions, activeFilter),
    [activeFilter],
  );

  const groupedTransactions = useMemo(
    () =>
      groupTransactionsByDate(
        filteredTransactions,
        t as (key: string) => string,
      ),
    [filteredTransactions, t],
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
    <Page data-testid="perps-activity-page">
      <Header
        startAccessory={
          <ButtonIcon
            data-testid="perps-activity-back-button"
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            size={ButtonIconSize.Md}
            onClick={handleBackClick}
          />
        }
      >
        {t('perpsActivity')}
      </Header>
      <Content padding={0}>
        {/* Filter Dropdown */}
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Dropdown
            options={filterOptions}
            selectedId={activeFilter}
            onChange={setActiveFilter}
            testId="perps-activity-filter"
          />
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
      </Content>
    </Page>
  );
};

export default PerpsActivityPage;
