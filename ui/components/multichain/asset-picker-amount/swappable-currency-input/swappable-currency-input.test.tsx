import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { AssetType } from '../../../../../shared/constants/transaction';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import configureStore from '../../../../store/store';
import { SwappableCurrencyInput } from './swappable-currency-input';

const createStore = ({
  useNativeCurrencyAsPrimaryCurrency,
  sendInputCurrencySwitched,
}: Record<string, boolean>) =>
  configureStore({
    ...mockSendState,
    metamask: {
      ...mockSendState.metamask,
      preferences: { useNativeCurrencyAsPrimaryCurrency },
      marketData: {
        ...mockSendState.metamask.marketData,
        '0x5': {
          ...mockSendState.metamask.marketData['0x5'],
          '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': { price: 2 },
        },
      },
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
      type: AssetType.NFT,
      details: {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'TOKEN',
        standard: 'ERC721',
        tokenId: 1234,
        decimals: 0,
      },
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { asFragment } = render(
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

    expect(asFragment()).toMatchSnapshot('ERC721');
  });

  it('ERC1155: matches snapshot', () => {
    const asset = {
      type: AssetType.NFT,
      details: {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'TOKEN',
        standard: 'ERC1155',
        tokenId: 1234,
        decimals: 0,
      },
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { asFragment } = render(
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

    expect(asFragment()).toMatchSnapshot('ERC1155');
  });
});
