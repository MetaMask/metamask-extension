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
  displayToken: PayWithDisplayToken;
  balanceText: string;
  showBalance: boolean;
  showArrow: boolean;
  isMoneyAccountSelected?: boolean;
};

function PaySelectorContent({
  displayToken,
  balanceText,
  showBalance,
  showArrow,
  isMoneyAccountSelected = false,
}: PaySelectorContentProps) {
  return (
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
  const {
    displayToken,
    balanceUsdFormatted,
    label,
    canEdit,
    from,
    ownerId,
    isPerpsWithdraw,
    isMoneyAccountSelected,
    openModal,
    modal,
  } = usePayWithToken();

  if (!displayToken) {
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
          onClick={canEdit ? openModal : undefined}
          display={Display.InlineFlex}
          alignItems={AlignItems.center}
          gap={1}
          style={{ cursor: canEdit ? 'pointer' : 'default' }}
        >
          <PaySelectorContent
            displayToken={displayToken}
            balanceText={` (${balanceUsdFormatted})`}
            showBalance={!isPerpsWithdraw}
            showArrow={canEdit && Boolean(from)}
            isMoneyAccountSelected={isMoneyAccountSelected}
          />
        </Box>
      </ConfirmInfoAlertRow>
    </>
  );
}
