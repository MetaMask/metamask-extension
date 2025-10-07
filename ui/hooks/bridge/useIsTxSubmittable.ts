import { useSelector } from 'react-redux';
import { isCrossChain } from '@metamask/bridge-controller';
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

export const useIsTxSubmittable = () => {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChainId = useMultichainSelector(getMultichainCurrentChainId);
  const toChain = useSelector(getToChain);
  const fromAmount = useSelector(getFromAmount);
  const { activeQuote } = useSelector(getBridgeQuotes);

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
      (!isCrossChain(fromChainId, toChain?.chainId) || toChain) &&
      fromAmount &&
      activeQuote &&
      !isInsufficientBalance &&
      !isInsufficientGasBalance &&
      !isInsufficientGasForQuote &&
      !isTxAlertPresent,
  );
};
