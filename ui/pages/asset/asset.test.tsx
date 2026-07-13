import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CaipAssetType } from '@metamask/utils';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getFungibleAssetForRoute } from '../../selectors/assets';
import { getNFTsByChainId } from '../../ducks/metamask/metamask';
import { useRouteAssetToken } from './hooks/useRouteAssetToken';
import Asset from './asset';

const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();
const mockUseRouteAssetToken = jest.fn();

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const DAI_ASSET_ID =
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' as CaipAssetType;
const ENCODED_DAI_ASSET = encodeURIComponent(DAI_ASSET_ID);

const NFT_CONTRACT = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
const NFT_TOKEN_ID = '42';

const erc20Token = {
  address: DAI_ADDRESS,
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  chainId: '0x1',
  decimals: 18,
  isNative: false,
};

const nativeToken = {
  symbol: 'ETH',
  name: 'Ether',
  chainId: '0x1',
  decimals: 18,
  isNative: true,
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-redirect" data-to={to} />
  ),
}));

jest.mock('../../ducks/metamask/metamask', () => ({
  getNFTsByChainId: jest.fn(),
}));

jest.mock('../../selectors/assets', () => ({
  getFungibleAssetForRoute: jest.fn(),
}));

jest.mock('./hooks/useRouteAssetToken', () => ({
  ...jest.requireActual('./hooks/useRouteAssetToken'),
  useRouteAssetToken: (...args: unknown[]) => mockUseRouteAssetToken(...args),
}));

jest.mock('./components/token-asset', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    token,
    chainId,
  }: {
    token: { symbol: string };
    chainId: string;
  }) => (
    <div
      data-testid="token-asset"
      data-symbol={token.symbol}
      data-chain-id={chainId}
    />
  ),
}));

jest.mock('./components/native-asset', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    token,
    chainId,
  }: {
    token: { symbol: string };
    chainId: string;
  }) => (
    <div
      data-testid="native-asset"
      data-symbol={token.symbol}
      data-chain-id={chainId}
    />
  ),
}));

jest.mock('../../components/app/assets/nfts/nft-details/nft-details', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    nft,
    nftChainId,
  }: {
    nft: { tokenId: string };
    nftChainId: string;
  }) => (
    <div
      data-testid="nft-details"
      data-token-id={nft.tokenId}
      data-chain-id={nftChainId}
    />
  ),
}));

const renderAssetPage = () => {
  const store = configureMockStore([thunk])(mockState);
  return renderWithProvider(<Asset />, store);
};

describe('Asset', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocation.mockReturnValue({
      pathname: '/asset/eip155:1/test',
      state: undefined,
    });

    mockUseParams.mockReturnValue({
      chainId: 'eip155:1',
      asset: ENCODED_DAI_ASSET,
    });

    mockUseRouteAssetToken.mockReturnValue({
      token: erc20Token,
      isLoading: false,
      hasError: false,
    });

    jest.mocked(getNFTsByChainId).mockReturnValue([]);
    jest.mocked(getFungibleAssetForRoute).mockReturnValue(undefined);
  });

  describe('token routes', () => {
    it('renders TokenAsset for non-native tokens with an address', () => {
      renderAssetPage();

      const tokenAsset = screen.getByTestId('token-asset');
      expect(tokenAsset).toBeInTheDocument();
      expect(tokenAsset).toHaveAttribute('data-symbol', 'DAI');
      expect(tokenAsset).toHaveAttribute('data-chain-id', '0x1');
      expect(screen.queryByTestId('native-asset')).not.toBeInTheDocument();
    });

    it('renders NativeAsset for native tokens', () => {
      mockUseRouteAssetToken.mockReturnValue({
        token: nativeToken,
        isLoading: false,
        hasError: false,
      });

      renderAssetPage();

      const nativeAsset = screen.getByTestId('native-asset');
      expect(nativeAsset).toBeInTheDocument();
      expect(nativeAsset).toHaveAttribute('data-symbol', 'ETH');
      expect(nativeAsset).toHaveAttribute('data-chain-id', '0x1');
      expect(screen.queryByTestId('token-asset')).not.toBeInTheDocument();
    });
  });

  describe('NFT routes', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({
        chainId: '0x1',
        asset: NFT_CONTRACT,
        id: NFT_TOKEN_ID,
      });
    });

    it('renders NftDetails when a matching NFT is found', () => {
      jest.mocked(getNFTsByChainId).mockReturnValue([
        {
          address: NFT_CONTRACT,
          tokenId: NFT_TOKEN_ID,
          name: 'Bored Ape',
        },
      ]);

      renderAssetPage();

      const nftDetails = screen.getByTestId('nft-details');
      expect(nftDetails).toBeInTheDocument();
      expect(nftDetails).toHaveAttribute('data-token-id', NFT_TOKEN_ID);
      expect(nftDetails).toHaveAttribute('data-chain-id', '0x1');
      expect(screen.queryByTestId('token-asset')).not.toBeInTheDocument();
      expect(screen.queryByTestId('native-asset')).not.toBeInTheDocument();
    });

    it('prefers NftDetails over token loading state', () => {
      jest.mocked(getNFTsByChainId).mockReturnValue([
        {
          address: NFT_CONTRACT,
          tokenId: NFT_TOKEN_ID,
          name: 'Bored Ape',
        },
      ]);
      mockUseRouteAssetToken.mockReturnValue({
        token: undefined,
        isLoading: true,
        hasError: false,
      });

      renderAssetPage();

      expect(screen.getByTestId('nft-details')).toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('renders nothing while token metadata is loading', () => {
      mockUseRouteAssetToken.mockReturnValue({
        token: undefined,
        isLoading: true,
        hasError: false,
      });

      const { container } = renderAssetPage();

      expect(container.querySelector('.asset__container')?.textContent).toBe(
        '',
      );
      expect(screen.queryByTestId('token-asset')).not.toBeInTheDocument();
      expect(screen.queryByTestId('native-asset')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate-redirect')).not.toBeInTheDocument();
    });

    it('redirects to the default route when the token cannot be resolved', () => {
      mockUseRouteAssetToken.mockReturnValue({
        token: undefined,
        isLoading: false,
        hasError: false,
      });

      renderAssetPage();

      const redirect = screen.getByTestId('navigate-redirect');
      expect(redirect).toBeInTheDocument();
      expect(redirect).toHaveAttribute('data-to', DEFAULT_ROUTE);
    });

    it('redirects to the default route when metadata fetch fails', () => {
      mockUseRouteAssetToken.mockReturnValue({
        token: undefined,
        isLoading: false,
        hasError: true,
      });

      renderAssetPage();

      const redirect = screen.getByTestId('navigate-redirect');
      expect(redirect).toBeInTheDocument();
      expect(redirect).toHaveAttribute('data-to', DEFAULT_ROUTE);
    });
  });

  describe('on mount', () => {
    it('scrolls the app container to the top', () => {
      const appElement = document.createElement('div');
      appElement.className = 'app';
      appElement.scroll = jest.fn();
      document.body.appendChild(appElement);

      renderAssetPage();

      expect(appElement.scroll).toHaveBeenCalledWith(0, 0);

      document.body.removeChild(appElement);
    });
  });
});
