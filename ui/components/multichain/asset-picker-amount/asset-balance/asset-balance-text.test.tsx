import React from 'react';
import { AssetType } from '../../../../../shared/constants/transaction';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import configureStore from '../../../../store/store';
import { TextColor } from '../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { AssetBalanceText } from './asset-balance-text';

const store = configureStore({
  ...mockSendState,
  metamask: {
    ...mockSendState.metamask,
  },
  appState: { ...mockSendState.appState, sendInputCurrencySwitched: false },
});

const mockUseTokenTracker = jest.fn();
const mockUseCurrencyDisplay = jest.fn();
const mockUseTokenFiatAmount = jest.fn();
const mockUseIsOriginalTokenSymbol = jest.fn();
const mockGetIsFiatPrimary = jest.fn();

jest.mock('../../../../hooks/useTokenBalances', () => ({
  useTokenTracker: () => mockUseTokenTracker(),
}));

jest.mock('../../../../hooks/useCurrencyDisplay', () => ({
  useCurrencyDisplay: () => mockUseCurrencyDisplay(),
}));

jest.mock('../../../../hooks/useTokenFiatAmount', () => ({
  useTokenFiatAmount: () => mockUseTokenFiatAmount(),
}));

jest.mock('../../../../hooks/useIsOriginalTokenSymbol', () => ({
  useIsOriginalTokenSymbol: () => mockUseIsOriginalTokenSymbol(),
}));

jest.mock('../utils', () => ({
  getIsFiatPrimary: () => mockGetIsFiatPrimary(),
}));

const MOCK_TOKEN_WITH_BALANCES_ONE = {
  tokensWithBalances: [
    { string: "doesn't matter", symbol: "doesn't matter", address: '0x01' },
  ],
};
const MOCK_TOKEN_WITH_BALANCES_TWO = {
  tokensWithBalances: [{ string: '100', address: '0x01' }],
};

describe('AssetBalanceText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_ONE);
    mockUseCurrencyDisplay.mockReturnValue([
      'undefined',
      { value: 'fiat value', suffix: 'suffix', prefix: 'prefix-' },
    ]);
    mockUseTokenFiatAmount.mockReturnValue('Token Fiat Value');
    mockUseIsOriginalTokenSymbol.mockReturnValue(false);
    mockGetIsFiatPrimary.mockReturnValue(true);

    const asset = {
      type: AssetType.native,
      balance: '1000000',
    };
    const { asFragment } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
      />,
      store,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders fiat primary correctly', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_ONE);
    mockUseCurrencyDisplay.mockReturnValue([
      'title',
      { value: '$1.23', symbol: "doesn't matter" },
    ]);
    mockUseTokenFiatAmount.mockReturnValue("doesn't matter");
    mockUseIsOriginalTokenSymbol.mockReturnValue(true);
    mockGetIsFiatPrimary.mockReturnValue(true);

    const asset = {
      type: AssetType.token,
      details: { address: '0x01', decimals: 2 },
      balance: '100',
    };
    const { getByText } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
      />,
      store,
    );
    expect(getByText('$1.23')).toBeInTheDocument();
  });

  it('renders native asset type correctly', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_TWO);
    mockUseCurrencyDisplay.mockReturnValue([
      'title',
      { value: 'test_balance' },
    ]);
    mockUseTokenFiatAmount.mockReturnValue('$1.00');
    mockUseIsOriginalTokenSymbol.mockReturnValue(false);
    mockGetIsFiatPrimary.mockReturnValue(false);

    const asset = {
      type: AssetType.native,
      balance: '10000',
    };

    const { getByText } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
      />,
      store,
    );

    expect(getByText('test_balance')).toBeInTheDocument();
  });

  it('renders a single NFT correctly', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_TWO);
    const asset = {
      type: AssetType.NFT,
      balance: '0x1',
    };
    mockUseCurrencyDisplay.mockReturnValue([
      'title',
      { value: 'test_balance' },
    ]);
    const { getByTestId } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
      />,
      store,
    );
    expect(
      getByTestId('asset-balance-nft-display').textContent,
    ).toMatchInlineSnapshot(`"1 NFT"`);
  });

  it('renders multiple NFTs correctly', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_TWO);
    const asset = {
      type: AssetType.NFT,
      balance: '0x3',
    };
    mockUseCurrencyDisplay.mockReturnValue([
      'title',
      { value: 'test_balance' },
    ]);
    const { getByTestId } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
      />,
      store,
    );
    expect(
      getByTestId('asset-balance-nft-display').textContent,
    ).toMatchInlineSnapshot(`"3 NFTs"`);
  });

  it('renders NFT with error message', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_TWO);
    const asset = {
      type: AssetType.NFT,
      balance: '0x3',
    };
    mockUseCurrencyDisplay.mockReturnValue([
      'title',
      { value: 'test_balance' },
    ]);
    const { getByTestId } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
        error="insufficientFundsForGas"
      />,
      store,
    );
    expect(
      getByTestId('asset-balance-nft-display').textContent,
    ).toMatchInlineSnapshot(`"3 NFTs. Insufficient funds for gas"`);
  });

  it('renders error message correctly', () => {
    mockUseTokenTracker.mockReturnValue(MOCK_TOKEN_WITH_BALANCES_TWO);
    mockUseCurrencyDisplay.mockReturnValue([
      'title',
      { value: 'test_balance' },
    ]);
    mockUseTokenFiatAmount.mockReturnValue('$1.00');
    mockUseIsOriginalTokenSymbol.mockReturnValue(false);
    mockGetIsFiatPrimary.mockReturnValue(false);

    const asset = {
      type: AssetType.native,
      balance: '10000',
    };

    const { getByText, getByTestId } = renderWithProvider(
      <AssetBalanceText
        asset={asset}
        balanceColor={'textColor' as TextColor}
        error="insufficientFundsForGas"
      />,
      store,
    );

    expect(getByText('test_balance')).toBeInTheDocument();
    expect(
      getByTestId('send-page-amount-error').textContent,
    ).toMatchInlineSnapshot(`". Insufficient funds for gas"`);
  });
});
