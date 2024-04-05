import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import {
  getConversionRate,
  getGasFeeEstimates,
  getNativeCurrency,
} from '../../../../../../ducks/metamask/metamask';
import { EtherDenomination } from '../../../../../../../shared/constants/common';
import {
  getCurrentCurrency,
  checkNetworkAndAccountSupports1559,
} from '../../../../../../selectors/selectors';
import { getUsedSwapsGasPrice } from '../../../../../../ducks/swaps/swaps';
import { formatCurrency } from '../../../../../../helpers/utils/confirm-tx.util';

export default function useEthFeeData(gasLimit = 0) {
  const nativeCurrencySymbol = useSelector(getNativeCurrency);

  const selectedNativeConversionRate = useSelector(getConversionRate);

  const currentCurrency = useSelector(getCurrentCurrency);

  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const gasPrice = useSelector(getUsedSwapsGasPrice);
  const {
    medium: { suggestedMaxFeePerGas },
  } = useSelector(getGasFeeEstimates);

  const { formattedEthGasFee, formattedFiatGasFee } = useMemo(() => {
    const ethGasFee = new Numeric(
      networkAndAccountSupports1559 ? suggestedMaxFeePerGas : gasPrice,
      10,
      EtherDenomination.GWEI,
    )
      .times(new Numeric(gasLimit, 10))
      .toDenomination(EtherDenomination.ETH);

    const fiatGasFee = ethGasFee
      .times(selectedNativeConversionRate, 10)
      .toNumber();

    const formattedFiatGasFee = formatCurrency(
      new Numeric(fiatGasFee, 10).toString(),
      currentCurrency,
    );

    const formattedEthGasFee = `${ethGasFee} ${nativeCurrencySymbol}`;

    return { ethGasFee, fiatGasFee, formattedFiatGasFee, formattedEthGasFee };
  }, [
    networkAndAccountSupports1559,
    suggestedMaxFeePerGas,
    gasPrice,
    gasLimit,
    selectedNativeConversionRate,
    currentCurrency,
    nativeCurrencySymbol,
  ]);

  return { formattedEthGasFee, formattedFiatGasFee };
}
