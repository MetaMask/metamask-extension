import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { setBackgroundConnection } from '../../../store/background-connection';
import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
} from '../../../../test/jest';
import {
  setSwapsFromToken,
  setSwapToToken,
  setFromTokenInputValue,
} from '../../../ducks/swaps/swaps';
import PrepareSwapPage from './prepare-swap-page';

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    ethBalance: '0x8',
    selectedAccountAddress: 'selectedAccountAddress',
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

jest.mock('../../../../shared/lib/token-util', () => {
  const actual = jest.requireActual('../../../../shared/lib/token-util');
  return {
    ...actual,
    fetchTokenBalance: jest.fn(() => Promise.resolve()),
  };
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
    fetchTokenPrice: jest.fn(() => Promise.resolve()),
  };
});

describe('PrepareSwapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    expect(getByText('Select token')).toBeInTheDocument();
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
    const { getByTestId } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    fireEvent.click(getByTestId('prepare-swap-page-switch-tokens'));
    expect(setSwapsFromToken).toHaveBeenCalledWith(mockStore.swaps.toToken);
    expect(setSwapToToken).toHaveBeenCalled();
  });

  it('renders the block explorer link, only 1 verified source', () => {
    const mockStore = createSwapsMockStore();
    mockStore.swaps.toToken.occurances = 1;
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    expect(getByText('Potentially inauthentic token')).toBeInTheDocument();
    expect(
      getByText('USDC is only verified on 1 source', { exact: false }),
    ).toBeInTheDocument();
    expect(getByText('etherscan.io')).toBeInTheDocument();
    expect(getByText('Continue swapping')).toBeInTheDocument();
  });

  it('renders the block explorer link, 0 verified sources', () => {
    const mockStore = createSwapsMockStore();
    mockStore.swaps.toToken.occurances = 0;
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    expect(getByText('Token added manually')).toBeInTheDocument();
    expect(
      getByText('Verify this token on', { exact: false }),
    ).toBeInTheDocument();
    expect(getByText('etherscan.io')).toBeInTheDocument();
    expect(getByText('Continue swapping')).toBeInTheDocument();
  });

  it('clicks on a block explorer link', () => {
    global.platform = { openTab: jest.fn() };
    const mockStore = createSwapsMockStore();
    mockStore.swaps.toToken.occurances = 1;
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    const blockExplorer = getByText('etherscan.io');
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
    mockStore.swaps.fromToken = {
      symbol: 'DAI',
      balance: '0x8',
      address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      decimals: 6,
    };
    const store = configureMockStore(middleware)(mockStore);
    const props = createProps();
    const { getByText } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    const maxLink = getByText('Max');
    fireEvent.click(maxLink);
    expect(setFromTokenInputValue).toHaveBeenCalled();
  });

  it('should have the Bridge link enabled if chain id is part of supported chains and there are no quotes', () => {
    const mockStore = createSwapsMockStore();
    mockStore.metamask.providerConfig = {
      chainId: '0x1',
    };
    mockStore.metamask.swapsState.quotes = [];
    const store = configureMockStore(middleware)(mockStore);

    const props = createProps();
    const { queryByTestId } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    const bridgeButton = queryByTestId(
      'prepare-swap-page-cross-chain-swaps-link',
    );
    expect(bridgeButton).toBeInTheDocument();
    expect(bridgeButton).toBeEnabled();
  });

  it('should not have the Bridge link enabled if chain id is part of supported chains but there are quotes', () => {
    const mockStore = createSwapsMockStore();
    mockStore.metamask.providerConfig = {
      chainId: '0x1',
    };
    expect(
      Object.keys(mockStore.metamask.swapsState.quotes).length,
    ).toBeDefined();
    const store = configureMockStore(middleware)(mockStore);

    const props = createProps();
    const { queryByTestId } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    const bridgeButton = queryByTestId(
      'prepare-swap-page-cross-chain-swaps-link',
    );

    expect(bridgeButton).toBeNull();
  });

  it('should not have the Bridge link enabled if there are quotes but chain id is not part of supported chains', () => {
    const mockStore = createSwapsMockStore();
    mockStore.metamask.providerConfig = {
      chainId: '0x539', // swaps testnet
    };
    expect(
      Object.keys(mockStore.metamask.swapsState.quotes).length,
    ).toBeDefined();

    const store = configureMockStore(middleware)(mockStore);

    const props = createProps();
    const { queryByTestId } = renderWithProvider(
      <PrepareSwapPage {...props} />,
      store,
    );
    const bridgeButton = queryByTestId(
      'prepare-swap-page-cross-chain-swaps-link',
    );

    expect(bridgeButton).toBeNull();
  });
});
