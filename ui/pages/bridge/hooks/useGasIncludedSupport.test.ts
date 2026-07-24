import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useGasIncludedSupport } from './useGasIncludedSupport';
import {
  ChainId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
  isNonEvmChainId,
  isSolanaChainId,
  type BridgeAppState,
} from '@metamask/bridge-controller';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import * as bridgeSelectors from '../../../ducks/bridge/selectors';
import * as sharedKeyringSelectors from '../../../../shared/lib/selectors/keyring';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../../shared/constants/bridge';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import * as smartTransactionsSelectors from '../../../../shared/lib/selectors/smart-transactions';
import { setBackgroundConnection } from '../../../store/background-connection';
import * as sentinelApi from '../../../../app/scripts/lib/transaction/sentinel-api';
import {
  parseCaipAssetType,
  parseCaipChainId,
  type CaipChainId,
} from '@metamask/utils';

const MOCK_NETWORK_FLAGS = {
  // sendBundle and relay
  1: {
    name: 'Mainnet',
    group: 'ethereum',
    chainID: 1,
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    network: 'ethereum-mainnet',
    explorer: 'https://etherscan.io',
    confirmations: true,
    smartTransactions: true,
    relayTransactions: true,
    hidden: false,
    sendBundle: true,
    simulationIncludeFees: true,
  },
  // simulationIncludeFees only
  10: {
    name: 'Optimism Mainnet',
    group: 'optimism',
    chainID: 10,
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    network: 'optimism-mainnet',
    explorer: 'https://optimistic.etherscan.io',
    confirmations: true,
    smartTransactions: false,
    relayTransactions: false,
    hidden: false,
    sendBundle: false,
    simulationIncludeFees: true,
  },
  // relay and stx only
  137: {
    name: 'Polygon Mainnet',
    group: 'polygon',
    chainID: 137,
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    network: 'polygon-mainnet',
    explorer: 'https://polygonscan.com/',
    confirmations: true,
    smartTransactions: true,
    relayTransactions: true,
    hidden: false,
    sendBundle: false,
    simulationIncludeFees: true,
  },
  // relay only (sponsorship, no STX)
  143: {
    name: 'Monad Mainnet',
    group: 'monad',
    chainID: 143,
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    network: 'monad-mainnet',
    explorer: 'https://mainnet-beta.monvision.io',
    confirmations: true,
    smartTransactions: false,
    relayTransactions: true,
    hidden: false,
    sendBundle: false,
    simulationIncludeFees: true,
  },
};

const renderUseGasIncludedSupport = (state?: Partial<BridgeAppState>) => {
  return renderHookWithProvider(
    () => useGasIncludedSupport(),
    state ?? createBridgeMockStore(),
  );
};

