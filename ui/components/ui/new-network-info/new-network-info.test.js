import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { mountWithRouter, renderWithProvider } from '../../../../test/lib/render-helpers';
import NewNetworkInfo from './new-network-info';
import nock from 'nock';


const fetchWithCache = require('../../../helpers/utils/fetch-with-cache').default;

describe('NewNetworkInfo', () => {
  afterEach(() => {
    nock.cleanAll();
  });
  it('should render new network info popup', () => {
    const state = {
      metamask: {
        provider: {
          ticker: 'ETH',
          nickname: '',
          chainId: '0x1',
          type: 'mainnet',
        },
        useTokenDetection: false,
        nativeCurrency: 'ETH',
      },
    };

    // const f = async () => {
    nock('https://token-api.metaswap.codefi.network/tokens/0x1').get();
        // .reply(200, '{"average": 1}');
  
      // const response = await fetchWithCache(
      //   'https://fetchwithcache.metamask.io/price',
      // );
      // expect(response).toStrictEqual({
      //   average: 1,
      // });

    const store = configureMockStore()(state);

    const wrapper = renderWithProvider(
      <NewNetworkInfo />,
      store,
    );

    expect(wrapper).toHaveLength(1);
  });
});
