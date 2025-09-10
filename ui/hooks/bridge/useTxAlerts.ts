import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  getFromChain,
  getBridgeQuotes,
  getFromAccount,
} from '../../ducks/bridge/selectors';
import { setTxAlerts } from '../../ducks/bridge/actions';

/**
 * Sets tx alerts for the active quote
 */
export const useTxAlerts = () => {
  const dispatch = useDispatch();

  const fromChain = useSelector(getFromChain);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const { trade } = activeQuote ?? {};
  const account = useSelector(getFromAccount);

  useEffect(() => {
    if (
      trade &&
      typeof trade === 'string' &&
      fromChain?.chainId &&
      isSolanaChainId(fromChain.chainId) &&
      account?.address
    ) {
      dispatch(
        setTxAlerts({
          chainId: MultichainNetworks.SOLANA,
          trade,
          accountAddress: account.address,
        }),
      );
    }
  }, [trade, fromChain?.chainId, account?.address]);
};
