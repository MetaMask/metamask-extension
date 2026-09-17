import React, { useMemo } from 'react';
import {
  Box,
  FontWeight,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import BigNumber from 'bignumber.js';
import { moneyFormatUsd } from '../../../helpers/money/format';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  calculateMoneyProjectedEarnings,
  type MoneyDepositToken,
} from '../../../hooks/money/money-deposit-token-utils';
import { TooltipText } from '../../../components/app/money/tooltip-text';

type MoneyPotentialEarningsSummaryProps = {
  tokens: MoneyDepositToken[];
  apyDecimal: number | undefined;
  apyPercent: number | undefined;
  privacyMode: boolean;
  headingVariant?: typeof TextVariant.HeadingMd | typeof TextVariant.HeadingLg;
};

export function MoneyPotentialEarningsSummary({
  tokens,
  apyDecimal,
  apyPercent,
  privacyMode,
  headingVariant = TextVariant.HeadingMd,
}: MoneyPotentialEarningsSummaryProps) {
  const t = useI18nContext();
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
    <Box paddingLeft={4} paddingRight={4} paddingTop={3} paddingBottom={3}>
      <Text variant={headingVariant} fontWeight={FontWeight.Bold}>
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
            {moneyFormatUsd(new BigNumber(totalAssetsFiat.toString()))}
          </SensitiveText>{' '}
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="inline"
          >
            {`${t('moneyEarnOnCryptoDescriptionMiddle')} `}
          </Text>
          <TooltipText
            text={`+${moneyFormatUsd(new BigNumber(projectedAmount.toString()))}`}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
            isHidden={privacyMode}
            length={SensitiveTextLength.Short}
            position="bottom"
            data-testid="money-potential-earnings-projection"
          >
            {t('moneyEarnSectionAccountProjectedBalanceTooltip', [
              String(apyPercent),
            ])}
          </TooltipText>{' '}
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="inline"
          >
            {t('moneyEarnOnCryptoDescriptionSuffix')}
          </Text>
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
  );
}
