import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromToken,
  getValidationErrors,
  getToToken,
  getFromChain,
} from '../../ducks/bridge/selectors';

export const useIsTxSubmittable = () => {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChainId = useSelector(getFromChain)?.chainId;
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
      fromAmount &&
      activeQuote &&
      !isInsufficientBalance &&
      !isInsufficientGasBalance &&
      !isInsufficientGasForQuote &&
      !isTxAlertPresent,
  );
};
