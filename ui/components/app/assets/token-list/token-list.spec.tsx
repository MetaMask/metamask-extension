import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import TokenList from './token-list';
import TokenCell from '../token-cell';

// Mock the TokenCell component
jest.mock('../token-cell', () => jest.fn(({ symbol }) => <div>{symbol}</div>));

const mockStore = configureMockStore([thunk]);

describe('TokenList Component', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        currentNetwork: { chainId: '0x1' },
        preferences: {
          tokenSortConfig: null,
          tokenNetworkFilter: { '0x1': true },
          privacyMode: false,
          hideZeroBalanceTokens: true,
        },
        selectedAccount: {
          address: '0xAccount',
        },
        selectedAccountTokensAcrossChains: {
          '0x1': [
            {
              address: '0xToken1',
              chainId: '0x1',
              symbol: 'TOKEN1',
              decimals: 18,
              isNative: false,
              image: 'token1.png',
              balance: '1000',
            },
            {
              address: '0xToken2',
              chainId: '0x1',
              symbol: 'TOKEN2',
              decimals: 18,
              isNative: false,
              image: 'token2.png',
              balance: '0', // Zero balance
            },
          ],
          '0x2': [
            {
              address: '0xToken3',
              chainId: '0x2',
              symbol: 'TOKEN3',
              decimals: 18,
              isNative: true,
              image: 'token3.png',
              balance: '500',
            },
          ],
        },
        tokenBalances: {
          '0xAccount': {
            '0x1': '1000',
          },
        },
        nativeBalances: {
          '0x1': '2000',
        },
        marketData: {},
        currencyRates: {},
        showFiatInTestnets: true,
      },
    });
  });

  const renderComponent = (props = {}) => {
    render(
      <Provider store={store}>
        <TokenList onTokenClick={jest.fn()} nativeToken={null} {...props} />
      </Provider>,
    );
  };

  it('renders tokens with non-zero balances', async () => {
    await act(async () => {
      renderComponent();
    });

    // TOKEN1 has a non-zero balance
    expect(screen.getByText('TOKEN1')).toBeInTheDocument();
    // TOKEN2 has a zero balance and should not be rendered
    expect(screen.queryByText('TOKEN2')).not.toBeInTheDocument();
    // TOKEN3 is native and should always be rendered
    expect(screen.getByText('TOKEN3')).toBeInTheDocument();
  });
});
