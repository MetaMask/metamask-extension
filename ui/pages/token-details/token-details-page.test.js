import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import Identicon from '../../components/ui/identicon';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import TokenDetailsPage from './token-details-page';

const testTokenAddress = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';
const state = {
  metamask: {
    selectedAddress: '0xAddress',
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0xAddress',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    contractExchangeRates: {
      '0xAnotherToken': 0.015,
    },
    useTokenDetection: true,
    tokenList: {
      '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
        address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Synthetix',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
        name: 'Synthetix Network Token',
        occurrences: 12,
        symbol: 'SNX',
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl:
          'https://images.prismic.io/token-price-prod/d0352dd9-5de8-4633-839d-bc3422c44d9c_UNI%404x.png',
        name: 'Uniswap',
        occurrences: 11,
        symbol: 'UNI',
      },
      '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl:
          'https://images.prismic.io/token-price-prod/917bc4fa-59d4-40f5-a3ef-33035698ffe0_YFIxxxhdpi.png',
        name: 'yearn.finance',
        occurrences: 11,
        symbol: 'YFI',
      },
      '0x408e41876cccdc0f92210600ef50372656052a38': {
        address: '0x408e41876cccdc0f92210600ef50372656052a38',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl: 'https://crypto.com/price/coin-data/icon/REN/color_icon.png',
        name: 'Republic Token',
        occurrences: 11,
        symbol: 'REN',
      },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 8,
        iconUrl:
          'https://images.prismic.io/token-price-prod/c27778b1-f402-45f0-9225-f24f24b0518a_WBTC-xxxhdpi.png',
        name: 'Wrapped BTC',
        occurrences: 11,
        symbol: 'WBTC',
      },
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl: 'https://crypto.com/price/coin-data/icon/MKR/color_icon.png',
        name: 'MakerDAO',
        occurrences: 11,
        symbol: 'MKR',
      },
      '0x514910771af9ca656af840dff83e8264ecf986ca': {
        address: '0x514910771af9ca656af840dff83e8264ecf986ca',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl: 'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
        name: 'ChainLink Token',
        occurrences: 11,
        symbol: 'LINK',
      },
      '0x6b175474e89094c44da98b954eedeac495271d0f': {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl: 'https://crypto.com/price/coin-data/icon/DAI/color_icon.png',
        name: 'Dai Stablecoin',
        occurrences: 11,
        symbol: 'DAI',
      },
      '0x04fa0d235c4abf4bcf4787af4cf447de572ef828': {
        address: '0x04fa0d235c4abf4bcf4787af4cf447de572ef828',
        aggregators: [
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        decimals: 18,
        iconUrl:
          'https://images.prismic.io/token-price-prod/e2850554-ccf6-4514-9c3c-a17e19dea82f_UMAxxxhdpi.png',
        name: 'UMA',
        occurrences: 10,
        symbol: 'UMA',
      },
    },
    providerConfig: {
      type: 'mainnet',
      nickname: '',
    },
    currencyRates: {},
    preferences: {
      showFiatInTestnets: true,
    },
    tokens: [
      {
        address: testTokenAddress,
        symbol: 'SNX',
        decimals: 18,
        image: 'testImage',
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
};

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
    useParams: () => ({
      address: testTokenAddress,
    }),
  };
});

describe('TokenDetailsPage', () => {
  it('should render title "Token details" in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Token details')).toBeInTheDocument();
  });

  it('should close token details page when close button is clicked', () => {
    const store = configureMockStore()(state);
    const { container } = renderWithProvider(<TokenDetailsPage />, store);
    const onCloseBtn = container.querySelector('.token-details__closeButton');
    fireEvent.click(onCloseBtn);
    expect(onCloseBtn).toBeDefined();
  });

  it('should render an icon image', () => {
    const token = state.metamask.tokens.find(({ address }) =>
      isEqualCaseInsensitive(address, testTokenAddress),
    );
    const iconImage = (
      <Identicon diameter={32} address={testTokenAddress} image={token.image} />
    );
    expect(iconImage).toBeDefined();
  });

  it('should render token contract address title in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Token contract address')).toBeInTheDocument();
  });

  it('should render token contract address in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText(testTokenAddress)).toBeInTheDocument();
  });

  it('should call copy button when click is simulated', () => {
    const store = configureMockStore()(state);
    const { container } = renderWithProvider(<TokenDetailsPage />, store);
    const handleCopyBtn = container.querySelector('.token-details__copyIcon');
    fireEvent.click(handleCopyBtn);
    expect(handleCopyBtn).toBeDefined();
  });

  it('should render token decimal title in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Token decimal:')).toBeInTheDocument();
  });

  it('should render number of token decimals in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('18')).toBeInTheDocument();
  });

  it('should render current network title in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Network:')).toBeInTheDocument();
  });

  it('should render current network in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Ethereum Mainnet')).toBeInTheDocument();
  });

  it('should render token list title in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Token lists:')).toBeInTheDocument();
  });

  it('should render token list for the token in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(
      getByText(
        'Aave, Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Synthetix, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
  });

  it('should call hide token button when button is clicked in token details page', () => {
    const store = configureMockStore()(state);
    const { container } = renderWithProvider(<TokenDetailsPage />, store);
    const hideTokenBtn = container.querySelector(
      '.token-details__hide-token-button',
    );
    fireEvent.click(hideTokenBtn);
    expect(hideTokenBtn).toBeDefined();
  });

  it('should render label of hide token button in token details page', () => {
    const store = configureMockStore()(state);
    const { getByText } = renderWithProvider(<TokenDetailsPage />, store);
    expect(getByText('Hide token')).toBeInTheDocument();
  });
});
