import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { getMultichainIsSolana } from '../../../selectors/multichain';
import { getIsSwap } from '../../../ducks/bridge/selectors';

/*
 * This returns true if the url contains swaps=true and the current chain is solana
 * This is used to determine if the user navigated to the bridge page
 * using the Swap or Bridge button
 *
 * This appends the swaps=true query param to the url if it is not already set
 * and the current quoteRequest is a solana swap
 */
export const useIsMultichainSwap = () => {
  const { search, pathname } = useLocation();
  const history = useHistory();

  const isSolana = useSelector(getMultichainIsSolana);

  const isQuoteRequestSwap = useSelector(getIsSwap);

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const isSwapQueryParamSet = searchParams.get('swaps') === 'true';
    if (isQuoteRequestSwap && isSolana && !isSwapQueryParamSet) {
      searchParams.set('swaps', 'true');
      history.replace({
        pathname,
        search: searchParams.toString(),
      });
    }
  }, [isQuoteRequestSwap, isSolana, history, search, pathname]);

  const isSolanaSwap = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const isSwapQueryParamSet = searchParams.get('swaps') === 'true';

    return isSwapQueryParamSet && isSolana;
  }, [isSolana, search]);

  return isSolanaSwap;
};
