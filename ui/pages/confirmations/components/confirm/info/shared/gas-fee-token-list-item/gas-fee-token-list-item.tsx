import React from 'react';
import { GasFeeToken } from '@metamask/transaction-controller';
import classnames from 'classnames';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
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
import { useGasFeeToken } from '../../hooks/useGasFeeToken';
import { getCurrentCurrency } from '../../../../../../../ducks/metamask/metamask';
import { GasFeeTokenIcon, GasFeeTokenIconSize } from '../gas-fee-token-icon';
import { formatAmount } from '../../../../simulation-details/formatAmount';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';

export type GasFeeTokenListItemProps = {
  isSelected?: boolean;
  onClick?: (token: GasFeeToken) => void;
  tokenAddress?: Hex;
  warning?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function GasFeeTokenListItem({
  isSelected,
  onClick,
  tokenAddress,
  warning,
}: GasFeeTokenListItemProps) {
  const t = useI18nContext();
  const gasFeeToken = useGasFeeToken({ tokenAddress });
  const currentCurrency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  if (!gasFeeToken) {
    return null;
  }

  const {
    amountFiat,
    amountFormatted,
    balanceFiat,
    symbol,
    balance,
    decimals,
  } = gasFeeToken;

  // Format balance as token amount when fiat is not available
  const balanceFormatted = formatAmount(
    locale,
    new BigNumber(balance ?? '0x0').shift(-decimals),
  );

  // Show fiat balance if available, otherwise show token balance
  const balanceText = balanceFiat
    ? `${t('confirmGasFeeTokenBalance')} ${balanceFiat} ${currentCurrency.toUpperCase()}`
    : `${t('confirmGasFeeTokenBalance')} ${balanceFormatted} ${symbol}`;

  return (
    <ListItem
      image={
        <GasFeeTokenIcon
          tokenAddress={tokenAddress ?? NATIVE_TOKEN_ADDRESS}
          size={GasFeeTokenIconSize.Md}
        />
      }
      isSelected={isSelected}
      leftPrimary={symbol}
      leftSecondary={balanceText}
      rightPrimary={amountFiat || ''}
      rightSecondary={`${amountFormatted} ${symbol}`}
      warning={warning && <WarningIndicator text={warning} />}
      onClick={() => onClick?.(gasFeeToken)}
    />
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function WarningIndicator({ text }: { text: string }) {
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
        {text}
      </Text>
    </Box>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function SelectedIndicator() {
  return (
    <Box
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.primaryDefault}
      className="gas-fee-token-list-item__selected-indicator"
    />
  );
}
