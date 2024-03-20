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

export const FIAT_UNAVAILABLE = 'Fiat Unavailable';

/**
 * Describes an amount of fiat.
 */
export type FiatAmount = Numeric | typeof FIAT_UNAVAILABLE;

/**
 * Context for converting asset amounts to fiat.
 */
type ConversionContext = {
  /**
   * The i18n context to localize messages.
   */
  t: ReturnType<typeof useI18nContext>;

  /**
   * The locale to of the user for formatting fiat amounts.
   */
  locale: string;

  /**
   * The fiat currency of the user.
   */
  fiatCurrency: string;

  /**
   * The native conversion rate to the fiat currency.
   */
  nativeConversionRate: number;

  /**
   * The conversion rates for tokens to the fiat currency.
   */
  tokenConversionRates: Record<Hex, number>;
};

/**
 * Returns a context for converting asset amounts to fiat.
 */
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

/**
 * Formats a fiat amount as a localized string.
 *
 * @param ctx
 * @param fiatAmount
 */
function formatFiatAmount(
  ctx: ConversionContext,
  fiatAmount: Numeric | typeof FIAT_UNAVAILABLE,
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

/**
 * Returns the fiat amount for a balance change.
 *
 * @param ctx
 * @param balanceChange
 * @param balanceChange.amount
 * @param balanceChange.asset
 */
function convertBalanceChangeToFiatAmount(
  ctx: ConversionContext,
  { amount, asset }: BalanceChange,
): FiatAmount {
  if (asset.standard === TokenStandard.none) {
    return new Numeric(
      amount.quantity,
      16,
      EtherDenomination.WEI,
    ).applyConversionRate(ctx.nativeConversionRate);
  }

  const conversionRate = ctx.tokenConversionRates[asset.address];
  if (!conversionRate) {
    return FIAT_UNAVAILABLE;
  }
  return new Numeric(amount.quantity, 16)
    .shiftedBy(amount.decimals)
    .applyConversionRate(conversionRate);
}

/**
 * Returns the fiat info for a list of balance changes.
 *
 * @param balanceChanges
 */
export function useAssetFiatDetails(
  balanceChanges: BalanceChange[],
): AssetFiatDetails[] {
  const ctx = useFiatConversionContext();

  return balanceChanges.map((bc) => {
    const fiatAmount = convertBalanceChangeToFiatAmount(ctx, bc);

    return {
      asset: bc.asset,
      fiatAmount,
      fiatFormatted: formatFiatAmount(ctx, fiatAmount),
    };
  });
}
