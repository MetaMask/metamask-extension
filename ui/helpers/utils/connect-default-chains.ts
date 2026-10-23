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
  isEip1193CompatibleRequest: boolean;
  isSolanaWalletStandardRequest: boolean;
  isTronWalletAdapterRequest: boolean;
};

/**
 * Returns the chain IDs that should be granted when the user connects a dapp
 * without manually selecting networks on the connect screen.
 * @param options
 * @param options.nonTestNetworkConfigurations - All non-test (mainnet) network configurations.
 * @param options.testNetworkConfigurations - All test network configurations.
 * @param options.globallySelectedNetworkChainId - The currently selected network in the wallet UI.
 * @param options.requestedCaipChainIds - Specific chain IDs requested by the dapp.
 * @param options.alreadyConnectedCaipChainIds - Chain IDs the dapp already has permission to use.
 * @param options.requestedNamespaces - CAIP namespaces requested by the dapp (e.g., "eip155", "solana").
 * @param options.requestedNamespacesWithoutWallet - Requested namespaces excluding the "wallet" namespace.
 * @param options.isEip1193Request - Whether this is a legacy EIP-1193 connection request.
 * @param options.isEip1193CompatibleRequest - Whether this request carries an `eip1193-compatible` session property set by `@metamask/connect-evm`.
 * @param options.isSolanaWalletStandardRequest - Whether this is a Solana Wallet Standard request.
 * @param options.isTronWalletAdapterRequest - Whether this is a Tron Wallet Adapter request.
 * @returns The CAIP chain IDs to grant by default.
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
  isEip1193CompatibleRequest,
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

  // Return the default selected network list if the request is an EIP-1193
  // request (with no specific chains requested), an EIP-1193 compatible
  // request (a Multichain API request carrying the `eip1193-compatible`
  // session property, set by MetaMask Connect's `@metamask/connect-evm`), a
  // Solana wallet standard request, or a tronWallet library request.
  // Legacy EIP-1193 requests also carry the `eip1193-compatible` session
  // property (it is added by `getCaip25PermissionFromLegacyPermissions`), so
  // the flag only takes the all-networks path for non-legacy requests;
  // otherwise legacy requests with specific chains would lose their
  // requested-chains-only pre-selection.
  if (
    (requestedCaipChainIds.length === 0 && isEip1193Request) ||
    (isEip1193CompatibleRequest && !isEip1193Request) ||
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
