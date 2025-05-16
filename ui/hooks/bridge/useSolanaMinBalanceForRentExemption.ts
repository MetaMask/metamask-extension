import { useEffect } from 'react';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { useDispatch, useSelector } from 'react-redux';
import { getBridgeQuotes, getQuoteRequest } from '../../ducks/bridge/selectors';
import { setMinimumBalanceForRentExemptionInLamports } from '../../ducks/bridge/bridge';

const useSolanaMinBalanceForRentExemption = () => {
  const dispatch = useDispatch();
  const { srcChainId } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);

  // Update minimum balance on load, srcChain change, or activeQuote refresh
  useEffect(() => {
    if (srcChainId && isSolanaChainId(srcChainId)) {
      dispatch(setMinimumBalanceForRentExemptionInLamports());
    }
  }, [dispatch, srcChainId, activeQuote]);
};

export default useSolanaMinBalanceForRentExemption;
