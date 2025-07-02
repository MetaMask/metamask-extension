import {
  BRIDGE_PREFERRED_GAS_ESTIMATE,
  getDefaultBridgeControllerState,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE } from '@metamask/bridge-status-controller';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { BridgeAppState } from '../../../ui/ducks/bridge/selectors';
import { createSwapsMockStore } from '../../jest/mock-store';
import { mockNetworkState } from '../../stub/networks';
import { mockTokenData } from './mock-token-data';

export const createBridgeMockStore = ({
  featureFlagOverrides = {},
  bridgeSliceOverrides = {},
  bridgeStateOverrides = {},
  bridgeStatusStateOverrides = {},
  metamaskStateOverrides = {},
}: {
  // featureFlagOverrides?: Partial<BridgeControllerState['bridgeFeatureFlags']>;
  // bridgeSliceOverrides?: Partial<BridgeState>;
  // bridgeStateOverrides?: Partial<BridgeControllerState>;
  // bridgeStatusStateOverrides?: Partial<BridgeStatusState>;
  // metamaskStateOverrides?: Partial<BridgeAppState['metamask']>;
  // TODO replace these with correct types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureFlagOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeSliceOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeStateOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeStatusStateOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskStateOverrides?: Record<string, any>;
} = {}) => {
  const swapsStore = createSwapsMockStore();
  return {
    ...swapsStore,
    // For initial state of dest asset picker
    swaps: {
      ...swapsStore.swaps,
      topAssets: [],
    },
    bridge: {
      toChainId: null,
      sortOrder: 'cost_ascending',
      ...bridgeSliceOverrides,
    },
    localeMessages: { currentLocale: 'es_419' },
    metamask: {
      ...DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
      ...swapsStore.metamask,
      ...mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.LINEA_MAINNET },
      ),
      multichainNetworkConfigurationsByChainId:
        AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      selectedMultichainNetworkChainId: 'eip155:1',
      isEvmSelected: true,
      completedOnboarding: true,
      gasFeeEstimates: {
        estimatedBaseFee: '0.00010456',
        [BRIDGE_PREFERRED_GAS_ESTIMATE]: {
          suggestedMaxFeePerGas: '0.00018456',
          suggestedMaxPriorityFeePerGas: '0.0001',
        },
      },
      currencyRates: {
        ETH: { conversionRate: 2524.25 },
        usd: { conversionRate: 1 },
      },
      marketData: {
        '0x1': {
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
            currency: 'usd',
            price: 2.3,
          },
        },
      },
      slides: [],
      ...mockTokenData,
      ...metamaskStateOverrides,
      ...{
        ...getDefaultBridgeControllerState(),
        remoteFeatureFlags: {
          ...featureFlagOverrides,
          bridgeConfig: {
            minimumVersion: '0.0.0',
            support: false,
            refreshRate: 5000,
            maxRefreshCount: 5,
            ...featureFlagOverrides?.extensionConfig,
            ...featureFlagOverrides?.bridgeConfig,
            chains: {
              [formatChainIdToCaip('0x1')]: {
                isActiveSrc: true,
                isActiveDest: false,
              },
              ...Object.fromEntries(
                Object.entries(
                  featureFlagOverrides?.extensionConfig?.chains ??
                    featureFlagOverrides?.bridgeConfig?.chains ??
                    {},
                ).map(([chainId, config]) => [
                  formatChainIdToCaip(chainId),
                  config,
                ]),
              ),
            },
          },
        },
      },
      ...bridgeStateOverrides,
      ...bridgeStatusStateOverrides,
    },
    send: {
      swapsBlockedTokens: [],
    },
    // TODO fix types
  } as unknown as BridgeAppState;
};
