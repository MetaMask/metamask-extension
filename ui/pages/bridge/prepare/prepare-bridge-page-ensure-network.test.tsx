import React from 'react';
import type { Provider } from '@metamask/network-controller';
import { act } from '@testing-library/react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import type { CaipAssetType } from '@metamask/utils';
import * as reactRouterUtils from 'react-router-dom';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createTestProviderTools } from '../../../../test/stub/provider';
import { setBackgroundConnection } from '../../../store/background-connection';
import {
  ConnectionStatus,
  HardwareConnectionPermissionState,
  HardwareWalletProvider,
} from '../../../contexts/hardware-wallets';
import type { BridgeToken } from '../../../ducks/bridge/types';
import PrepareBridgePage from './prepare-bridge-page';

jest.mock('../hooks/useGasIncluded7702', () => ({
  useGasIncluded7702: jest.fn().mockReturnValue(false),
}));

jest.mock('../hooks/useIsSendBundleSupported', () => ({
  useIsSendBundleSupported: jest.fn().mockReturnValue(false),
}));

const mockEnsureNetworkEnabled = jest.fn().mockResolvedValue(undefined);
jest.mock('../hooks/useEnsureNetworkEnabled', () => ({
  useEnsureNetworkEnabled: () => mockEnsureNetworkEnabled,
}));

const mockSetFromToken = jest.fn();
const mockSetToToken = jest.fn();
jest.mock('../../../ducks/bridge/actions', () => ({
  ...jest.requireActual('../../../ducks/bridge/actions'),
  setFromToken: (...args: unknown[]) => {
    mockSetFromToken(...args);
    return { type: 'NOOP' };
  },
  setToToken: (...args: unknown[]) => {
    mockSetToToken(...args);
    return { type: 'NOOP' };
  },
}));

const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletState = jest.fn();

jest.mock('../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../contexts/hardware-wallets'),
  useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
  useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));

const capturedInputGroups: {
  onAssetChange?: (token: BridgeToken) => void;
  isDestination?: boolean;
}[] = [];

jest.mock('./bridge-input-group', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BridgeInputGroup: (props: any) => {
    capturedInputGroups.push(props);
    return (
      <div data-testid={props.isDestination ? 'dest-group' : 'src-group'} />
    );
  },
}));

setBackgroundConnection({
  resetState: async () => jest.fn(),
  getStatePatches: async () => jest.fn(),
  updateBridgeQuoteRequestParams: async () => jest.fn(),
} as never);

describe('PrepareBridgePage ensureNetworkEnabled integration', () => {
  beforeAll(() => {
    const { provider } = createTestProviderTools({
      networkId: 'Ethereum',
      chainId: CHAIN_IDS.MAINNET,
    });

    global.ethereumProvider = provider as unknown as Provider;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedInputGroups.length = 0;
    mockUseHardwareWalletConfig.mockReturnValue({
      isHardwareWalletAccount: false,
      walletType: null,
      hardwareConnectionPermissionState:
        HardwareConnectionPermissionState.Unknown,
      isWebHidAvailable: false,
      isWebUsbAvailable: false,
    });
    mockUseHardwareWalletActions.mockReturnValue({
      ensureDeviceReady: jest.fn().mockResolvedValue(true),
    });
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });
  });

  const polygonChainId = formatChainIdToCaip(CHAIN_IDS.POLYGON);
  const polygonToken: BridgeToken = {
    symbol: 'POL',
    name: 'POL',
    decimals: 18,
    chainId: polygonChainId,
    assetId: toAssetId(
      '0x0000000000000000000000000000000000000000',
      polygonChainId,
    ) as CaipAssetType,
    balance: '0',
  };

  function renderPage() {
    jest
      .spyOn(reactRouterUtils, 'useSearchParams')
      .mockReturnValue([{ get: () => null }] as never);

    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
            [CHAIN_IDS.POLYGON]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON) },
          ],
        },
      },
    });

    return renderWithProvider(
      <HardwareWalletProvider>
        <PrepareBridgePage onOpenSettings={jest.fn()} />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );
  }

  it('calls ensureNetworkEnabled when selecting a source token from an unconfigured chain', async () => {
    renderPage();

    const srcGroup = capturedInputGroups.find((p) => !p.isDestination);
    expect(srcGroup?.onAssetChange).toBeDefined();

    await act(async () => {
      srcGroup?.onAssetChange?.(polygonToken);
    });

    expect(mockEnsureNetworkEnabled).toHaveBeenCalledTimes(1);
    expect(mockEnsureNetworkEnabled).toHaveBeenCalledWith(polygonChainId);
  });

  it('calls ensureNetworkEnabled when selecting a destination token from an unconfigured chain', async () => {
    renderPage();

    const destGroup = capturedInputGroups.find((p) => p.isDestination);
    expect(destGroup?.onAssetChange).toBeDefined();

    await act(async () => {
      destGroup?.onAssetChange?.(polygonToken);
    });

    expect(mockEnsureNetworkEnabled).toHaveBeenCalledTimes(1);
    expect(mockEnsureNetworkEnabled).toHaveBeenCalledWith(polygonChainId);
  });

  it('calls ensureNetworkEnabled with the token chainId for an already-configured chain', async () => {
    renderPage();

    const mainnetChainId = formatChainIdToCaip(CHAIN_IDS.MAINNET);
    const ethToken: BridgeToken = {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      chainId: mainnetChainId,
      assetId: toAssetId(
        '0x0000000000000000000000000000000000000000',
        mainnetChainId,
      ) as CaipAssetType,
      balance: '0',
    };

    const srcGroup = capturedInputGroups.find((p) => !p.isDestination);

    await act(async () => {
      srcGroup?.onAssetChange?.(ethToken);
    });

    expect(mockEnsureNetworkEnabled).toHaveBeenCalledTimes(1);
    expect(mockEnsureNetworkEnabled).toHaveBeenCalledWith(mainnetChainId);
  });
});
