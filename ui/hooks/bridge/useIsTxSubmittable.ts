import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  getBridgeQuotes,
  getFromAmount,
  getFromToken,
  getToChain,
  getValidationErrors,
  getToToken,
} from '../../ducks/bridge/selectors';
import { useIsMultichainSwap } from '../../pages/bridge/hooks/useIsMultichainSwap';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import { useMultichainSelector } from '../useMultichainSelector';
import useLatestBalance from './useLatestBalance';

export const useIsTxSubmittable = () => {
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

  const balanceAmount = useLatestBalance(fromToken);
  const nativeAsset = useMemo(
    () => getNativeAssetForChainId(fromChainId),
    [fromChainId],
  );
  const nativeAssetBalance = useLatestBalance(nativeAsset);

  return Boolean(
    fromToken &&
      toToken &&
      fromChainId &&
      (isSwap || toChain) &&
      fromAmount &&
      activeQuote &&
      !isInsufficientBalance(balanceAmount) &&
      !isInsufficientGasBalance(nativeAssetBalance) &&
      !isInsufficientGasForQuote(nativeAssetBalance),
  );
};
