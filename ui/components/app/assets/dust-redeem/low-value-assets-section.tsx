import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getCurrencyRateControllerCurrentCurrency } from '../../../../../shared/lib/selectors/assets-migration';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { LowValueAssetsToggle } from '../token-list/low-value-assets-toggle';
import type { TokenWithFiatAmount } from '../types';
import { DustRedeemCta } from './dust-redeem-cta';
import { getDustRedeemAmountText } from './dust-redeem-label';
import { sumDustFiatAmount } from './sum-dust-fiat';

type LowValueAssetsSectionProps = {
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  tokens: TokenWithFiatAmount[];
  privacyMode: boolean;
  onRedeemClick: () => void;
};

/**
 * Low balance tokens row with the redeem CTA under the label.
 *
 * @param props - The component props.
 * @param props.count - Number of low balance tokens.
 * @param props.isExpanded - Whether those tokens are shown under the row.
 * @param props.onToggle - Expands or collapses the tokens.
 * @param props.tokens - The low balance tokens. Their fiat total is the redeem amount.
 * @param props.privacyMode - Whether fiat balances are hidden.
 * @param props.onRedeemClick - Opens the redeem modal.
 */
export const LowValueAssetsSection = ({
  count,
  isExpanded,
  onToggle,
  tokens,
  privacyMode,
  onRedeemClick,
}: LowValueAssetsSectionProps) => {
  const t = useI18nContext();
  const currentCurrency = useSelector(getCurrencyRateControllerCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const label = useMemo(
    () =>
      t('dustRedeemForMusd', [
        getDustRedeemAmountText(
          formatCurrencyWithMinThreshold(
            sumDustFiatAmount(tokens),
            currentCurrency || 'usd',
          ),
          privacyMode,
        ),
      ]),
    [currentCurrency, formatCurrencyWithMinThreshold, privacyMode, t, tokens],
  );

  return (
    <LowValueAssetsToggle
      count={count}
      isExpanded={isExpanded}
      onClick={onToggle}
      trailing={<DustRedeemCta label={label} onClick={onRedeemClick} />}
    />
  );
};
