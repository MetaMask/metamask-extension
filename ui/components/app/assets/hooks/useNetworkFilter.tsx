import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../store/actions';
import {
  getNetworkConfigurationIdByChainId,
  getTokenNetworkFilter,
} from '../../../../selectors';

const useNetworkFilter = () => {
  const dispatch = useDispatch();

  const allNetworks = useSelector(getNetworkConfigurationIdByChainId);
  const networkFilter = useSelector(getTokenNetworkFilter);

  useEffect(() => {
    if (process.env.PORTFOLIO_VIEW) {
      const allNetworkFilters = Object.fromEntries(
        Object.keys(allNetworks).map((chainId) => [chainId, true]),
      );

      if (Object.keys(networkFilter).length > 1) {
        dispatch(setTokenNetworkFilter(allNetworkFilters));
      }
    }
  }, [Object.keys(allNetworks).length, networkFilter, dispatch]);

  return { networkFilter };
};

export default useNetworkFilter;
