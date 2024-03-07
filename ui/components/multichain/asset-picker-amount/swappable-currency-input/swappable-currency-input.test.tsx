import React from 'react';
import { getByRole, render } from '@testing-library/react';
import { SwappableCurrencyInput } from './swappable-currency-input';
import { AssetType } from '../../../../../shared/constants/transaction';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';

const createStore = ({
  useNativeCurrencyAsPrimaryCurrency,
  sendInputCurrencySwitched,
}) =>
  configureStore({
    ...mockSendState,
    metamask: {
      ...mockSendState.metamask,
      preferences: { useNativeCurrencyAsPrimaryCurrency },
    },
    appState: { ...mockSendState.appState, sendInputCurrencySwitched },
  });

describe('SwappableCurrencyInput', () => {
  it('native: matches snapshot', () => {
    const asset = {
      type: AssetType.native,
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { asFragment, getByText } = render(
      <Provider
        store={createStore({
          useNativeCurrencyAsPrimaryCurrency: true,
          sendInputCurrencySwitched: true,
        })}
      >
        <SwappableCurrencyInput
          asset={asset}
          assetType={AssetType.native}
          amount={{ value: '5000' }}
          onAmountChange={mockAssetChange}
        />
      </Provider>,
    );
    expect(asFragment()).toMatchSnapshot('native');
    expect(getByText('ETH')).toBeInTheDocument();
  });

  it('token: matches snapshot', () => {
    const asset = {
      type: AssetType.token,
      details: {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'TOKEN',
        isERC721: false,
      },
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { asFragment, getByText } = render(
      <Provider
        store={createStore({
          useNativeCurrencyAsPrimaryCurrency: true,
          sendInputCurrencySwitched: true,
        })}
      >
        <SwappableCurrencyInput
          asset={asset}
          assetType={AssetType.native}
          amount={{ value: '5000' }}
          onAmountChange={mockAssetChange}
        />
      </Provider>,
    );
    expect(asFragment()).toMatchSnapshot('token');
    expect(getByText('TOKEN')).toBeInTheDocument();
  });

  it('ERC721: matches snapshot', () => {
    const asset = {
      type: AssetType.token,
      details: {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'TOKEN',
        isERC721: true,
        tokenId: 1234,
        decimals: 0,
      },
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { asFragment, getByText } = render(
      <Provider
        store={createStore({
          useNativeCurrencyAsPrimaryCurrency: true,
          sendInputCurrencySwitched: true,
        })}
      >
        <SwappableCurrencyInput
          asset={asset}
          assetType={AssetType.NFT}
          amount={{ value: '5000' }}
          onAmountChange={mockAssetChange}
        />
      </Provider>,
    );

    expect(asFragment()).toMatchSnapshot('nft');
    expect(getByText('1234')).toBeInTheDocument();
  });
});
