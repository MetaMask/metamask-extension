import { useSelector } from 'react-redux';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { useMemo } from 'react';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromToken,
  getToChain,
  getValidationErrors,
  getToToken,
} from '../../ducks/bridge/selectors';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import { useMultichainSelector } from '../useMultichainSelector';
import { useIsMultichainSwap } from '../../pages/bridge/hooks/useIsMultichainSwap';
import { BigNumber } from 'bignumber.js';

export const useIsTxSubmittable = (
  nativeAssetBalance?: BigNumber,
  srcTokenBalance?: BigNumber,
) => {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChainId = useMultichainSelector(getMultichainCurrentChainId);
  const toChain = useSelector(getToChain);
  const fromAmount = useSelector(getFromAmount);
  const { activeQuote } = useSelector(getBridgeQuotes);

  const isSwap = useIsMultichainSwap();
  const {
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
  } = useSelector(getValidationErrors);

  const nativeAsset = useMemo(
    () => getNativeAssetForChainId(fromChainId),
    [fromChainId],
  );

  return Boolean(
    fromToken &&
      toToken &&
      fromChainId &&
      (isSwap || toChain) &&
      fromAmount &&
      activeQuote &&
      !isInsufficientBalance(srcTokenBalance) &&
      !isInsufficientGasBalance(nativeAssetBalance) &&
      !isInsufficientGasForQuote(nativeAssetBalance),
  );
};
