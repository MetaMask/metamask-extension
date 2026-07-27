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
import NftDetails from '../../components/app/assets/nfts/nft-details/nft-details';
import { Token } from '../../components/app/assets/types';
import Asset from './asset';
import { useRouteAssetToken } from './hooks/useRouteAssetToken';
import TokenAsset from './components/token-asset';
import NativeAsset from './components/native-asset';

const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const DAI_ASSET_ID =
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' as CaipAssetType;
const ENCODED_DAI_ASSET = encodeURIComponent(DAI_ASSET_ID);

const STELLAR_CHAIN_ID = 'stellar:pubnet';
const STELLAR_USDC_ASSET_ID =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;
const STELLAR_XLM_ASSET_ID = 'stellar:pubnet/slip44:148' as CaipAssetType;

const NFT_CONTRACT = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
const NFT_TOKEN_ID = '42';

const erc20Token: Token = {
  address: DAI_ADDRESS,
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  chainId: '0x1',
  decimals: 18,
  isNative: false,
  image: '',
};

const nativeToken: Token = {
  symbol: 'ETH',
  name: 'Ether',
  chainId: '0x1',
  decimals: 18,
  isNative: true,
  image: '',
  address: '0x0000000000000000000000000000000000000000',
};

const stellarNonNativeToken: Token = {
  assetId: STELLAR_USDC_ASSET_ID,
  symbol: 'USDC',
  name: 'USD Coin',
  chainId: STELLAR_CHAIN_ID,
  decimals: 7,
  isNative: false,
  image: '',
  address: STELLAR_USDC_ASSET_ID,
};

const stellarNativeToken: Token = {
  assetId: STELLAR_XLM_ASSET_ID,
  symbol: 'XLM',
  name: 'Stellar Lumens',
  chainId: STELLAR_CHAIN_ID,
  decimals: 7,
  isNative: true,
  image: '',
  address: STELLAR_XLM_ASSET_ID,
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
  useRouteAssetToken: jest.fn(),
}));
const mockUseRouteAssetToken = jest.mocked(useRouteAssetToken);

jest.mock('./components/token-asset', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));
jest
  .mocked(TokenAsset)
  .mockImplementation(({ token, chainId }) => (
    <div
      data-testid="token-asset"
      data-symbol={token.symbol}
      data-chain-id={chainId}
    />
  ));

jest.mock('./components/native-asset', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));
jest
  .mocked(NativeAsset)
  .mockImplementation(({ token, chainId }) => (
    <div
      data-testid="native-asset"
      data-symbol={token.symbol}
      data-chain-id={chainId}
    />
  ));

jest.mock('../../components/app/assets/nfts/nft-details/nft-details', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));
jest
  .mocked(NftDetails)
  .mockImplementation(({ nft, nftChainId }) => (
    <div
      data-testid="nft-details"
      data-token-id={nft.tokenId}
      data-chain-id={nftChainId}
    />
  ));

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
    const TokenAssetTestCases = [
      {
        name: 'non-native EVM tokens',
        token: erc20Token,
        assertion: (elem: HTMLElement) => {
          expect(elem).toHaveAttribute('data-symbol', 'DAI');
          expect(elem).toHaveAttribute('data-chain-id', '0x1');
        },
      },
      {
        name: 'non-native multichain tokens without an address',
        token: stellarNonNativeToken,
        assertion: (elem: HTMLElement) => {
          expect(elem).toHaveAttribute('data-symbol', 'USDC');
          expect(elem).toHaveAttribute('data-chain-id', STELLAR_CHAIN_ID);
        },
      },
    ];

    const NativeAssetTestCases = [
      {
        name: 'native EVM tokens',
        token: nativeToken,
        assertion: (elem: HTMLElement) => {
          expect(elem).toHaveAttribute('data-symbol', 'ETH');
          expect(elem).toHaveAttribute('data-chain-id', '0x1');
        },
      },
      {
        name: 'native multichain tokens without an address',
        token: stellarNativeToken,
        assertion: (elem: HTMLElement) => {
          expect(elem).toHaveAttribute('data-symbol', 'XLM');
          expect(elem).toHaveAttribute('data-chain-id', STELLAR_CHAIN_ID);
        },
      },
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(TokenAssetTestCases)(
      'renders TokenAsset for $name',
      ({ token, assertion }: (typeof TokenAssetTestCases)[number]) => {
        mockUseRouteAssetToken.mockReturnValue({
          token,
          isLoading: false,
          hasError: false,
        });
        renderAssetPage();

        expect(screen.queryByTestId('token-asset')).toBeInTheDocument();
        expect(screen.queryByTestId('native-asset')).not.toBeInTheDocument();

        const tokenAsset = screen.getByTestId('token-asset');
        expect(tokenAsset).toBeInTheDocument();
        assertion(tokenAsset);
      },
    );

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(NativeAssetTestCases)(
      'renders NativeAsset for $name',
      ({ token, assertion }: (typeof NativeAssetTestCases)[number]) => {
        mockUseRouteAssetToken.mockReturnValue({
          token,
          isLoading: false,
          hasError: false,
        });
        renderAssetPage();

        expect(screen.queryByTestId('native-asset')).toBeInTheDocument();
        expect(screen.queryByTestId('token-asset')).not.toBeInTheDocument();

        const nativeAsset = screen.getByTestId('native-asset');
        expect(nativeAsset).toBeInTheDocument();
        assertion(nativeAsset);
      },
    );
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
