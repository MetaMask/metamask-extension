import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import {
  getMultichainCoinRates,
  getMultichainCurrentCurrency,
} from '../selectors/multichain';
import { NativeAsset } from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { useMultichainSelector } from './useMultichainSelector';

export const useMultichainCurrencyDisplayByAsset = ({
  assetDetails,
  amount,
}: {
  assetDetails: NativeAsset & {
    balance: string;
    details: { decimals: number };
  };
  amount: string;
}): {
  fiatValue: string;
  displayValue: string;
} => {
  const conversionRates = useMultichainSelector(getMultichainCoinRates);
  const currency = useMultichainSelector(getMultichainCurrentCurrency);

  const fiatValue = useMemo(() => {
    if (!conversionRates || !amount) {
      return '';
    }

    // rates from the rates controller uses symbol as the key
    const conversionRate =
      conversionRates[assetDetails.symbol.toLowerCase()]?.conversionRate ?? '0';

    // rates are in the largest  denomination of the asset
    // e.g. 1 ETH = 1000000000000000000 wei
    // e.g. 1 BTC = 100000000 satoshis
    const fiatValueBN = new BigNumber(amount).mul(
      new BigNumber(conversionRate),
    );
    const formattedValue = formatCurrency(fiatValueBN.toString(), currency);

    return formattedValue;
  }, [amount, conversionRates]);

  const displayValue = `${amount} ${assetDetails.symbol}`;

  return { fiatValue, displayValue };
};
