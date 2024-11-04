import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = () => {
  // Selectors to determine polling input
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const availableNetworkClientIds = Object.values(
    networkConfigurations,
  ).flatMap((networkConfiguration) =>
    networkConfiguration.rpcEndpoints.map(
      (rpcEndpoint) => rpcEndpoint.networkClientId,
    ),
  );
  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: availableNetworkClientIds,
  });
};
export default useAccountTrackerPolling;
