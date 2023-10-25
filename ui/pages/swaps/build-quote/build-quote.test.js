import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setBackgroundConnection } from '../../../store/background-connection';
import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
} from '../../../../test/jest';
import { createTestProviderTools } from '../../../../test/stub/provider';
import {
  setSwapsFromToken,
  setSwapToToken,
  setFromTokenInputValue,
} from '../../../ducks/swaps/swaps';
import BuildQuote from '.';

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    ethBalance: '0x8',
    selectedAccountAddress: 'selectedAccountAddress',
    isFeatureFlagLoaded: false,
    shuffledTokensList: [],
    ...customProps,
  };
};

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  ignoreTokens: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
  clearSwapsQuotes: jest.fn(),
  stopPollingForQuotes: jest.fn(),
  clearSmartTransactionFees: jest.fn(),
  setSwapsFromToken: jest.fn(),
  setSwapToToken: jest.fn(),
  setFromTokenInputValue: jest.fn(),
});

jest.mock('../../../ducks/swaps/swaps', () => {
  const actual = jest.requireActual('../../../ducks/swaps/swaps');
  return {
    ...actual,
    setSwapsFromToken: jest.fn(),
    setSwapToToken: jest.fn(),
    setFromTokenInputValue: jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    }),
  };
});

jest.mock('../swaps.util', () => {
  const actual = jest.requireActual('../swaps.util');
  return {
    ...actual,
    fetchTokenBalance: jest.fn(() => Promise.resolve()),
    fetchTokenPrice: jest.fn(() => Promise.resolve()),
  };
});

const providerResultStub = {
  eth_getCode: '0x123',
  eth_call:
    '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
};
const { provider } = createTestProviderTools({
  scaffold: providerResultStub,
  networkId: '5',
  chainId: '5',
});

describe('BuildQuote', () => {
  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    global.ethereumProvider = provider;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    expect(getByText('Swap from')).toBeInTheDocument();
    expect(getByText('Swap to')).toBeInTheDocument();
    expect(getByText('Select')).toBeInTheDocument();
    expect(getByText('Slippage tolerance')).toBeInTheDocument();
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('Review swap')).toBeInTheDocument();
    expect(
      document.querySelector('.slippage-buttons__button-group'),
    ).toMatchSnapshot();
  });

  it('switches swap from and to tokens', () => {
    const setSwapFromTokenMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    setSwapsFromToken.mockImplementation(setSwapFromTokenMock);
    const setSwapToTokenMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    setSwapToToken.mockImplementation(setSwapToTokenMock);
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText, getByTestId } = renderWithProvider(
      <BuildQuote {...props} />,
      store,
    );
    expect(getByText('Swap from')).toBeInTheDocument();
    fireEvent.click(getByTestId('build-quote__swap-arrows'));
    expect(setSwapsFromToken).toHaveBeenCalledWith(mockStore.swaps.toToken);
    expect(setSwapToToken).toHaveBeenCalled();
  });

  it('renders the block explorer link, only 1 verified source', () => {
    const mockStore = createSwapsMockStore();
    mockStore.swaps.toToken.occurances = 1;
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    expect(getByText('Swap from')).toBeInTheDocument();
    expect(getByText('Only verified on 1 source.')).toBeInTheDocument();
    expect(getByText('Etherscan')).toBeInTheDocument();
  });

  it('renders the block explorer link, 0 verified sources', () => {
    const mockStore = createSwapsMockStore();
    mockStore.swaps.toToken.occurances = 0;
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    expect(getByText('Swap from')).toBeInTheDocument();
    expect(
      getByText('This token has been added manually.'),
    ).toBeInTheDocument();
    expect(getByText('Etherscan')).toBeInTheDocument();
  });

  it('clicks on a block explorer link', () => {
    global.platform = { openTab: jest.fn() };
    const mockStore = createSwapsMockStore();
    mockStore.swaps.toToken.occurances = 1;
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    const blockExplorer = getByText('Etherscan');
    expect(blockExplorer).toBeInTheDocument();
    fireEvent.click(blockExplorer);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    });
  });

  it('clicks on the "max" link', () => {
    const setFromTokenInputValueMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    setFromTokenInputValue.mockImplementation(setFromTokenInputValueMock);
    const mockStore = createSwapsMockStore();
    mockStore.swaps.fromToken = 'DAI';
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    const maxLink = getByText('Max');
    fireEvent.click(maxLink);
    expect(setFromTokenInputValue).toHaveBeenCalled();
  });
});
