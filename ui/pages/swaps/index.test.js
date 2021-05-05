import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { waitFor } from '@testing-library/react';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
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
});

describe('Swap', () => {
  let tokensNock;

  beforeEach(() => {
    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/topAssets')
      .reply(200, MOCKS.TOP_ASSETS_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/refreshTime')
      .reply(200, MOCKS.REFRESH_TIME_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/aggregatorMetadata')
      .reply(200, MOCKS.AGGREGATOR_METADATA_GET_RESPONSE);

    nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/gasPrices')
      .reply(200, MOCKS.GAS_PRICES_GET_RESPONSE);

    tokensNock = nock(CONSTANTS.METASWAP_BASE_URL)
      .get('/tokens')
      .reply(200, MOCKS.TOKENS_GET_RESPONSE);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('renders the component with initial props', async () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { container, getByText } = renderWithProvider(<Swap />, store);
    await waitFor(() => expect(tokensNock.isDone()).toBe(true));
    expect(getByText('Swap')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
