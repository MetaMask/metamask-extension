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
        useTokenDetection: true,
        tokenList: {
          '0x6b175474e89094c44da98b954eedeac495271d0f': {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'META',
            decimals: 18,
            image: 'metamark.svg',
            unlisted: false,
          },
          '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': {
            address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
            symbol: '0X',
            decimals: 18,
            image: '0x.svg',
            unlisted: false,
          },
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            symbol: 'AST',
            decimals: 18,
            image: 'ast.png',
            unlisted: false,
          },
          '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
            address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            symbol: 'BAT',
            decimals: 18,
            image: 'BAT_icon.svg',
            unlisted: false,
          },
          '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1': {
            address: '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1',
            symbol: 'CVL',
            decimals: 18,
            image: 'CVL_token.svg',
            unlisted: false,
          },
          '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': {
            address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
            symbol: 'GLA',
            decimals: 18,
            image: 'gladius.svg',
            unlisted: false,
          },
          '0x467Bccd9d29f223BcE8043b84E8C8B282827790F': {
            address: '0x467Bccd9d29f223BcE8043b84E8C8B282827790F',
            symbol: 'GNO',
            decimals: 18,
            image: 'gnosis.svg',
            unlisted: false,
          },
          '0xff20817765cb7f73d4bde2e66e067e58d11095c2': {
            address: '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
            symbol: 'OMG',
            decimals: 18,
            image: 'omg.jpg',
            unlisted: false,
          },
          '0x8e870d67f660d95d5be530380d0ec0bd388289e1': {
            address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
            symbol: 'WED',
            decimals: 18,
            image: 'wed.png',
            unlisted: false,
          },
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
