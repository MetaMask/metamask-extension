import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getMultichainIsSolana } from '../../../selectors/multichain';

/*
 * This returns true if the url contains swaps=true and the current chain is solana
 * This is used to determine if the user navigated to the bridge page
 * using the Swap or Bridge button
 */
export const useIsMultichainSwap = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  const isSolana = useSelector(getMultichainIsSolana);

  return searchParams.get('swaps') === 'true' && isSolana;
};
