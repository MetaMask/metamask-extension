import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';

import { setBackgroundConnection } from '../../store/background-connection';
import { renderWithProvider, MOCKS, CONSTANTS } from '../../../test/jest';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import CrossChainSwap from '.';

const middleware = [thunk];
setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  resetSwapsState: jest.fn(),
  setSwapsLiveness: jest.fn(() => true),
  setSwapsTokens: jest.fn(),
  setSwapsTxGasPrice: jest.fn(),
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x1' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

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
    const swapsMockStore = createBridgeMockStore({ extensionSupport: true });
    swapsMockStore.metamask.swapsState.swapsFeatureFlags.swapRedesign.extensionActive =
      true;
    const store = configureMockStore(middleware)(swapsMockStore);

    const { container, getByText } = renderWithProvider(
      <CrossChainSwap />,
      store,
    );

    expect(getByText('Bridge')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
