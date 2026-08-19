import React, { useMemo } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  calculateMoneyProjectedEarnings,
  type MoneyDepositToken,
} from '../../../hooks/money/money-deposit-token-utils';
import { MoneyPotentialEarningsTokenRow } from './money-potential-earnings-token-row';

export const MONEY_POTENTIAL_EARNINGS_VISIBLE_TOKEN_COUNT = 5;

type MoneyPotentialEarningsProps = {
  tokens: MoneyDepositToken[];
  apyDecimal: number | undefined;
  isNoFeeToken: (token: MoneyDepositToken) => boolean;
  privacyMode: boolean;
};

export function MoneyPotentialEarnings({
  tokens,
  apyDecimal,
  isNoFeeToken,
  privacyMode,
}: MoneyPotentialEarningsProps) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const visibleTokens = useMemo(
    () => tokens.slice(0, MONEY_POTENTIAL_EARNINGS_VISIBLE_TOKEN_COUNT),
    [tokens],
  );
  const totalAssetsFiat = useMemo(
    () => tokens.reduce((total, token) => total + token.moneyFiatAmountUsd, 0),
    [tokens],
  );
  const projectedAmount = calculateMoneyProjectedEarnings(
    totalAssetsFiat,
    apyDecimal ?? 0,
  );

  const hasProjection = totalAssetsFiat > 0 && projectedAmount > 0;

  return (
    <section data-testid="money-potential-earnings">
      <Box paddingLeft={4} paddingRight={4} paddingTop={3} paddingBottom={3}>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('moneyEarnOnCrypto')}
        </Text>
        {hasProjection ? (
          <Box
            className="mt-2"
            data-testid="money-potential-earnings-description"
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="inline"
            >
              {`${t('moneyEarnOnCryptoDescriptionPrefix')} `}
            </Text>
            <SensitiveText
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              isHidden={privacyMode}
              length={SensitiveTextLength.Medium}
              className="inline"
              data-testid="money-potential-earnings-total"
            >
              {formatCurrencyWithMinThreshold(totalAssetsFiat, 'USD')}
            </SensitiveText>{' '}
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="inline"
            >
              {`${t('moneyEarnOnCryptoDescriptionMiddle')} `}
            </Text>
            <SensitiveText
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.SuccessDefault}
              isHidden={privacyMode}
              length={SensitiveTextLength.Short}
              className="inline"
              data-testid="money-potential-earnings-projection"
            >
              {`+${formatCurrencyWithMinThreshold(projectedAmount, 'USD')}`}
            </SensitiveText>{' '}
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="inline"
            >
              {t('moneyEarnOnCryptoDescriptionSuffix')}
            </Text>
            <Icon
              name={IconName.Info}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
              className="ml-1 inline-block align-text-bottom"
            />
          </Box>
        ) : (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="mt-2"
          >
            {t('moneyEarnOnCryptoDescription')}
          </Text>
        )}
      </Box>

      {visibleTokens.map((token) => (
        <MoneyPotentialEarningsTokenRow
          key={`${token.chainId}:${token.address}`}
          token={token}
          apyDecimal={apyDecimal ?? 0}
          hasNoFee={isNoFeeToken(token)}
          privacyMode={privacyMode}
        />
      ))}

      {tokens.length > MONEY_POTENTIAL_EARNINGS_VISIBLE_TOKEN_COUNT ? (
        <Box paddingLeft={4} paddingRight={4} paddingTop={3}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            disabled
            className="w-full"
          >
            {t('viewAll')}
          </Button>
        </Box>
      ) : null}
    </section>
  );
}
