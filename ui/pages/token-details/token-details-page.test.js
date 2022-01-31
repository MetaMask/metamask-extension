import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { mountWithRouter } from '../../../test/lib/render-helpers';
import TokenDetailsPage from './token-details-page';

describe('TokenDetailsPage', () => {
  it('should render token details page', () => {
    const state = {
      metamask: {
        selectedAddress: '0xAddress',
        contractExchangeRates: {
          '0xAnotherToken': 0.015,
        },
        provider: {
          type: 'test',
          nickname: 'testNetwork',
        },
        preferences: {
          showFiatInTestnets: true,
        },
        tokens: [
          {
            address: '0xaD6D458402F60fD3Bd25163575031ACDce07538A',
            symbol: 'DAA',
            decimals: 18,
            image: null,
            isERC721: false,
          },
          {
            address: '0xaD6D458402F60fD3Bd25163575031ACDce07538U',
            symbol: 'DAU',
            decimals: 18,
            image: null,
            isERC721: false,
          },
        ],
      },
      send: {
        asset: {
          balance: '0x0',
          type: 'TOKEN',
          details: {
            address: '0xaD6D458402F60fD3Bd25163575031ACDce07538A',
            decimals: 18,
            image: null,
            isERC721: false,
            symbol: 'DAI',
          },
        },
      },
      token: {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
        image: './images/eth_logo.svg',
        isERC721: false,
        symbol: 'ETH',
      },
    };

    const store = configureMockStore()(state);
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <TokenDetailsPage />
      </Provider>,
      store,
    );

    expect(wrapper).toHaveLength(1);
  });
});
