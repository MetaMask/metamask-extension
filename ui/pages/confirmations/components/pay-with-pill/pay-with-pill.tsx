import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
} from '@metamask/design-system-react';
import { usePayWithToken } from '../../hooks/pay/usePayWithToken';
import { TokenIcon } from '../token-icon';

export const PayWithPillSkeleton = () => {
  return (
    <Box
      data-testid="pay-with-pill-skeleton"
      backgroundColor={BoxBackgroundColor.BackgroundSubsection}
      alignItems={BoxAlignItems.Center}
      gap={1}
      paddingVertical={2}
      paddingHorizontal={3}
      className="inline-flex w-fit rounded-[36px]"
    >
      <Skeleton height={32} width={32} className="rounded-full" />
      <Skeleton height={18} width={120} />
    </Box>
  );
};

export function PayWithPill() {
  const {
    displayToken,
    balanceUsdFormatted,
    label,
    canEdit,
    from,
    isPerpsWithdraw,
    openModal,
    modal,
  } = usePayWithToken();

  if (!displayToken) {
    return isPerpsWithdraw ? <PayWithPillSkeleton /> : null;
  }

  const showBalance = !isPerpsWithdraw;
  const showArrow = canEdit && Boolean(from);

  return (
    <>
      {modal}
      <Box
        data-testid="pay-with-pill"
        onClick={canEdit ? openModal : undefined}
        backgroundColor={BoxBackgroundColor.BackgroundSubsection}
        alignItems={BoxAlignItems.Center}
        gap={1}
        paddingVertical={2}
        paddingHorizontal={3}
        className={`inline-flex w-fit rounded-[36px] ${
          canEdit ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <Box alignItems={BoxAlignItems.Center} className="mr-1">
          <TokenIcon
            chainId={displayToken.chainId as `0x${string}`}
            tokenAddress={displayToken.address as `0x${string}`}
            symbol={displayToken.symbol}
            size="md"
          />
        </Box>
        <Text fontWeight={FontWeight.Medium} data-testid="pay-with-symbol">
          {`${label} ${displayToken.symbol}`}
          {showBalance && (
            <Text
              asChild
              color={TextColor.TextAlternative}
              data-testid="pay-with-balance"
            >
              <span>{` • ${balanceUsdFormatted}`}</span>
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
      </Box>
    </>
  );
}