// @ts-expect-error - describe.each is a function
describe.each([
  {
    toChainId: undefined,
    description: 'SWAP',
  },
  // Bridge to Arbitrum USDC
  { toChainId: 'eip155:42161', description: 'BRIDGE' },
])(
  '',
  ({
    toChainId,
    description: actionType,
  }: {
    toChainId?: CaipChainId;
    description: string;
  }) => {
    // @ts-expect-error - describe.each is a function
    describe.each(
      [
        [
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:10'],
          getNativeAssetForChainId(10),
        ].map((token) => ({
          fromToken: token,
          description: 'Sentinel only supports SIMULATION_INCLUDE_FEES',
        })),
        [
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:1'],
          getNativeAssetForChainId(1),
        ].map((token) => ({
          fromToken: token,
          description:
            'Sentinel supports RELAY, STX, SEND_BUNDLE and SIMULATION_INCLUDE_FEES',
        })),
        [
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:137'],
          getNativeAssetForChainId(137),
        ].map((token) => ({
          fromToken: token,
          description: 'Sentinel only supports RELAY, STX',
        })),
        [
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:143'],
          getNativeAssetForChainId(143),
        ].map((token) => ({
          fromToken: token,
          description: 'Sentinel only supports RELAY',
        })),
        [
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR[formatChainIdToCaip(ChainId.SOLANA)],
          getNativeAssetForChainId(ChainId.SOLANA),
        ].map((token) => ({
          fromToken: token,
          description: 'Sentinel supports gasIncluded=true',
        })),
        [
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR[formatChainIdToCaip(ChainId.TRON)],
          getNativeAssetForChainId(ChainId.TRON),
        ].map((token) => ({
          fromToken: token,
          description: 'no gasless support for other non-EVM networks',
        })),
      ]
        .flat()
        .map((tokenInfo) => ({
          ...tokenInfo,
          description: ` (${isNativeAddress(tokenInfo?.fromToken?.assetId ?? '') ? 'NATIVE, ' : ''}${tokenInfo?.fromToken?.assetId ? parseCaipAssetType(tokenInfo.fromToken.assetId).chainId : ''}). ${tokenInfo.description}.`,
        })),
    )(
      `[${actionType}] useGasIncludedSupport returns the correct gasless request params` +
        '$description.',
      ({ fromToken }: { fromToken: BridgeToken; description: string }) => {
        let getSentinelNetworkFlagsSpy: jest.SpyInstance;

        beforeEach(() => {
          jest.clearAllMocks();
        });

        afterEach(() => {
          jest.restoreAllMocks();
        });

        // @ts-expect-error - describe.each is a function
        describe.each([false, true])(
          'Client settings:',
          (stxEnabled: boolean) => {
            // @ts-expect-error - describe.each is a function
            describe.each([false, true])(
              stxEnabled ? 'STX ON,' : 'STX OFF,',
              (gasless7702Bridge: boolean) => {
                // @ts-expect-error - it.each is a function
                describe.each([false, true])(
                  gasless7702Bridge
                    ? 'gasless7702Bridge ON'
                    : 'gasless7702Bridge OFF',
                  (isUsingHardwareWallet: boolean) => {
                    it(
                      isUsingHardwareWallet ? 'and using a HW' : '',
                      async () => {
                        const validFromToken = toBridgeToken(fromToken);
                        const fromChainId = parseCaipChainId(
                          validFromToken.chainId,
                        ).reference;
                        const validToChainId =
                          toChainId ?? validFromToken.chainId;

                        // Mock selectors and utils
                        jest
                          .spyOn(bridgeSelectors, 'getIsStxEnabled')
                          .mockReturnValue(stxEnabled);
                        jest
                          .spyOn(
                            smartTransactionsSelectors,
                            'getGaslessBridgeWith7702EnabledForChain',
                          )
                          .mockReturnValue(gasless7702Bridge);
                        getSentinelNetworkFlagsSpy = jest
                          .spyOn(sentinelApi, 'getSentinelNetworkFlags')
                          .mockResolvedValue(
                            MOCK_NETWORK_FLAGS[
                              fromChainId as unknown as keyof typeof MOCK_NETWORK_FLAGS
                            ],
                          );
                        jest
                          .spyOn(bridgeSelectors, 'getToChain')
                          .mockReturnValue({
                            chainId: validToChainId,
                            name: 'Mainnet',
                          });
                        jest
                          .spyOn(bridgeSelectors, 'getFromToken')
                          .mockReturnValue(validFromToken);
                        jest
                          .spyOn(sharedKeyringSelectors, 'isHardwareWallet')
                          .mockReturnValue(isUsingHardwareWallet);
                        setBackgroundConnection({
                          getSentinelNetworkFlags: getSentinelNetworkFlagsSpy,
                        } as never);

                        // Render the hook
                        const { result, waitForNextUpdate } =
                          renderUseGasIncludedSupport();

                        await waitFor(async () => {
                          if (!isNonEvmChainId(validFromToken.chainId)) {
                            await waitForNextUpdate();
                          }
                          // HW + 7702 is not supported
                          if (isUsingHardwareWallet) {
                            expect(result.current.gasIncluded7702).toBe(false);
                          }
                          // Solana always sets gasIncluded=true
                          else if (isSolanaChainId(validFromToken.chainId)) {
                            expect(result.current).toStrictEqual({
                              gasIncluded: true,
                              gasIncluded7702: false,
                              nativeGasIncluded: undefined,
                            });
                          }
                          // Other non-EVM networks have no gasless support
                          else if (isNonEvmChainId(validFromToken.chainId)) {
                            expect(result.current).toStrictEqual({
                              gasIncluded: false,
                              gasIncluded7702: false,
                              nativeGasIncluded: undefined,
                            });
                          }
                          // Gasless bridge requires the feature flag to be enabled
                          else if (
                            actionType === 'BRIDGE' &&
                            !gasless7702Bridge &&
                            !stxEnabled
                          ) {
                            expect(result.current).toStrictEqual({
                              gasIncluded: false, //gasless7702Bridge,
                              gasIncluded7702: false, //gasless7702Bridge,
                              nativeGasIncluded: isNativeAddress(
                                validFromToken.assetId,
                              )
                                ? true
                                : undefined,
                            });
                          } else {
                            expect(result.current).toMatchSnapshot();
                          }
                        });
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  },
);
