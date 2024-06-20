import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { AssetType } from '../../../../../shared/constants/transaction';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import configureStore from '../../../../store/store';
import { TextColor } from '../../../../helpers/constants/design-system';
import { AssetBalanceText } from './asset-balance-text';

const store = configureStore({
  ...mockSendState,
  metamask: {
    ...mockSendState.metamask,
    preferences: { useNativeCurrencyAsPrimaryCurrency: true },
  },
  appState: { ...mockSendState.appState, sendInputCurrencySwitched: false },
});

const mockUseTokenTracker = jest.fn();
const mockUseCurrencyDisplay = jest.fn();
const mockUseTokenFiatAmount = jest.fn();
const mockUseIsOriginalTokenSymbol = jest.fn();
const mockGetIsFiatPrimary = jest.fn();

jest.mock('../../../../hooks/useTokenTracker', () => ({
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

describe('AssetBalanceText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot', () => {
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [
        { string: "doesn't matter", symbol: "doesn't matter", address: '0x01' },
      ],
    });
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
    const { asFragment } = render(
      <Provider store={store}>
        <AssetBalanceText
          asset={asset}
          balanceColor={'textColor' as TextColor}
        />
      </Provider>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders fiat primary correctly', () => {
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [{ string: "doesn't matter", address: '0x01' }],
    });
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
    const { getByText } = render(
      <Provider store={store}>
        {/* Replace `any` with type */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AssetBalanceText asset={asset} balanceColor={'textColor' as any} />
      </Provider>,
    );
    expect(getByText('$1.23')).toBeInTheDocument();
  });

  it('renders native asset type correctly', () => {
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [{ string: '100', address: '0x01' }],
    });
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

    const { getByText } = render(
      <Provider store={store}>
        {/* Replace `any` with type */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AssetBalanceText asset={asset} balanceColor={'textColor' as any} />
      </Provider>,
    );

    expect(getByText('test_balance')).toBeInTheDocument();
  });

  it('renders error correctly', () => {
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [{ string: '100', address: '0x01' }],
    });
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

    const { getByText } = render(
      <Provider store={store}>
        <AssetBalanceText
          asset={asset}
          balanceColor={'textColor' as TextColor}
          error="errorText"
        />
      </Provider>,
    );

    expect(getByText('test_balance')).toBeInTheDocument();
    expect(getByText('. [errorText]')).toBeInTheDocument();
  });
});
