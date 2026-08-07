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
  globallySelectedNetworkChainId: CaipChainId;
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
 * @param options0.globallySelectedNetworkChainId
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
  globallySelectedNetworkChainId,
  requestedCaipChainIds,
  alreadyConnectedCaipChainIds,
  requestedNamespaces,
  requestedNamespacesWithoutWallet,
  isEip1193Request,
  isSolanaWalletStandardRequest,
  isTronWalletAdapterRequest,
}: GetDefaultConnectChainIdsParams): CaipChainId[] {
  const allNetworksList = new Set(
    [...nonTestNetworkConfigurations, ...testNetworkConfigurations].map(
      ({ caipChainId }) => caipChainId,
    ),
  );

  // If globally selected network is a test network, include that in the default
  // selected networks for connection request
  const globallySelectedTestNetwork = testNetworkConfigurations.find(
    (network) => network.caipChainId === globallySelectedNetworkChainId,
  );

  const defaultSelectedNetworkList = globallySelectedTestNetwork
    ? [...nonTestNetworkConfigurations, globallySelectedTestNetwork].map(
        ({ caipChainId }) => caipChainId,
      )
    : nonTestNetworkConfigurations.map(({ caipChainId }) => caipChainId);

  // If the request is an EIP-1193 request (with no specific chains requested),
  // a Solana wallet standard or a tronWallet library request, return early with
  // the default selected network list
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
        allNetworksList.has(requestedCaipChainId),
      ),
      ...additionalChains,
    ]),
  );

  // if we have specifically requested chains, return the supported requested chains plus the already connected chains
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
