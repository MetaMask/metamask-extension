import { waitFor } from '@testing-library/react';
import { parseCaipChainId, type CaipChainId } from '@metamask/utils';
import {
  ChainId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  isNativeAddress,
  isNonEvmChainId,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import * as sentinelApi from '../../../../app/scripts/lib/transaction/sentinel-api';
import * as smartTransactionsSelectors from '../../../../shared/lib/selectors/smart-transactions';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import * as sharedKeyringSelectors from '../../../../shared/lib/selectors/keyring';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../../shared/constants/bridge';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import * as bridgeSelectors from '../../../ducks/bridge/selectors';
import { setBackgroundConnection } from '../../../store/background-connection';
import { useGasIncludedSupport } from './useGasIncludedSupport';

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

const renderUseGasIncludedSupport = () => {
  return renderHookWithProvider(
    () => useGasIncludedSupport(),
    createBridgeMockStore(),
  );
};

const SOURCE_CHAINS_TO_TEST = {
  [ChainId.ETH]:
    'Sentinel supports RELAY, STX, SEND_BUNDLE and SIMULATION_INCLUDE_FEES',
  [ChainId.OPTIMISM]: 'Sentinel only supports SIMULATION_INCLUDE_FEES',
  [ChainId.POLYGON]: 'Sentinel only supports RELAY, STX',
  [ChainId.MONAD]: 'Sentinel only supports RELAY',
  [ChainId.SOLANA]: 'Sentinel supports gasIncluded=true',
  [ChainId.TRON]: 'no gasless support for other non-EVM networks',
};
// @ts-expect-error - describe.each is a function
describe.each([
  {
    toChainId: undefined,
    description: 'SWAP',
  },
  // Bridge to Arbitrum (or any network that's not in SOURCE_CHAINS_TO_TEST)
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
      Object.entries(SOURCE_CHAINS_TO_TEST)
        .map(([chainId, description]) => [
          {
            fromToken:
              BRIDGE_CHAINID_COMMON_TOKEN_PAIR[formatChainIdToCaip(chainId)],
            description: ` (${formatChainIdToCaip(chainId)}). ${description}.`,
          },
          {
            fromToken: getNativeAssetForChainId(chainId),
            description: ` (NATIVE, ${formatChainIdToCaip(chainId)}). ${description}.`,
          },
        ])
        .flat(),
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
              `STX ${stxEnabled ? 'ON' : 'OFF'},`,
              (gasless7702Bridge: boolean) => {
                // @ts-expect-error - it.each is a function
                describe.each([false, true])(
                  `gasless7702Bridge ${gasless7702Bridge ? 'ON' : 'OFF'}`,
                  (isUsingHardwareWallet: boolean) => {
                    it(
                      isUsingHardwareWallet ? ', using a hardware wallet' : '',
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
                        });

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
                            gasIncluded: false,
                            gasIncluded7702: false,
                            nativeGasIncluded: isNativeAddress(
                              validFromToken.assetId,
                            )
                              ? true
                              : undefined,
                          });
                        } else {
                          expect(result.current).toMatchSnapshot();
                        }
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
