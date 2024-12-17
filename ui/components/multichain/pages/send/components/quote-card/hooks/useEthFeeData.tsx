import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isHexString } from '@metamask/utils';
import { Numeric } from '../../../../../../../../shared/modules/Numeric';
import {
  getConversionRate,
  getGasFeeEstimates,
  getNativeCurrency,
  getCurrentCurrency,
} from '../../../../../../../ducks/metamask/metamask';
import { EtherDenomination } from '../../../../../../../../shared/constants/common';
import {
  checkNetworkAndAccountSupports1559,
  getIsSwapsChain,
} from '../../../../../../../selectors/selectors';
import { getCurrentChainId } from '../../../../../../../../shared/modules/selectors/networks';
import {
  fetchAndSetSwapsGasPriceInfo,
  getUsedSwapsGasPrice,
} from '../../../../../../../ducks/swaps/swaps';
import { formatCurrency } from '../../../../../../../helpers/utils/confirm-tx.util';
import { toFixedNoTrailingZeros } from './utils';

export default function useEthFeeData(gasLimit = 0) {
  const dispatch = useDispatch();
  const nativeCurrencySymbol = useSelector(getNativeCurrency);

  const selectedNativeConversionRate = useSelector(getConversionRate);

  const currentCurrency = useSelector(getCurrentCurrency);

  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const { medium, gasPrice: maybeGasFee } = useSelector(getGasFeeEstimates);

  // remove this logic once getGasFeeEstimates is typed
  const gasFee1559 = maybeGasFee ?? medium?.suggestedMaxFeePerGas;

  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector(getIsSwapsChain);

  const gasPriceNon1559 = useSelector(getUsedSwapsGasPrice);

  useEffect(() => {
    if (!isSwapsChain) {
      return;
    }

    if (!networkAndAccountSupports1559) {
      dispatch(fetchAndSetSwapsGasPriceInfo());
    }
  }, [dispatch, chainId, networkAndAccountSupports1559, isSwapsChain]);

  return useMemo(() => {
    const rawGasPrice = networkAndAccountSupports1559
      ? gasFee1559
      : gasPriceNon1559;

    if (!rawGasPrice) {
      return { formattedFiatGasFee: '', formattedEthGasFee: '' };
    }

    const ethGasFee = new Numeric(
      rawGasPrice,
      isHexString(rawGasPrice) ? 16 : 10,
      EtherDenomination.GWEI,
    )
      .times(new Numeric(gasLimit, 10))
      .toDenomination(EtherDenomination.ETH);

    const fiatGasFee = selectedNativeConversionRate
      ? ethGasFee.applyConversionRate(selectedNativeConversionRate).toNumber()
      : undefined;

    const formattedFiatGasFee = fiatGasFee
      ? formatCurrency(new Numeric(fiatGasFee, 10).toString(), currentCurrency)
      : '';

    const formattedEthGasFee = `${toFixedNoTrailingZeros(
      ethGasFee.toNumber(),
    )} ${nativeCurrencySymbol}`;

    return { formattedFiatGasFee, formattedEthGasFee };
  }, [
    networkAndAccountSupports1559,
    medium?.suggestedMaxFeePerGas,
    gasPriceNon1559,
    gasLimit,
    selectedNativeConversionRate,
    currentCurrency,
    nativeCurrencySymbol,
  ]);
}
