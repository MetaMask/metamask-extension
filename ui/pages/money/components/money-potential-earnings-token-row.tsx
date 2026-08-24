import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../selectors/multichain';
import { useFormatters } from '../../../hooks/useFormatters';
import type { MoneyDepositToken } from '../../../hooks/money/money-deposit-token-utils';
import { calculateMoneyProjectedEarnings } from '../../../hooks/money/money-deposit-token-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';

type MoneyPotentialEarningsTokenRowProps = {
  token: MoneyDepositToken;
  apyDecimal: number;
  hasNoFee: boolean;
  privacyMode: boolean;
};

export function MoneyPotentialEarningsTokenRow({
  token,
  apyDecimal,
  hasNoFee,
  privacyMode,
}: MoneyPotentialEarningsTokenRowProps) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const projectedEarnings = calculateMoneyProjectedEarnings(
    token.moneyFiatAmountUsd,
    apyDecimal,
  );
  const formattedBalance = formatCurrencyWithMinThreshold(
    token.moneyFiatAmountUsd,
    'USD',
  );
  const formattedProjection = formatCurrencyWithMinThreshold(
    projectedEarnings,
    'USD',
  );
  const networkImage = token.networkImage ?? getImageForChainId(token.chainId);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      className="min-h-16"
      data-testid="money-potential-earnings-token-row"
    >
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name={token.networkName ?? token.chainId}
            src={networkImage}
            size={AvatarNetworkSize.Xs}
            className="rounded-md border-2 border-background-default bg-background-default"
          />
        }
      >
        <AvatarToken
          name={token.title || token.symbol}
          src={token.image}
          size={AvatarTokenSize.Lg}
        />
      </BadgeWrapper>

      <Box className="min-w-0 flex-1">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="truncate"
          >
            {token.title || token.symbol}
          </Text>
          {hasNoFee ? (
            <Box
              className="shrink-0 rounded"
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={BoxBackgroundColor.PrimaryMuted}
            >
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Medium}
                color={TextColor.PrimaryDefault}
              >
                {t('moneyEarnOnCryptoNoFee')}
              </Text>
            </Box>
          ) : null}
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <SensitiveText
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
            data-testid="money-potential-earnings-token-balance"
          >
            {formattedBalance}
          </SensitiveText>
          {projectedEarnings > 0 ? (
            <SensitiveText
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.SuccessDefault}
              isHidden={privacyMode}
              length={SensitiveTextLength.Short}
              data-testid="money-potential-earnings-token-projection"
            >
              {`+${formattedProjection}`}
            </SensitiveText>
          ) : null}
        </Box>
      </Box>

      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Md} disabled>
        {t('moneyAdd')}
      </Button>
    </Box>
  );
}
