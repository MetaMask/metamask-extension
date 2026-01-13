import React, { useCallback } from 'react';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
  FontWeight,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { mockAccountState } from '../mocks';

interface PerpsMarketBalanceActionsProps {
  /** Whether to show the action buttons (Add funds, Withdraw) */
  showActionButtons?: boolean;
  /** Callback when Add funds button is pressed */
  onAddFunds?: () => void;
  /** Callback when Withdraw button is pressed */
  onWithdraw?: () => void;
  /** Callback when Learn more button is pressed */
  onLearnMore?: () => void;
}

/**
 * Formats a balance string to USD currency format
 */
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * PerpsMarketBalanceActions component
 * Displays the perps account balance and action buttons (Add funds, Withdraw)
 * Shows an empty state with CTA when balance is zero
 */
const PerpsMarketBalanceActions: React.FC<PerpsMarketBalanceActionsProps> = ({
  showActionButtons = true,
  onAddFunds,
  onWithdraw,
  onLearnMore,
}) => {
  const t = useI18nContext();

  // Use mock data for now
  const totalBalance = mockAccountState.totalBalance;
  const availableBalance = mockAccountState.availableBalance;
  const isBalanceEmpty = parseFloat(totalBalance) === 0;

  const handleAddFunds = useCallback(() => {
    onAddFunds?.();
  }, [onAddFunds]);

  const handleWithdraw = useCallback(() => {
    onWithdraw?.();
  }, [onWithdraw]);

  const handleLearnMore = useCallback(() => {
    onLearnMore?.();
  }, [onLearnMore]);

  // Empty state - no balance
  if (isBalanceEmpty) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        paddingTop={4}
        paddingBottom={4}
        data-testid="perps-balance-actions-empty"
      >
        {/* Empty state icon placeholder */}
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          marginBottom={4}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-background-alternative)',
          }}
        >
          <Text variant={TextVariant.headingLg}>📈</Text>
        </Box>

        <Text
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          marginBottom={2}
        >
          Trade perps
        </Text>

        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          Add funds to start trading perpetual contracts with leverage
        </Text>

        <Box style={{ width: '100%' }}>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleAddFunds}
            block
            marginBottom={3}
            data-testid="perps-balance-actions-add-funds-empty"
          >
            Add funds
          </Button>

          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={handleLearnMore}
            block
            data-testid="perps-balance-actions-learn-more"
          >
            Learn more
          </Button>
        </Box>
      </Box>
    );
  }

  // Balance state - has balance
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      data-testid="perps-balance-actions"
    >
      {/* Total Balance */}
      <Text
        variant={TextVariant.displayMd}
        fontWeight={FontWeight.Medium}
        data-testid="perps-balance-actions-total"
      >
        {formatBalance(totalBalance)}
      </Text>

      {/* Available Balance */}
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textAlternative}
        marginTop={1}
        data-testid="perps-balance-actions-available"
      >
        {formatBalance(availableBalance)} available
      </Text>

      {/* Action Buttons */}
      {showActionButtons && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          gap={3}
          marginTop={4}
        >
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={handleWithdraw}
            style={{ flex: 1 }}
            data-testid="perps-balance-actions-withdraw"
          >
            Withdraw
          </Button>

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleAddFunds}
            style={{ flex: 1 }}
            data-testid="perps-balance-actions-add-funds"
          >
            Add funds
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PerpsMarketBalanceActions;
