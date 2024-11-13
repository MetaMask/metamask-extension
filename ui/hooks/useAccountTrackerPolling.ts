import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = () => {
  // Selectors to determine polling input
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const availableNetworkClientIds = Object.values(networkConfigurations).map(
    (networkConfiguration) =>
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ].networkClientId,
  );
  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: completedOnboarding && isUnlocked ? availableNetworkClientIds : [],
  });
};
export default useAccountTrackerPolling;
