/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { Skeleton } from '@metamask/design-system-react';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoAlertRow } from '../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAlerts from '../../../../../hooks/useAlerts';
import { AlertsName } from '../../../hooks/alerts/constants';
import {
  usePayWithToken,
  type PayWithDisplayToken,
} from '../../../hooks/pay/usePayWithToken';
import { TokenIcon } from '../../token-icon';

export { ConfirmInfoRowSize };

export const PayWithRowSkeleton = () => {
  return (
    <Box
      data-testid="pay-with-row-skeleton"
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.pill}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={2}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={2}
      paddingRight={4}
    >
      <Skeleton height="32px" width="32px" style={{ borderRadius: '50%' }} />
      <Skeleton height="18px" width="100px" />
      <Skeleton height="18px" width="100px" />
    </Box>
  );
};

type PaySelectorContentProps = {
  displayToken?: PayWithDisplayToken;
  emptyLabel?: string;
  balanceText: string;
  showBalance: boolean;
  showArrow: boolean;
  isMoneyAccountSelected?: boolean;
};

function PaySelectorContent({
  displayToken,
  emptyLabel,
  balanceText,
  showBalance,
  showArrow,
  isMoneyAccountSelected = false,
}: PaySelectorContentProps) {
  return (
    <>
      {displayToken ? (
        <>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            marginRight={1}
          >
            {isMoneyAccountSelected ? (
              <img
                src="./images/money.png"
                alt=""
                width={16}
                height={16}
                data-testid="pay-with-money-account-icon"
              />
            ) : (
              <TokenIcon
                chainId={displayToken.chainId as `0x${string}`}
                tokenAddress={displayToken.address as `0x${string}`}
                symbol={displayToken.symbol}
                size="xs"
              />
            )}
          </Box>
          <Text data-testid="pay-with-symbol">
            {displayToken.symbol}
            {showBalance && (
              <Text
                as="span"
                data-testid="pay-with-balance"
                color={TextColor.textAlternative}
              >
                {balanceText}
              </Text>
            )}
          </Text>
        </>
      ) : (
        <Text data-testid="pay-with-symbol" color={TextColor.textAlternative}>
          {emptyLabel}
        </Text>
      )}
      {showArrow && (
        <Icon
          data-testid="pay-with-arrow"
          name={IconName.ArrowDown}
          size={IconSize.Sm}
        />
      )}
    </>
  );
}

type PayWithRowProps = {
  variant?: ConfirmInfoRowSize;
};

export function PayWithRow({
  variant = ConfirmInfoRowSize.Small,
}: PayWithRowProps = {}) {
  const t = useI18nContext();
  const {
    displayToken,
    balanceUsdFormatted,
    label,
    from,
    ownerId,
    isPostQuoteWithdraw,
    isMoneyAccountSelected,
    openModal,
    modal,
  } = usePayWithToken();
  // Read the registered confirmation alert so empty-placeholder visibility
  // stays in sync with useConfirmationAlerts (do not re-run the wait timer).
  const { getFieldAlerts } = useAlerts(ownerId);
  const hasAccountNoFunds = getFieldAlerts(RowAlertKey.PayWith).some(
    (alert) => alert.key === AlertsName.AccountNoFunds,
  );

  // When the selected account has no funding tokens, show an empty
  // "Select payment method" placeholder instead of an endless skeleton.
  // Post-quote withdraws also avoid an endless skeleton — destination tokens
  // may still be importing/enriching; show an empty Receive selector instead.
  if (!displayToken && !hasAccountNoFunds && !isPostQuoteWithdraw) {
    return <PayWithRowSkeleton />;
  }

  return (
    <>
      {modal}
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.PayWith}
        ownerId={ownerId}
        data-testid="pay-with-row"
        label={label}
        rowVariant={variant}
      >
        <Box
          data-testid="pay-with-pill"
          onClick={openModal}
          display={Display.InlineFlex}
          alignItems={AlignItems.center}
          gap={1}
          style={{ cursor: 'pointer' }}
        >
          <PaySelectorContent
            displayToken={displayToken}
            emptyLabel={t('payWithEmptySelection')}
            balanceText={` (${balanceUsdFormatted})`}
            showBalance={Boolean(displayToken) && !isPostQuoteWithdraw}
            showArrow={Boolean(from)}
            isMoneyAccountSelected={isMoneyAccountSelected}
          />
        </Box>
      </ConfirmInfoAlertRow>
    </>
  );
}
