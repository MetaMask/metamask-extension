import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import Identicon from '../../components/ui/identicon/identicon.component';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import TokenDetailsPage from './token-details-page';

const testTokenAddress = '0xaD6D458402F60fD3Bd25163575031ACDce07538A';
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
      type: 'mainnet',
      nickname: '',
    },
    preferences: {
      showFiatInTestnets: true,
    },
    tokens: [
      {
        address: testTokenAddress,
        symbol: 'DAA',
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
    expect(getByText('Token Contract Address')).toBeInTheDocument();
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
    expect(getByText('Token Decimal:')).toBeInTheDocument();
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
