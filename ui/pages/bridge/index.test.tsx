import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { PREPARE_SWAP_ROUTE } from '../../helpers/constants/routes';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  ConnectionStatus,
  HardwareConnectionPermissionState,
} from '../../contexts/hardware-wallets';
import CrossChainSwap from '.';

const mockResetBridgeState = jest.fn();
const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletState = jest.fn();
const middleware = [thunk];

jest.mock('../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../contexts/hardware-wallets'),
  useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
  useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  getStatePatches: jest.fn(),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  resetSwapsState: jest.fn(),
  setSwapsLiveness: jest.fn(() => true),
  setSwapsTokens: jest.fn(),
  setSwapsTxGasPrice: jest.fn(),
  gasFeeStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x1' }),
  trackUnifiedSwapBridgeEvent: jest.fn(),
  selectSrcNetwork: jest.fn(),
  resetState: () => mockResetBridgeState(),
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  isRelaySupported: jest.fn().mockResolvedValue(true),
  isSendBundleSupported: jest.fn().mockResolvedValue(true),
} as never);

const mockUseNavigate = jest.fn();
const mockBridgePreparePath = '/cross-chain/swaps/prepare-bridge-page';
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({
      pathname: mockBridgePreparePath,
      search: '',
      hash: '',
      state: null,
    }),
  };
});

describe('Bridge', () => {
  beforeEach(() => {
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

  it('renders the component with initial props', async () => {
    const bridgeMockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          support: true,
          refreshRate: 5000,
          maxRefreshCount: 5,
          chains: {
            '1': {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        useExternalServices: true,
      },
    });
    const store = configureMockStore(middleware)(bridgeMockStore);

    const { container, getByText } = renderWithProvider(
      <CrossChainSwap />,
      store,
      PREPARE_SWAP_ROUTE,
    );

    expect(getByText('Swap')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
    expect(mockResetBridgeState).toHaveBeenCalledTimes(1);
  });
});
