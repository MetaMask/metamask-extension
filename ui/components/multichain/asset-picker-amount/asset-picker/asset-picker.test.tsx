import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { AssetType } from '../../../../../shared/constants/transaction';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import configureStore from '../../../../store/store';
import { AssetPicker } from './asset-picker';

const store = (
  nativeTicker = 'NATIVE TICKER',
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenList = {} as any,
) =>
  configureStore({
    ...mockSendState,
    metamask: {
      ...mockSendState.metamask,
      currencyRates: {
        [nativeTicker]: {
          conversionRate: 11.1,
        },
      },
      providerConfig: {
        chainId: '0x1',
        ticker: nativeTicker,
      },
      useTokenDetection: true,
      tokenList,
    },
  });

describe('AssetPicker', () => {
  it('matches snapshot', () => {
    const asset = {
      type: AssetType.native,
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { asFragment } = render(
      <Provider store={store()}>
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('native: renders symbol and image', () => {
    const asset = {
      type: AssetType.native,
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { getByText, getByRole } = render(
      <Provider store={store('NATIVE')}>
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('NATIVE')).toBeInTheDocument();
    expect(getByRole('img')).toBeInTheDocument();
    expect(getByRole('img')).toHaveAttribute('src', './images/eth_logo.svg');
  });

  it('native: renders overflowing symbol and image', () => {
    const asset = {
      type: AssetType.native,
      balance: '1000000',
    };
    const mockAssetChange = jest.fn();

    const { getByText, getByRole } = render(
      <Provider store={store('NATIVE TOKEN')}>
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('NATIVE...')).toBeInTheDocument();
    expect(getByRole('img')).toBeInTheDocument();
    expect(getByRole('img')).toHaveAttribute('src', './images/eth_logo.svg');
  });

  it('token: renders symbol and image', () => {
    const asset = {
      type: AssetType.token,
      details: {
        address: 'token address',
        decimals: 2,
        symbol: 'symbol',
      },
      balance: '100',
    };
    const mockAssetChange = jest.fn();

    const { getByText, getByRole } = render(
      <Provider
        store={store("SHOULDN'T MATTER", {
          'token address': { iconUrl: 'token icon url' },
        })}
      >
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('symbol')).toBeInTheDocument();
    expect(getByRole('img')).toBeInTheDocument();
    expect(getByRole('img')).toHaveAttribute('src', 'token icon url');
  });

  it('token: renders symbol and image overflowing', () => {
    const asset = {
      type: AssetType.token,
      details: {
        address: 'token address',
        decimals: 2,
        symbol: 'symbol overflow',
      },
      balance: '100',
    };
    const mockAssetChange = jest.fn();

    const { getByText, getByRole } = render(
      <Provider
        store={store("SHOULDN'T MATTER", {
          'token address': { iconUrl: 'token icon url' },
        })}
      >
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('symbol...')).toBeInTheDocument();
    expect(getByRole('img')).toBeInTheDocument();
    expect(getByRole('img')).toHaveAttribute('src', 'token icon url');
  });

  it('token: renders symbol and image falls back', () => {
    const asset = {
      type: AssetType.token,
      details: {
        address: 'token address',
        decimals: 2,
        symbol: 'symbol',
      },
      balance: '100',
    };
    const mockAssetChange = jest.fn();

    const { getByText } = render(
      <Provider
        store={store("SHOULDN'T MATTER", [
          { address: 'token address', iconUrl: 'token icon url' },
        ])}
      >
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('symbol')).toBeInTheDocument();
    expect(getByText('?')).toBeInTheDocument();
  });

  it('nft: does not truncates if token ID is under length 13', () => {
    const asset = {
      type: AssetType.NFT,
      details: {
        address: 'token address',
        decimals: 2,
        tokenId: 1234567890,
      },
      balance: '100',
    };
    const mockAssetChange = jest.fn();

    const { getByText } = render(
      <Provider store={store()}>
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('#1234567890')).toBeInTheDocument();
  });

  it('nft: truncates if token ID is too long', () => {
    const asset = {
      type: AssetType.NFT,
      details: {
        address: 'token address',
        decimals: 2,
        tokenId: 1234567890123456,
      },
      balance: '100',
    };
    const mockAssetChange = jest.fn();

    const { getByText } = render(
      <Provider store={store()}>
        <AssetPicker asset={asset} onAssetChange={() => mockAssetChange()} />
      </Provider>,
    );
    expect(getByText('#123456...3456')).toBeInTheDocument();
  });

  it('render if disabled', () => {
    const asset = {
      type: AssetType.token,
      details: {
        address: 'token address',
        decimals: 2,
        symbol: 'symbol',
      },
      balance: '100',
    };
    const mockAssetChange = jest.fn();

    const { container } = render(
      <Provider
        store={store("SHOULDN'T MATTER", [
          { address: 'token address', iconUrl: 'token icon url' },
        ])}
      >
        <AssetPicker
          asset={asset}
          onAssetChange={() => mockAssetChange()}
          isDisabled
        />
      </Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});
