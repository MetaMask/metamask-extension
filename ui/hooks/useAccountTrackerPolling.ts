import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = ({
  chainIds,
}: { chainIds?: string[] } = {}) => {
  console.log('🚀 ~ chainIds:::::::::::::::::::', chainIds);
  // Selectors to determine polling input
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  console.log(
    '🚀 ~ networkConfigurations::::::::::::::::::::::',
    networkConfigurations,
  );

  const availableNetworkClientIds = Object.values(
    networkConfigurations,
  ).flatMap((networkConfiguration) =>
    networkConfiguration.rpcEndpoints.map(
      (rpcEndpoint) => rpcEndpoint.networkClientId,
    ),
  );
  console.log('🚀 ~ availableNetworkClientIds:', availableNetworkClientIds);

  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: availableNetworkClientIds,
  });
};

export default useAccountTrackerPolling;
