import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { setBackgroundConnection } from '../../store/background-connection';
import { MOCKS, CONSTANTS } from '../../../test/jest';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { PREPARE_SWAP_ROUTE } from '../../helpers/constants/routes';
import CrossChainSwap from '.';

const mockResetBridgeState = jest.fn();
const middleware = [thunk];
setBackgroundConnection({
  resetPostFetchState: jest.fn(),
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

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
  beforeEach(() => {
    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/networks/1/topAssets')
      .reply(200, MOCKS.TOP_ASSETS_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/refreshTime')
      .reply(200, MOCKS.REFRESH_TIME_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/networks/1/aggregatorMetadata')
      .reply(200, MOCKS.AGGREGATOR_METADATA_GET_RESPONSE);

    nock(CONSTANTS.GAS_API_URL)
      .get('/networks/1/gasPrices')
      .reply(200, MOCKS.GAS_PRICES_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/networks/1/tokens')
      .reply(200, MOCKS.TOKENS_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/networks/1/tokens?includeBlockedTokens=true')
      .reply(200, MOCKS.TOKENS_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/featureFlags')
      .reply(200, MOCKS.createFeatureFlagsResponse());
  });

  afterAll(() => {
    nock.cleanAll();
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
              isActiveDest: false,
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
