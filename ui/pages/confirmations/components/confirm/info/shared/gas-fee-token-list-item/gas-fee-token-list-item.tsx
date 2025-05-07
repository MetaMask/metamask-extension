import React from 'react';
import { GasFeeToken } from '@metamask/transaction-controller';
import classnames from 'classnames';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  NATIVE_TOKEN_ADDRESS,
  useGasFeeToken,
} from '../../hooks/useGasFeeToken';
import { useInsufficientBalanceAlerts } from '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';
import { getCurrentCurrency } from '../../../../../../../ducks/metamask/metamask';
import { GasFeeTokenIcon, GasFeeTokenIconSize } from '../gas-fee-token-icon';

export type GasFeeTokenListItemProps = {
  tokenAddress: Hex;
  isSelected?: boolean;
  onClick?: (token: GasFeeToken) => void;
};

export function GasFeeTokenListItem({
  tokenAddress,
  isSelected,
  onClick,
}: GasFeeTokenListItemProps) {
  const t = useI18nContext();
  const gasFeeToken = useGasFeeToken({ tokenAddress });
  const currentCurrency = useSelector(getCurrentCurrency);

  const hasInsufficientNative =
    Boolean(useInsufficientBalanceAlerts().length) &&
    tokenAddress === NATIVE_TOKEN_ADDRESS;

  if (!gasFeeToken) {
    return null;
  }

  const { amountFiat, amountFormatted, balanceFiat, symbol } = gasFeeToken;

  return (
    <ListItem
      image={
        <GasFeeTokenIcon
          tokenAddress={tokenAddress}
          size={GasFeeTokenIconSize.Md}
        />
      }
      isSelected={isSelected}
      leftPrimary={symbol}
      leftSecondary={`${t(
        'confirmGasFeeTokenBalance',
      )} ${balanceFiat} ${currentCurrency.toUpperCase()}`}
      rightPrimary={amountFiat}
      rightSecondary={`${amountFormatted} ${symbol}`}
      warning={hasInsufficientNative && <InsufficientBalanceIndicator />}
      onClick={() => onClick?.(gasFeeToken)}
    />
  );
}

function ListItem({
  image,
  leftPrimary,
  leftSecondary,
  rightPrimary,
  rightSecondary,
  isSelected,
  warning,
  onClick,
}: {
  image: React.ReactNode;
  leftPrimary: string;
  leftSecondary: string;
  rightPrimary: string;
  rightSecondary: string;
  isSelected?: boolean;
  warning?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Box
      data-testid={`gas-fee-token-list-item-${leftPrimary}`}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      backgroundColor={isSelected ? BackgroundColor.primaryMuted : undefined}
      padding={2}
      className={classnames('gas-fee-token-list-item', {
        'gas-fee-token-list-item--selected': isSelected ?? false,
      })}
      onClick={() => onClick?.()}
    >
      {isSelected && <SelectedIndicator />}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        paddingLeft={2}
      >
        {image}
        <Box textAlign={TextAlign.Left} marginLeft={4}>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={2}
          >
            <Text
              data-testid="gas-fee-token-list-item-symbol"
              as="button"
              variant={TextVariant.bodyMdMedium}
              backgroundColor={BackgroundColor.transparent}
              padding={0}
            >
              {leftPrimary}
            </Text>
            {warning}
          </Box>
          <Text
            data-testid="gas-fee-token-list-item-balance"
            variant={TextVariant.bodySmMedium}
            color={TextColor.textAlternative}
          >
            {leftSecondary}
          </Text>
        </Box>
      </Box>
      <Box textAlign={TextAlign.Right} paddingRight={2}>
        <Text
          data-testid="gas-fee-token-list-item-amount-fiat"
          variant={TextVariant.bodyMdMedium}
        >
          {rightPrimary}
        </Text>
        <Text
          data-testid="gas-fee-token-list-item-amount-token"
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
        >
          {rightSecondary}
        </Text>
      </Box>
    </Box>
  );
}

function InsufficientBalanceIndicator() {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      borderColor={BorderColor.borderDefault}
      padding={1}
      gap={1}
    >
      <Icon
        name={IconName.Warning}
        size={IconSize.Xs}
        color={IconColor.iconMuted}
      />
      <Text variant={TextVariant.bodyXsMedium} color={TextColor.textMuted}>
        {t('confirmGasFeeTokenInsufficientBalance')}
      </Text>
    </Box>
  );
}

function SelectedIndicator() {
  return (
    <Box
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.primaryDefault}
      className="gas-fee-token-list-item__selected-indicator"
    />
  );
}
