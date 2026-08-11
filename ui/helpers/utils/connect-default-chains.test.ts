import { KnownCaipNamespace } from '@metamask/utils';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../selectors/selectors.types';
import { getDefaultConnectChainIds } from './connect-default-chains';

const ethMainnet = {
  caipChainId: 'eip155:1',
  chainId: 'eip155:1',
  name: 'Ethereum Mainnet',
} as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId;

const polygon = {
  caipChainId: 'eip155:137',
  chainId: 'eip155:137',
  name: 'Polygon Mainnet',
} as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId;

const sepolia = {
  caipChainId: 'eip155:11155111',
  chainId: 'eip155:11155111',
  name: 'Sepolia Testnet',
} as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId;

const solana = {
  caipChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  name: 'Solana Mainnet',
} as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId;

const tron = {
  caipChainId: MultichainNetworks.TRON,
  chainId: MultichainNetworks.TRON,
  name: 'Tron Mainnet',
} as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId;

const bsc = {
  caipChainId: 'eip155:56',
  chainId: 'eip155:56',
  name: 'BNB Smart Chain',
} as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId;

describe('getDefaultConnectChainIds', () => {
  const baseParams = {
    nonTestNetworkConfigurations: [ethMainnet, polygon, solana],
    testNetworkConfigurations: [sepolia],
    globallySelectedNetworkChainId: ethMainnet.caipChainId,
    requestedCaipChainIds: [] as (typeof ethMainnet.caipChainId)[],
    alreadyConnectedCaipChainIds: [] as (typeof ethMainnet.caipChainId)[],
    requestedNamespaces: [KnownCaipNamespace.Eip155] as KnownCaipNamespace[],
    requestedNamespacesWithoutWallet: [
      KnownCaipNamespace.Eip155,
    ] as KnownCaipNamespace[],
    isEip1193Request: false,
    isEip1193CompatibleRequest: false,
    isSolanaWalletStandardRequest: false,
    isTronWalletAdapterRequest: false,
  };

  it('returns all default networks for EIP-1193 requests with no specific chains', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      isEip1193Request: true,
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      solana.caipChainId,
    ]);
  });

  it('returns all default networks for Solana wallet standard requests', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      requestedCaipChainIds: [solana.caipChainId],
      isSolanaWalletStandardRequest: true,
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      solana.caipChainId,
    ]);
  });

  it('returns all default networks for Tron wallet adapter requests', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [ethMainnet, tron],
      requestedCaipChainIds: [tron.caipChainId],
      isTronWalletAdapterRequest: true,
    });

    expect(result).toEqual([ethMainnet.caipChainId, tron.caipChainId]);
  });

  it('returns only specifically requested supported chains for EIP-1193 requests', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [polygon],
      testNetworkConfigurations: [],
      requestedCaipChainIds: [polygon.caipChainId],
      isEip1193Request: true,
    });

    expect(result).toEqual([polygon.caipChainId]);
  });

  it('merges supported requested chains with already connected chains', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [ethMainnet, polygon, bsc],
      testNetworkConfigurations: [],
      requestedCaipChainIds: [ethMainnet.caipChainId, polygon.caipChainId],
      alreadyConnectedCaipChainIds: [ethMainnet.caipChainId, bsc.caipChainId],
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      bsc.caipChainId,
    ]);
  });

  it('filters default networks by requested namespaces when no specific chains are requested', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      requestedNamespaces: [
        KnownCaipNamespace.Eip155,
        KnownCaipNamespace.Solana,
      ],
      requestedNamespacesWithoutWallet: [
        KnownCaipNamespace.Eip155,
        KnownCaipNamespace.Solana,
      ],
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      solana.caipChainId,
    ]);
  });

  it('includes the selected test network when the global network is a testnet', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      globallySelectedNetworkChainId: sepolia.caipChainId,
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      sepolia.caipChainId,
    ]);
  });

  it('filters out unsupported requested chain IDs', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [ethMainnet],
      testNetworkConfigurations: [],
      requestedCaipChainIds: [
        ethMainnet.caipChainId,
        'eip155:999999' as typeof ethMainnet.caipChainId,
        'unsupported:chain' as typeof ethMainnet.caipChainId,
      ],
    });

    expect(result).toEqual([ethMainnet.caipChainId]);
  });

  it('filters wallet namespace from requested chain IDs', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [ethMainnet],
      testNetworkConfigurations: [],
      requestedCaipChainIds: [
        ethMainnet.caipChainId,
        'wallet:1' as typeof ethMainnet.caipChainId,
      ],
    });

    expect(result).toEqual([ethMainnet.caipChainId]);
  });

  it('deduplicates chain IDs when merging requested and existing chains', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [ethMainnet, polygon, bsc],
      testNetworkConfigurations: [],
      requestedCaipChainIds: [ethMainnet.caipChainId, polygon.caipChainId],
      alreadyConnectedCaipChainIds: [ethMainnet.caipChainId, bsc.caipChainId],
    });

    expect(result.filter((id) => id === ethMainnet.caipChainId)).toHaveLength(
      1,
    );
  });

  it('does not treat Solana session properties alone as a wallet standard request', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      requestedCaipChainIds: [solana.caipChainId],
      isSolanaWalletStandardRequest: false,
      requestedNamespaces: [KnownCaipNamespace.Solana],
      requestedNamespacesWithoutWallet: [KnownCaipNamespace.Solana],
    });

    expect(result).toEqual([solana.caipChainId]);
  });

  it('ignores unrelated session properties for Tron detection', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      nonTestNetworkConfigurations: [ethMainnet, tron],
      requestedCaipChainIds: [tron.caipChainId],
      isTronWalletAdapterRequest: false,
      requestedNamespaces: [KnownCaipNamespace.Tron],
      requestedNamespacesWithoutWallet: [KnownCaipNamespace.Tron],
    });

    expect(result).toEqual([tron.caipChainId]);
  });

  it('returns all default networks for EIP-1193 compatible requests even when specific chains are requested', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      requestedCaipChainIds: [ethMainnet.caipChainId, polygon.caipChainId],
      isEip1193CompatibleRequest: true,
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      solana.caipChainId,
    ]);
  });

  it('keeps only the requested chains for legacy EIP-1193 requests with specific chains even though they carry the eip1193-compatible session property', () => {
    // Legacy EIP-1193 requests are also tagged with the `eip1193-compatible`
    // session property by `getCaip25PermissionFromLegacyPermissions`, but
    // specific-chain requests (e.g. `wallet_requestPermissions` with
    // `endowment:permitted-chains`) must not take the all-networks path.
    const result = getDefaultConnectChainIds({
      ...baseParams,
      requestedCaipChainIds: [polygon.caipChainId],
      isEip1193Request: true,
      isEip1193CompatibleRequest: true,
    });

    expect(result).toEqual([polygon.caipChainId]);
  });

  it('returns all default networks for legacy EIP-1193 requests with no specific chains and the eip1193-compatible session property', () => {
    const result = getDefaultConnectChainIds({
      ...baseParams,
      requestedCaipChainIds: [],
      isEip1193Request: true,
      isEip1193CompatibleRequest: true,
    });

    expect(result).toEqual([
      ethMainnet.caipChainId,
      polygon.caipChainId,
      solana.caipChainId,
    ]);
  });
});
