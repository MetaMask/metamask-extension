import { useEffect } from 'react';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { useDispatch, useSelector } from 'react-redux';
import { getFromChain } from '../../ducks/bridge/selectors';
import { setMinimumBalanceForRentExemptionInLamports } from '../../ducks/bridge/bridge';

const useSolanaMinBalanceForRentExemption = () => {
  const dispatch = useDispatch();
  const fromChain = useSelector(getFromChain);

  useEffect(() => {
    if (fromChain?.chainId && isSolanaChainId(fromChain.chainId)) {
      dispatch(setMinimumBalanceForRentExemptionInLamports());
    }
  }, [dispatch, fromChain?.chainId]);
};

export default useSolanaMinBalanceForRentExemption;
