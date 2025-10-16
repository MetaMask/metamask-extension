import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Hex } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { AssetType } from '../../../../../shared/constants/transaction';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import configureStore from '../../../../store/store';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../test/stub/networks';

import { ERC20Asset, NativeAsset, NFT } from '../asset-picker-modal/types';
import { AssetPicker } from './asset-picker';

const unknownChainId = '0x2489078';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

const NATIVE_TICKER = 'NATIVE TICKER';
const store = (
  nativeTicker = NATIVE_TICKER,

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenList = {} as any,
  chainId: Hex = CHAIN_IDS.MAINNET,
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
      ...mockNetworkState({
        chainId,
        ticker: nativeTicker,
      }),
      useTokenDetection: true,
      tokenList,
    },
  });

describe('AssetPicker', () => {
  it('matches snapshot', () => {
    const asset = {
      type: AssetType.native,
      image: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x1'],
      symbol: NATIVE_TICKER,
    } as NativeAsset;
    const mockAssetChange = jest.fn();

    const { asFragment } = render(
      <Provider store={store()}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('calls onClick handler', () => {
    const asset = {
      type: AssetType.native,
      image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
      symbol: 'NATIVE',
    } as NativeAsset;
    const mockAssetChange = jest.fn();
    const mockOnClick = jest.fn();
    const { getByTestId } = render(
      <Provider store={store('NATIVE')}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
          onClick={mockOnClick}
        />
      </Provider>,
    );
    getByTestId('asset-picker-button').click();
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('native: renders symbol and image', () => {
    const asset = {
      type: AssetType.native,
      image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
      symbol: 'NATIVE',
    } as NativeAsset;
    const mockAssetChange = jest.fn();

    const { getByText, getByAltText } = render(
      <Provider store={store('NATIVE')}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('NATIVE')).toBeInTheDocument();
    const img = getByAltText('Ethereum logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/eth_logo.svg');
    expect(getByAltText('NATIVE logo')).toHaveAttribute(
      'src',
      CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
    );
  });

  it('native: renders overflowing symbol and image', () => {
    const asset = {
      type: AssetType.native,
      image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
      symbol: NATIVE_TICKER,
    } as NativeAsset;
    const mockAssetChange = jest.fn();

    const { getByText, getByAltText } = render(
      <Provider store={store(NATIVE_TICKER)}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('NATIVE...')).toBeInTheDocument();
    const img = getByAltText('Ethereum logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/eth_logo.svg');
    expect(getByAltText('NATIVE TICKER logo')).toHaveAttribute(
      'src',
      CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
    );
  });

  it('token: renders symbol and image', () => {
    const asset = {
      type: AssetType.token,
      address: 'token address',
      image: 'token icon url',
      symbol: 'symbol',
    } as ERC20Asset;
    const mockAssetChange = jest.fn();

    const { getByText, getByAltText } = render(
      <Provider store={store("SHOULDN'T MATTER")}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('symbol')).toBeInTheDocument();
    const img = getByAltText('symbol logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'token icon url');
    expect(getByAltText('symbol logo')).toHaveAttribute(
      'src',
      'token icon url',
    );
  });

  it('token: renders symbol and image overflowing', () => {
    const asset = {
      type: AssetType.token,
      address: 'token address',
      image: 'token icon url',
      symbol: 'symbol overflow',
    } as ERC20Asset;
    const mockAssetChange = jest.fn();

    const { getByText, getByAltText } = render(
      <Provider store={store("SHOULDN'T MATTER")}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('symbol...')).toBeInTheDocument();
    const img = getByAltText('symbol overflow logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'token icon url');
    expect(getByAltText('symbol overflow logo')).toHaveAttribute(
      'src',
      'token icon url',
    );
  });

  it('token: renders symbol and image falls back', () => {
    const asset = {
      type: AssetType.token,
      address: 'token address',
      symbol: 'symbol',
    } as ERC20Asset;
    const mockAssetChange = jest.fn();

    const { getByText } = render(
      <Provider
        store={store(
          "SHOULDN'T MATTER",
          [{ address: 'token address', iconUrl: 'token icon url' }],
          unknownChainId,
        )}
      >
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('symbol')).toBeInTheDocument();
    expect(getByText('?')).toBeInTheDocument();
  });

  it('nft: does not truncates if token ID is under length 13', () => {
    const asset = {
      type: AssetType.NFT,
      address: 'token address',
      tokenId: 1234567890,
    } as NFT;
    const mockAssetChange = jest.fn();

    const { getByText } = render(
      <Provider store={store()}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('#1234567890')).toBeInTheDocument();
  });

  it('nft: truncates if token ID is too long', () => {
    const asset = {
      type: AssetType.NFT,
      address: 'token address',
      tokenId: 1234567890123456,
    } as NFT;
    const mockAssetChange = jest.fn();

    const { getByText } = render(
      <Provider store={store()}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
        />
      </Provider>,
    );
    expect(getByText('#123456...3456')).toBeInTheDocument();
  });

  it('nft: picks first image if nft container more that 1 image', () => {
    const images = [
      'ipfs://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy',
      'ipfs://bafybeic26kitpujb3q5h5w7yovmvgmtxl3y4ldsb2pfgual5jq62emsmxq',
    ];
    const asset = {
      type: AssetType.NFT,
      address: 'token address',
      tokenId: 1234567890123456,
      symbol: 'My NFT',
      image: images,
    } as NFT;

    const { debug, getByAltText } = render(
      <Provider store={store()}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={jest.fn()}
        />
      </Provider>,
    );

    debug();
    const elem = getByAltText('My NFT logo');
    expect(elem).toHaveAttribute('src', images[0]);
  });

  it('render if disabled', () => {
    const asset = {
      type: AssetType.token,
      address: 'token address',
      symbol: 'symbol',
    } as ERC20Asset;
    const mockAssetChange = jest.fn();

    const { container } = render(
      <Provider
        store={store(
          "SHOULDN'T MATTER",
          [{ address: 'token address', iconUrl: 'token icon url' }],
          unknownChainId,
        )}
      >
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
          isDisabled
        />
      </Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render network picker when networks prop is defined', () => {
    const asset = {
      type: AssetType.native,
      image: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x1'],
      symbol: NATIVE_TICKER,
    } as NativeAsset;

    const mockAssetChange = jest.fn();

    const { asFragment } = render(
      <Provider store={store(NATIVE_TICKER)}>
        <AssetPicker
          header={'testHeader'}
          asset={asset}
          onAssetChange={() => mockAssetChange()}
          isDisabled
          networkProps={{
            network: {
              chainId: '0x1',
              nativeCurrency: 'ETH',
              defaultBlockExplorerUrlIndex: 0,
              blockExplorerUrls: ['https://explorerurl'],
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  networkClientId: 'test1',
                  url: 'https://rpcurl',
                  type: RpcEndpointType.Custom,
                },
              ],
              name: 'network',
            },
            networks: [
              {
                chainId: '0x1',
                nativeCurrency: 'ETH',
                defaultBlockExplorerUrlIndex: 0,
                blockExplorerUrls: ['https://explorerurl'],
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    networkClientId: 'test1',
                    url: 'https://rpcurl',
                    type: RpcEndpointType.Custom,
                  },
                ],
                name: 'Network name 3',
              },
              {
                chainId: '0xa',
                nativeCurrency: 'ETH',
                defaultBlockExplorerUrlIndex: 0,
                blockExplorerUrls: ['https://explorerurl'],
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    networkClientId: 'test2',
                    url: 'https://rpcurl',
                    type: RpcEndpointType.Custom,
                  },
                ],
                name: 'Network name 4',
              },
            ],
            onNetworkChange: jest.fn(),
          }}
        />
      </Provider>,
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
