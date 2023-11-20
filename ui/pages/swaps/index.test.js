import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { waitFor } from '@testing-library/react';

import { setBackgroundConnection } from '../../store/background-connection';
import {
  renderWithProvider,
  createSwapsMockStore,
  MOCKS,
  CONSTANTS,
} from '../../../test/jest';
import Swap from '.';

const middleware = [thunk];

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  resetSwapsState: jest.fn(),
  setSwapsLiveness: jest.fn(() => true),
  setSwapsTokens: jest.fn(),
  setSwapsTxGasPrice: jest.fn(),
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
});

describe('Swap', () => {
  let featureFlagsNock;

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

    featureFlagsNock = nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/featureFlags')
      .reply(200, MOCKS.createFeatureFlagsResponse());
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('renders the component with initial props', async () => {
    const swapsMockStore = createSwapsMockStore();
    swapsMockStore.metamask.swapsState.swapsFeatureFlags.swapRedesign.extensionActive = false;
    const store = configureMockStore(middleware)(swapsMockStore);
    const { container, getByText } = renderWithProvider(<Swap />, store);
    await waitFor(() => expect(featureFlagsNock.isDone()).toBe(true));
    expect(getByText('Swap')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
