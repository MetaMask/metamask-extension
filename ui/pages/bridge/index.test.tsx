import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { PREPARE_SWAP_ROUTE } from '../../helpers/constants/routes';
import { setBackgroundConnection } from '../../store/background-connection';
import CrossChainSwap from '.';

const mockResetBridgeState = jest.fn();
const middleware = [thunk];
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
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({
      pathname: '/cross-chain/swaps/prepare-swap-page',
      search: '',
      hash: '',
      state: null,
    }),
  };
});

describe('Bridge', () => {
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
