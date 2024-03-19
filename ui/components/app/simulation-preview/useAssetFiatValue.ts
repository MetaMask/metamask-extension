import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getCurrentCurrency } from '../../../selectors';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { AssetIdentifier, BalanceChange } from './types';

export const FIAT_UNAVAILABLE = 'NA';

/**
 * Describes a fiat value for some amount of an asset.
 */
type AssetFiatValue = {
  /**
   *
   */
  asset: AssetIdentifier;
  /**
   * The fiat amount or undefined if the fiat amount is not available.
   */
  fiatAmount: Numeric | typeof FIAT_UNAVAILABLE;
  /**
   * The fiat currency formatted as a string.
   * Example: "$10,000.00"
   */
  formatted: string;
};

type ConversionContext = {
  t: ReturnType<typeof useI18nContext>;
  locale: string;
  fiatCurrency: string;
  nativeConversionRate: number;
  tokenConversionRates: Record<Hex, number>;
};

function useFiatConversionContext(): ConversionContext {
  const fiatCurrency = useSelector(getCurrentCurrency);
  const nativeConversionRate = useSelector(getConversionRate);
  const t = useI18nContext();
  const locale = useSelector(getCurrentLocale);
  return {
    t,
    locale,
    fiatCurrency,
    nativeConversionRate,
    tokenConversionRates: {},
  };
}

function formatFiatAmount(
  fiatAmount: Numeric | typeof FIAT_UNAVAILABLE,
  ctx: ConversionContext,
): string {
  const t = useI18nContext();
  if (fiatAmount === FIAT_UNAVAILABLE) {
    return t('simulationPreviewFiatNotAvailable');
  }
  return Intl.NumberFormat(ctx.locale, {
    style: 'currency',
    currency: ctx.fiatCurrency,
  }).format(fiatAmount.toNumber());
}

function getAssetFiatAmount(
  bc: BalanceChange,
  ctx: ConversionContext,
): Numeric | typeof FIAT_UNAVAILABLE {
  if (bc.asset.standard === TokenStandard.none) {
    // Native asset
    return new Numeric(
      bc.amount.quantity,
      16,
      EtherDenomination.WEI,
    ).applyConversionRate(ctx.nativeConversionRate);
  }

  const conversionRate = ctx.tokenConversionRates[bc.asset.address];
  if (!conversionRate) {
    return FIAT_UNAVAILABLE;
  }
  let numeric = new Numeric(bc.amount.quantity, 16).shiftedBy(
    -bc.amount.exponent,
  );
  numeric = numeric.applyConversionRate(conversionRate);
  return {
    asset: bc.asset,
    fiatAmount: numeric,
    formatted: formatFiatAmount(numeric, ctx),
  };
}

export function useAssetFiatValue(bcs: BalanceChange[]): AssetFiatValue[] {
  const ctx = useFiatConversionContext();
  return bcs.map((bc) => {
    const fiatAmount = getAssetFiatAmount(bc, ctx);
    return {
      asset: bc.asset,
      fiatAmount,
      formatted: formatFiatAmount(fiatAmount, ctx),
    };
  });
}
