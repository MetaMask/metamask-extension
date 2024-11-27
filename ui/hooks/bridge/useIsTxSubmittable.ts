import { useSelector } from 'react-redux';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../shared/constants/swaps';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromToken,
  getToChain,
  getValidationErrors,
  getToToken,
} from '../../ducks/bridge/selectors';
import useLatestBalance from './useLatestBalance';

export const useIsTxSubmittable = () => {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const fromAmount = useSelector(getFromAmount);
  const { activeQuote } = useSelector(getBridgeQuotes);

  const {
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
  } = useSelector(getValidationErrors);

  const { normalizedBalance } = useLatestBalance(fromToken, fromChain?.chainId);
  const { normalizedBalance: nativeAssetBalance } = useLatestBalance(
    fromChain?.chainId
      ? SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
          fromChain.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
        ]
      : null,
    fromChain?.chainId,
  );

  return Boolean(
    fromToken &&
      toToken &&
      fromChain &&
      toChain &&
      fromAmount &&
      activeQuote &&
      !isInsufficientBalance(normalizedBalance) &&
      !isInsufficientGasBalance(nativeAssetBalance) &&
      !isInsufficientGasForQuote(nativeAssetBalance),
  );
};
