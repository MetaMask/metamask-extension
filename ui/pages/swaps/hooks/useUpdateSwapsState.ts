import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAndSetSwapsGasPriceInfo,
  clearSwapsState,
} from '../../../ducks/swaps/swaps';
import {
  setBackgroundSwapRouteState,
  setSwapsErrorKey,
} from '../../../store/actions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  checkNetworkAndAccountSupports1559,
  getIsSwapsChain,
  getUseExternalServices,
} from '../../../selectors';

export default function useUpdateSwapsState() {
  const dispatch = useDispatch();

  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );

  const isBasicFunctionality = useSelector(getUseExternalServices);

  useEffect(() => {
    if (!isSwapsChain || !isBasicFunctionality) {
      return undefined;
    }

    if (!networkAndAccountSupports1559) {
      dispatch(fetchAndSetSwapsGasPriceInfo());
    }

    return () => {
      dispatch(clearSwapsState());
      dispatch(setBackgroundSwapRouteState(''));
      dispatch(setSwapsErrorKey(''));
    };
  }, [
    dispatch,
    chainId,
    networkAndAccountSupports1559,
    isSwapsChain,
    isBasicFunctionality,
  ]);
}
