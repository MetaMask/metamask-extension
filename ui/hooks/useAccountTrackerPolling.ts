import { useSelector } from 'react-redux';
import { getCurrentChainId } from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = () => {
  // Selectors to determine polling input
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const currentChainId = useSelector(getCurrentChainId);
  const currentNetwork = networkConfigurations[currentChainId];
  const currentRpcEndpoint =
    currentNetwork.rpcEndpoints[currentNetwork.defaultRpcEndpointIndex];

  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const availableNetworkClientIds = Object.values(networkConfigurations).map(
    (networkConfiguration) =>
      networkConfiguration.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex
      ].networkClientId,
  );
  const canStartPolling = completedOnboarding && isUnlocked;
  const portfolioViewNetworks = canStartPolling
    ? availableNetworkClientIds
    : [];
  const nonPortfolioViewNetworks = canStartPolling
    ? [currentRpcEndpoint.networkClientId]
    : [];

  const networkArrayToPollFor = process.env.PORTFOLIO_VIEW
    ? portfolioViewNetworks
    : nonPortfolioViewNetworks;

  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: networkArrayToPollFor,
  });
};

export default useAccountTrackerPolling;
