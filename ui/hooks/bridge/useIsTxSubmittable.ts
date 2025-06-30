import { useSelector } from 'react-redux';
import { type BigNumber } from 'bignumber.js';
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
    isTxAlertPresent,
  } = useSelector(getValidationErrors);

  return Boolean(
    fromToken &&
      toToken &&
      fromChainId &&
      (isSwap || toChain) &&
      fromAmount &&
      activeQuote &&
      !isInsufficientBalance(srcTokenBalance) &&
      !isInsufficientGasBalance(nativeAssetBalance) &&
      !isInsufficientGasForQuote(nativeAssetBalance) &&
      !isTxAlertPresent,
  );
};
