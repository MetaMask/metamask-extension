import React, { useMemo } from 'react';
import {
  Box,
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
import BigNumber from 'bignumber.js';
import { moneyFormatUsd } from '../../../helpers/money/format';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  calculateMoneyProjectedEarnings,
  type MoneyDepositToken,
} from '../../../hooks/money/money-deposit-token-utils';

type MoneyPotentialEarningsSummaryProps = {
  tokens: MoneyDepositToken[];
  apyDecimal: number | undefined;
  privacyMode: boolean;
  headingVariant?: typeof TextVariant.HeadingMd | typeof TextVariant.HeadingLg;
  showInfoIcon?: boolean;
};

export function MoneyPotentialEarningsSummary({
  tokens,
  apyDecimal,
  privacyMode,
  headingVariant = TextVariant.HeadingMd,
  showInfoIcon = true,
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
          <SensitiveText
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
            isHidden={privacyMode}
            length={SensitiveTextLength.Short}
            className="inline"
            data-testid="money-potential-earnings-projection"
          >
            {`+${moneyFormatUsd(new BigNumber(projectedAmount.toString()))}`}
          </SensitiveText>{' '}
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="inline"
          >
            {t('moneyEarnOnCryptoDescriptionSuffix')}
          </Text>
          {showInfoIcon ? (
            <Icon
              name={IconName.Info}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
              className="ml-1 inline-block align-text-bottom"
            />
          ) : null}
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
