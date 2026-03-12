import { useSelector } from 'react-redux';
import {
  staticAssetsStartPolling,
  staticAssetsStopPollingByPollingToken,
} from '../store/actions';
import { getEnabledChainIds } from '../selectors/multichain/networks';
import { getSelectedAccount } from '../selectors';
import useMultiPolling from './useMultiPolling';

/**
 * This hook is used to poll the static tokens for the selected account and chain ids.
 *
 * @returns An empty object.
 */
export const useStaticTokensPolling = () => {
  const enabledChainIds = useSelector(getEnabledChainIds);
  const account = useSelector(getSelectedAccount);

  useMultiPolling({
    startPolling: staticAssetsStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: staticAssetsStopPollingByPollingToken,
    input: [
      {
        chainIds: enabledChainIds ?? [],
        selectedAccountAddress: account?.address ?? '',
      },
    ],
  });

  return {};
};

export default useStaticTokensPolling;
