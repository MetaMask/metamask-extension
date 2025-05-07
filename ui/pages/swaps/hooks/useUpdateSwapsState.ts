import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTokens,
  fetchTopAssets,
  fetchAggregatorMetadata,
} from '../swaps.util';
import {
  fetchAndSetSwapsGasPriceInfo,
  prepareToLeaveSwaps,
  setAggregatorMetadata,
  setTopAssets,
} from '../../../ducks/swaps/swaps';
import { setSwapsTokens } from '../../../store/actions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  checkNetworkAndAccountSupports1559,
  getIsSwapsChain,
  getUseExternalServices,
} from '../../../selectors';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../../shared/constants/swaps';

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

    fetchTokens(chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP)
      .then((tokens) => {
        dispatch(setSwapsTokens(tokens));
      })
      .catch((error) => console.error(error));

    fetchTopAssets(chainId).then((topAssets) => {
      dispatch(setTopAssets(topAssets));
    });

    fetchAggregatorMetadata(chainId).then((newAggregatorMetadata) => {
      dispatch(setAggregatorMetadata(newAggregatorMetadata));
    });

    if (!networkAndAccountSupports1559) {
      dispatch(fetchAndSetSwapsGasPriceInfo());
    }

    return () => {
      dispatch(prepareToLeaveSwaps());
    };
  }, [
    dispatch,
    chainId,
    networkAndAccountSupports1559,
    isSwapsChain,
    isBasicFunctionality,
  ]);
}
