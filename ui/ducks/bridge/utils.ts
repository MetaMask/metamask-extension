import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { getAddress } from 'ethers/lib/utils';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { TxData } from '../../pages/bridge/types';
import { getTransaction1559GasFeeEstimates } from '../../pages/swaps/swaps.util';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';

// We don't need to use gas multipliers here because the gasLimit from Bridge API already included it
export const getHexMaxGasLimit = (gasLimit: number) => {
  return new Numeric(
    new BigNumber(gasLimit).toString(),
    10,
  ).toPrefixedHexString() as Hex;
};
export const getTxGasEstimates = async ({
  networkAndAccountSupports1559,
  networkGasFeeEstimates,
  txParams,
  hexChainId,
}: {
  networkAndAccountSupports1559: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkGasFeeEstimates: any;
  txParams: TxData;
  hexChainId: Hex;
}) => {
  if (networkAndAccountSupports1559) {
    const { estimatedBaseFeeGwei = '0' } = networkGasFeeEstimates;
    const hexEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFeeGwei) as Hex;
    const txGasFeeEstimates = await getTransaction1559GasFeeEstimates(
      {
        ...txParams,
        chainId: hexChainId,
        gasLimit: txParams.gasLimit?.toString(),
      },
      hexEstimatedBaseFee,
      hexChainId,
    );
    return txGasFeeEstimates;
  }

  return {
    baseAndPriorityFeePerGas: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };
};

export const getTokenExchangeRate = async (request: {
  chainId: Hex;
  tokenAddress: string;
  currency: string;
}) => {
  const { chainId, tokenAddress, currency } = request;
  const exchangeRates = await fetchTokenExchangeRates(
    currency,
    [tokenAddress],
    chainId,
  );
  return (
    exchangeRates?.[tokenAddress.toLowerCase()] ??
    exchangeRates?.[getAddress(tokenAddress)]
  );
};
