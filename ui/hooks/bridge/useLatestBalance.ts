import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isCrossChain } from '@metamask/bridge-controller';
import { setEvmBalances } from '../../ducks/bridge/actions';
import { getFromToken } from '../../ducks/bridge/selectors';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import { useBridgeNavigation } from './useBridgeNavigation';

/**
 * This sets the latest balance for the fromToken and the native token on the src chain
 */
export const useLatestBalance = () => {
  const dispatch = useDispatch();
  const fromToken = useSelector(getFromToken);

  /**
   * @deprecated remove this when GNS references are removed
   */
  const currentChainId = useSelector(getMultichainCurrentChainId);

  const { token } = useBridgeNavigation();

  // Set src chain balances when the fromToken changes and after the token object is applied
  useEffect(() => {
    if (
      isCrossChain(fromToken.chainId, currentChainId) ||
      (token && token.assetId.toLowerCase() !== fromToken.assetId.toLowerCase())
    ) {
      return;
    }
    dispatch(setEvmBalances(fromToken.assetId));
  }, [fromToken, currentChainId, token]);
};
