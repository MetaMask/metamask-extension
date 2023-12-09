import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAggregatorMetadata,
  fetchTokens,
  fetchTopAssets,
} from '../swaps.util';
import {
  fetchSwapsLivenessAndFeatureFlags,
  // fetchAndSetSwapsGasPriceInfo,
  prepareToLeaveSwaps,
  setAggregatorMetadata,
  setTopAssets,
} from '../../../ducks/swaps/swaps';
import { setSwapsTokens } from '../../../store/actions';
import { getCurrentChainId } from '../../../selectors';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';

export default function useSwapsData() {
  const chainId = useSelector(getCurrentChainId);
  const dispatch = useDispatch();

  // This will pre-load gas fees before going to the View Quote page.
  useGasFeeEstimates();

  useEffect(() => {
    // if (!isSwapsChain) {
    //   return undefined;
    // }
    fetchTokens(chainId)
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
    // if (!networkAndAccountSupports1559) {
    //   dispatch(fetchAndSetSwapsGasPriceInfo(chainId));
    // }
    return () => {
      dispatch(prepareToLeaveSwaps());
    };
    // }, [dispatch, chainId, networkAndAccountSupports1559, isSwapsChain]);
  }, [dispatch, chainId]);

  useEffect(() => {
    const fetchSwapsLivenessAndFeatureFlagsWrapper = async () => {
      await dispatch(fetchSwapsLivenessAndFeatureFlags());
    };
    fetchSwapsLivenessAndFeatureFlagsWrapper();
  }, [dispatch]);
}
