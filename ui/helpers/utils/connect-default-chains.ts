import {
  CaipChainId,
  CaipNamespace,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../selectors/selectors.types';

export type GetDefaultConnectChainIdsParams = {
  nonTestNetworkConfigurations: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworkConfigurations: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  currentlySelectedNetworkChainId: CaipChainId;
  requestedCaipChainIds: CaipChainId[];
  alreadyConnectedCaipChainIds: CaipChainId[];
  requestedNamespaces: CaipNamespace[];
  requestedNamespacesWithoutWallet: CaipNamespace[];
  isEip1193Request?: boolean;
  isSolanaWalletStandardRequest: boolean;
  isTronWalletAdapterRequest: boolean;
};

/**
 * Returns the chain IDs that should be granted when the user connects a dapp
 * without manually selecting networks on the connect screen.
 * @param options0
 * @param options0.nonTestNetworkConfigurations
 * @param options0.testNetworkConfigurations
 * @param options0.currentlySelectedNetworkChainId
 * @param options0.requestedCaipChainIds
 * @param options0.alreadyConnectedCaipChainIds
 * @param options0.requestedNamespaces
 * @param options0.requestedNamespacesWithoutWallet
 * @param options0.isEip1193Request
 * @param options0.isSolanaWalletStandardRequest
 * @param options0.isTronWalletAdapterRequest
 */
export function getDefaultConnectChainIds({
  nonTestNetworkConfigurations,
  testNetworkConfigurations,
  currentlySelectedNetworkChainId,
  requestedCaipChainIds,
  alreadyConnectedCaipChainIds,
  requestedNamespaces,
  requestedNamespacesWithoutWallet,
  isEip1193Request,
  isSolanaWalletStandardRequest,
  isTronWalletAdapterRequest,
}: GetDefaultConnectChainIdsParams): CaipChainId[] {
  const allNetworksList = [
    ...nonTestNetworkConfigurations,
    ...testNetworkConfigurations,
  ].map(({ caipChainId }) => caipChainId);

  const selectedNetworkIsTestNetwork = testNetworkConfigurations.find(
    (network) => network.caipChainId === currentlySelectedNetworkChainId,
  );

  const defaultSelectedNetworkList = selectedNetworkIsTestNetwork
    ? [...nonTestNetworkConfigurations, selectedNetworkIsTestNetwork].map(
        ({ caipChainId }) => caipChainId,
      )
    : nonTestNetworkConfigurations.map(({ caipChainId }) => caipChainId);

  if (
    (requestedCaipChainIds.length === 0 && isEip1193Request) ||
    isSolanaWalletStandardRequest ||
    isTronWalletAdapterRequest
  ) {
    return defaultSelectedNetworkList;
  }

  const walletRequest = requestedCaipChainIds.some((caipChainId) => {
    try {
      return (
        parseCaipChainId(caipChainId).namespace === KnownCaipNamespace.Wallet
      );
    } catch {
      return false;
    }
  });

  let additionalChains: CaipChainId[] = [];
  if (walletRequest && isEip1193Request) {
    additionalChains = nonTestNetworkConfigurations
      .map(({ caipChainId }) => caipChainId)
      .filter((caipChainId) =>
        requestedNamespacesWithoutWallet.includes(
          parseCaipChainId(caipChainId).namespace,
        ),
      );
  }

  const supportedRequestedCaipChainIds = Array.from(
    new Set([
      ...requestedCaipChainIds.filter((requestedCaipChainId) =>
        allNetworksList.includes(requestedCaipChainId),
      ),
      ...additionalChains,
    ]),
  );

  if (supportedRequestedCaipChainIds.length > 0) {
    return Array.from(
      new Set([
        ...supportedRequestedCaipChainIds,
        ...alreadyConnectedCaipChainIds,
      ]),
    );
  }

  if (requestedNamespaces.length > 0) {
    return Array.from(
      new Set(
        defaultSelectedNetworkList.filter((caipChainId) => {
          const { namespace } = parseCaipChainId(caipChainId);
          return requestedNamespaces.includes(namespace);
        }),
      ),
    );
  }

  return defaultSelectedNetworkList;
}
