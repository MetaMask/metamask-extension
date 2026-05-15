import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  staticAssetsStartPolling,
  staticAssetsStopPollingByPollingToken,
} from '../store/actions';
import { getEnabledChainIds } from '../selectors/multichain/networks';
import {
  getSelectedAccountGroup,
  getInternalAccountsFromGroupById,
} from '../selectors/multichain-accounts/account-tree';
import useMultiPolling from './useMultiPolling';

/**
 * This hook is used to poll the static tokens for the selected account and chain ids.
 *
 * @returns An empty object.
 */
export const useStaticTokensPolling = () => {
  const enabledChainIds = useSelector(getEnabledChainIds);
  const selectedGroupId = useSelector(getSelectedAccountGroup);
  const evmAccount = useSelector((state) =>
    getInternalAccountsFromGroupById(state, selectedGroupId)?.find((a) =>
      isEvmAccountType(a.type),
    ),
  );

  useMultiPolling({
    startPolling: staticAssetsStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: staticAssetsStopPollingByPollingToken,
    input: [
      {
        chainIds: enabledChainIds ?? [],
        selectedAccountAddress: evmAccount?.address ?? '',
        selectedAccountId: evmAccount?.id ?? '',
      },
    ],
  });

  return {};
};

export default useStaticTokensPolling;
