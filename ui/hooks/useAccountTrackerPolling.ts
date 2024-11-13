import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = () => {
  // Selectors to determine polling input
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const availableNetworkClientIds = Object.values(networkConfigurations).map(
    (networkConfiguration) =>
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ].networkClientId,
  );
  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: completedOnboarding ? availableNetworkClientIds : [],
  });
};
export default useAccountTrackerPolling;
