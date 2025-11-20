import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import {
  getNativeAssetForChainId,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';

import { TokenStandAndDetails } from '../../../../../store/actions';
import { fetchTokenExchangeRates } from '../../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import {
  fetchAllTokenDetails,
  getTokenValueFromRecord,
} from '../../../utils/token';
import { useConfirmContext } from '../../../context/confirm';

export function useDappSwapUSDValues({
  tokenAddresses = [],
  destTokenAddress,
}: {
  tokenAddresses?: Hex[];
  destTokenAddress?: Hex;
}) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, txParams } = currentConfirmation ?? {
    txParams: {},
  };
  const { maxFeePerGas } = txParams ?? {};

  const { value: fiatRates, pending: fiatRatesPending } = useAsyncResult<
    Record<Hex, number | undefined>
  >(() => {
    const addresses = tokenAddresses.filter(
      (tokenAddress) => !isNativeAddress(tokenAddress),
    );
    return fetchTokenExchangeRates('usd', addresses as Hex[], chainId);
  }, [chainId, tokenAddresses?.length]);

  const { value: tokenDetails, pending: tokenDetailsPending } = useAsyncResult<
    Record<Hex, TokenStandAndDetails>
  >(async () => {
    let result = await fetchAllTokenDetails(tokenAddresses as Hex[], chainId);
    tokenAddresses.forEach((tokenAddress) => {
      if (isNativeAddress(tokenAddress)) {
        result = {
          ...result,
          [tokenAddress as Hex]: getNativeAssetForChainId(chainId),
        };
      }
    });
    return result;
  }, [chainId, tokenAddresses?.length]);

  const getTokenUSDValue = useCallback(
    (tokenAmount: string, tokenAddress: Hex, decimalsToDisplay?: number) => {
      if (!tokenDetails || !fiatRates) {
        return '0';
      }
      const decimals = new BigNumber(
        Math.pow(
          10,
          parseInt(
            getTokenValueFromRecord<TokenStandAndDetails>(
              tokenDetails,
              tokenAddress,
            )?.decimals ?? '18',
            10,
          ),
        ),
      );
      const conversionRate = new BigNumber(
        getTokenValueFromRecord(fiatRates, tokenAddress) ?? 0,
      );
      const value = new BigNumber(tokenAmount ?? 0)
        .dividedBy(decimals)
        .times(conversionRate);
      return decimalsToDisplay
        ? value.toFixed(decimalsToDisplay)
        : value.toString(10);
    },
    [fiatRates, tokenDetails],
  );

  const getDestinationTokenUSDValue = useCallback(
    (tokenAmount: string, decimalsToDisplay?: number) => {
      if (!destTokenAddress) {
        return '0';
      }
      return getTokenUSDValue(
        tokenAmount,
        destTokenAddress as Hex,
        decimalsToDisplay,
      );
    },
    [getTokenUSDValue, destTokenAddress],
  );

  const getGasUSDValue = useCallback(
    (gasValue: BigNumber) => {
      if (!maxFeePerGas) {
        return '0';
      }
      const gasPrice = new BigNumber(maxFeePerGas, 16);
      const totalGas = gasPrice.times(gasValue).toString(10);
      const nativeTokenAddress = getNativeTokenAddress(chainId);
      return getTokenUSDValue(totalGas, nativeTokenAddress);
    },
    [chainId, getTokenUSDValue, maxFeePerGas],
  );

  return {
    getGasUSDValue,
    getTokenUSDValue,
    getDestinationTokenUSDValue,
    tokenDetails,
    fiatRates,
    tokenInfoPending: fiatRatesPending || tokenDetailsPending,
  };
}
