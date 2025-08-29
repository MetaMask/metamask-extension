import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Store } from 'redux';
import { AccountGroupBalanceChange } from './account-group-balance-change';

let mockIsMultichainEnabled: boolean = true;
type TestAggregatedChange = {
  period: '1d' | '7d' | '30d';
  currentTotalInUserCurrency: number;
  previousTotalInUserCurrency: number;
  amountChangeInUserCurrency: number;
  percentChange: number;
  userCurrency: string;
} | null;

let mockAggregatedChange: TestAggregatedChange = null;
let mockPrivacyMode: boolean = false;

jest.mock('../../../../selectors', () => ({
  getIsMultichainAccountsState2Enabled: () => mockIsMultichainEnabled,
  getPreferences: () => ({ privacyMode: mockPrivacyMode }),
}));

jest.mock('../../../../selectors/assets', () => ({
  selectBalanceChangeBySelectedAccountGroup:
    (_period: '1d' | '7d' | '30d') => () =>
      mockAggregatedChange,
}));

jest.mock('../../../../ducks/locale/locale', () => ({
  getIntlLocale: () => 'en',
}));

jest.mock('../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: () => 'usd',
}));

type MinimalStore = {
  getState: () => unknown;
  dispatch: (action: unknown) => unknown;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (next: unknown) => void;
  [Symbol.observable]?: () => unknown;
};

const buildStore = () =>
  ({
    getState: () => ({
      metamask: {},
      localeMessages: { currentLocale: 'en', current: {} },
    }),
    dispatch: () => undefined,
    subscribe: () => () => undefined,
    replaceReducer: () => undefined,
    [Symbol.observable]: () => ({
      subscribe: () => ({ unsubscribe: () => undefined }),
    }),
  }) as MinimalStore;

const renderWithProvider = (ui: React.ReactElement) => {
  const store = buildStore();
  const typedStore = store as unknown as Store;
  return render(
    <Provider store={typedStore}>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
    </Provider>,
  );
};

describe('AccountGroupBalanceChange', () => {
  beforeEach(() => {
    mockIsMultichainEnabled = true;
    mockPrivacyMode = false;
    mockAggregatedChange = null;
  });

  it('returns null when feature flag is disabled', () => {
    mockIsMultichainEnabled = false;
    const { container } = renderWithProvider(
      <AccountGroupBalanceChange period="1d" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders masked when privacyMode is on', () => {
    mockPrivacyMode = true;
    mockAggregatedChange = {
      period: '1d',
      currentTotalInUserCurrency: 200,
      previousTotalInUserCurrency: 100,
      amountChangeInUserCurrency: 100,
      percentChange: 100,
      userCurrency: 'usd',
    };

    renderWithProvider(<AccountGroupBalanceChange period="1d" />);

    const valueEl = screen.getByTestId('account-group-balance-change-value');
    const pctEl = screen.getByTestId('account-group-balance-change-percentage');
    expect(valueEl).toBeInTheDocument();
    expect(pctEl).toBeInTheDocument();

    expect(screen.queryByText(/\+\$?100\.00/u)).toBeNull();
    expect(screen.queryByText(/\(\+100\.00%\)/u)).toBeNull();
  });

  it('renders amount and percent when privacyMode is off', () => {
    mockPrivacyMode = false;
    mockAggregatedChange = {
      period: '1d',
      currentTotalInUserCurrency: 200,
      previousTotalInUserCurrency: 100,
      amountChangeInUserCurrency: 100,
      percentChange: 100,
      userCurrency: 'usd',
    };

    renderWithProvider(<AccountGroupBalanceChange period="1d" />);

    const valueEl = screen.getByTestId('account-group-balance-change-value');
    const pctEl = screen.getByTestId('account-group-balance-change-percentage');

    expect(valueEl).toBeInTheDocument();
    expect(pctEl).toBeInTheDocument();

    expect(valueEl).toHaveTextContent(/\+\$?100\.00/u);
    expect(pctEl).toHaveTextContent(/\(\+100\.00%\)/u);
  });
});
