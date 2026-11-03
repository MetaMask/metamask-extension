import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import {
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  ConnectionStatus,
  HardwareConnectionPermissionState,
  HardwareWalletProvider,
} from '../../contexts/hardware-wallets';
import * as bridgeActions from '../../ducks/bridge/actions';
import CrossChainSwap from '.';

const mockResetBridgeStore = jest.spyOn(bridgeActions, 'resetInputFields');
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

const mockShowErrorModal = jest.fn();

jest.mock(
  '../../contexts/hardware-wallets/HardwareWalletErrorProvider',
  () => ({
    ...jest.requireActual(
      '../../contexts/hardware-wallets/HardwareWalletErrorProvider',
    ),
    useHardwareWalletError: () => ({
      showErrorModal: mockShowErrorModal,
      dismissErrorModal: jest.fn(),
      isErrorModalVisible: false,
      setErrorModalSuppressed: jest.fn(),
    }),
  }),
);

jest.mock('../../hooks/bridge/usePopularTokens', () => ({
  usePopularTokens: jest.fn().mockReturnValue({
    popularTokensList: [],
    isLoading: false,
  }),
}));

jest.mock('../../hooks/bridge/useTokenSearchResults', () => ({
  useTokenSearchResults: jest.fn().mockReturnValue({
    searchResults: [],
    isSearchResultsLoading: false,
  }),
}));

const messengerCallMock = jest.fn((actionType: string) => {
  switch (actionType) {
    case 'BridgeController:resetState':
      return Promise.resolve(mockResetBridgeState());
    case 'NetworkController:getNetworkConfigurationByNetworkClientId':
      return Promise.resolve({ chainId: '0x1' });
    case 'LegacyBackgroundApiService:isRelaySupported':
    case 'LegacyBackgroundApiService:isSendBundleSupported':
      return Promise.resolve(true);
    default:
      return Promise.resolve(undefined);
  }
});

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  getStatePatches: jest.fn(),
  messengerCall: messengerCallMock,
  resetSwapsState: jest.fn(),
  setSwapsLiveness: jest.fn(() => true),
  setSwapsTokens: jest.fn(),
  setSwapsTxGasPrice: jest.fn(),
  gasFeeStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  selectSrcNetwork: jest.fn(),
} as never);

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
const mockBridgePreparePath = '/cross-chain/swaps/prepare-bridge-page';
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const directOpenLocation = {
  pathname: mockBridgePreparePath,
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

describe('Bridge', () => {
  beforeEach(() => {
    mockUseNavigate.mockReset();
    mockResetBridgeState.mockClear();
    mockUseLocation.mockReturnValue(directOpenLocation);
    mockUseHardwareWalletConfig.mockReturnValue({
      isHardwareWalletAccount: false,
      walletType: null,
      hardwareConnectionPermissionState:
        HardwareConnectionPermissionState.Unknown,
      isWebHidAvailable: false,
      isWebUsbAvailable: false,
    });
    mockUseHardwareWalletActions.mockReturnValue({
      ensureDeviceReadyOrError: jest.fn().mockResolvedValue(null),
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
      <HardwareWalletProvider>
        <CrossChainSwap />
      </HardwareWalletProvider>,
      store,
      PREPARE_SWAP_ROUTE,
    );

    expect(getByText(messages.swap.message)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
    expect(mockResetBridgeStore).toHaveBeenCalledTimes(0);
    expect(mockResetBridgeState).toHaveBeenCalledTimes(0);
  });

  it('resets the bridge store and state when the Back button is clicked', async () => {
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

    const { getByRole } = renderWithProvider(
      <HardwareWalletProvider>
        <CrossChainSwap />
      </HardwareWalletProvider>,
      store,
      PREPARE_SWAP_ROUTE,
    );

    const backButton = getByRole('button', { name: messages.back.message });
    await act(async () => {
      fireEvent.click(backButton);
    });
    expect(mockResetBridgeStore).toHaveBeenCalledTimes(0);
    expect(mockResetBridgeState).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      state: {
        bridgeState: null,
        token: null,
        stayOnHomePage: true,
      },
    });
  });

  it('returns to the previous page when Swap was opened in-app', async () => {
    mockUseLocation.mockReturnValue({
      ...directOpenLocation,
      key: 'token-details',
    });

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

    const { getByRole } = renderWithProvider(
      <HardwareWalletProvider>
        <CrossChainSwap />
      </HardwareWalletProvider>,
      store,
      PREPARE_SWAP_ROUTE,
    );

    const backButton = getByRole('button', { name: messages.back.message });
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    expect(mockResetBridgeState).toHaveBeenCalledTimes(1);
  });
});
