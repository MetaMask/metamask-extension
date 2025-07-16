import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getBestQuote,
  getCurrentDraftTransaction,
} from '../../../../../../../ducks/send';
import { AssetType } from '../../../../../../../../shared/constants/transaction';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import { Numeric } from '../../../../../../../../shared/modules/Numeric';
import { Quote } from '../../../../../../../ducks/send/swap-and-send-utils';
import { getNativeCurrency } from '../../../../../../../ducks/metamask/metamask';

const NATIVE_CURRENCY_DECIMALS = 18;

export default function useGetConversionRate() {
  const bestQuote: Quote | undefined = useSelector(getBestQuote);
  const { sendAsset, receiveAsset } = useSelector(getCurrentDraftTransaction);

  const nativeCurrencySymbol = useSelector(getNativeCurrency);

  const sourceTokenSymbol =
    sendAsset?.type === AssetType.native
      ? nativeCurrencySymbol
      : sendAsset?.details?.symbol;

  const destinationTokenSymbol =
    receiveAsset?.type === AssetType.native
      ? nativeCurrencySymbol
      : receiveAsset?.details?.symbol;

  const formattedConversionRate = useMemo(() => {
    if (bestQuote && sendAsset && receiveAsset) {
      const primaryTokenAmount = calcTokenAmount(
        bestQuote.sourceAmount,
        sendAsset.details?.decimals || NATIVE_CURRENCY_DECIMALS,
      );
      const secondaryTokenAmount = calcTokenAmount(
        bestQuote.destinationAmount,
        receiveAsset.details?.decimals || NATIVE_CURRENCY_DECIMALS,
      );

      const conversionRateFromPrimaryToSecondary = new Numeric(
        secondaryTokenAmount,
      )
        .divide(primaryTokenAmount)
        .round(9)
        .toNumber();

      return `1 ${sourceTokenSymbol} = ${conversionRateFromPrimaryToSecondary} ${destinationTokenSymbol}`;
    }

    return undefined;
  }, [
    bestQuote?.sourceAmount,
    bestQuote?.destinationAmount,
    sendAsset?.details?.decimals,
    receiveAsset?.details?.decimals,
    sourceTokenSymbol,
    destinationTokenSymbol,
  ]);

  return formattedConversionRate;
}
