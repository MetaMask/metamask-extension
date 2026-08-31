import React from 'react';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  en,
  I18nProvider,
  renderWithLocalization,
} from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { DEFAULT_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { getPrivacyMode } from '../../selectors/selectors';
import MOCK_MONEY_TRANSACTIONS from './constants/mock-activity-data';
import { onchainItem } from './types/money-activity';
import { MoneyActivityPage } from './money-activity-page';
import {
  buildMoneyActivityBuckets,
  EMPTY_MONEY_ACTIVITY_BUCKETS,
  MoneyActivityFilter,
} from './utils/money-activity-filters';
import { formatMoneyActivityDateHeader } from './utils/group-money-activity';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyActivityItems = jest.fn();
const mockUseMoneyActivityItemClick = jest.fn();
const mockNavigate = jest.fn();
const mockGetPrivacyMode = jest.mocked(getPrivacyMode);

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/selectors', () => ({
  ...jest.requireActual('../../selectors/selectors'),
  getPrivacyMode: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

jest.mock('../../hooks/money/use-money-activity-items', () => ({
  useMoneyActivityItems: () => mockUseMoneyActivityItems(),
}));

jest.mock('../../hooks/money/use-money-activity-item-click', () => ({
  useMoneyActivityItemClick: () => mockUseMoneyActivityItemClick(),
}));

const mockItems = MOCK_MONEY_TRANSACTIONS.map(onchainItem);
const mockBuckets = buildMoneyActivityBuckets(mockItems);

function makePendingDeposit(): ReturnType<typeof onchainItem> {
  const confirmed = MOCK_MONEY_TRANSACTIONS.find(
    (tx) => tx.id === 'money-tx-deposited',
  );
  if (!confirmed) {
    throw new Error('missing deposited mock');
  }

  return onchainItem({
    ...confirmed,
    id: 'money-tx-depositing',
    status: TransactionStatus.submitted,
    type: TransactionType.moneyAccountDeposit,
  } as TransactionMeta);
}

describe('MoneyActivityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPrivacyMode.mockReturnValue(false);
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
      isLoading: false,
    });
    mockUseMoneyActivityItems.mockReturnValue({
      items: mockItems,
      buckets: mockBuckets,
    });
    mockUseMoneyActivityItemClick.mockReturnValue(undefined);
  });

  it('redirects home when Money Account is unavailable', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: false,
    });

    renderWithLocalization(<MoneyActivityPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      DEFAULT_ROUTE,
    );
  });

  it('shows a loading state while availability is resolving', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    renderWithLocalization(<MoneyActivityPage />);

    expect(screen.getByTestId('money-activity-loading')).toBeInTheDocument();
  });

  it('renders the title, filter chips, and date-grouped rows', () => {
    renderWithLocalization(<MoneyActivityPage />);

    expect(screen.getByTestId('money-activity-page')).toBeInTheDocument();
    expect(screen.getByTestId('money-activity-title')).toHaveTextContent(
      messages.moneyActivity.message,
    );
    expect(screen.getByTestId('money-activity-filter-all')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByTestId('money-activity-filter-deposits'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-activity-filter-sends'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-activity-pending-header'),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('money-activity-date-header').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        formatMoneyActivityDateHeader(
          new Date(mockItems[0].time).toISOString().slice(0, 10),
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId(/money-activity-row-money-tx-/u).length).toBe(
      MOCK_MONEY_TRANSACTIONS.length,
    );
  });

  it('resets the overflow ancestor scroll so View all starts at the top', () => {
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    scroller.style.height = '200px';
    document.body.appendChild(scroller);
    scroller.scrollTop = 180;

    render(<MoneyActivityPage />, {
      container: scroller,
      wrapper: ({ children }) => (
        <I18nProvider currentLocale="en" current={en} en={en}>
          {children}
        </I18nProvider>
      ),
    });

    expect(scroller.scrollTop).toBe(0);
    scroller.remove();
  });

  it('navigates back when the back button is clicked', () => {
    renderWithLocalization(<MoneyActivityPage />);

    fireEvent.click(screen.getByTestId('money-activity-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('filters to Sends when the Sends chip is selected', () => {
    renderWithLocalization(<MoneyActivityPage />);

    fireEvent.click(screen.getByTestId('money-activity-filter-sends'));

    expect(screen.getByTestId('money-activity-filter-sends')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('money-activity-filter-all')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      screen.queryByText(messages.moneyActivityDeposited.message),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(messages.moneyActivitySent.message).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByTestId(/money-activity-row-money-tx-/u)).toHaveLength(
      mockBuckets[MoneyActivityFilter.Transfers].length,
    );
  });

  it('shows empty copy when the active filter has no items', () => {
    mockUseMoneyActivityItems.mockReturnValue({
      items: [],
      buckets: EMPTY_MONEY_ACTIVITY_BUCKETS,
    });

    renderWithLocalization(<MoneyActivityPage />);

    expect(screen.getByTestId('money-activity-empty')).toHaveTextContent(
      messages.moneyActivityEmpty.message,
    );
    expect(
      screen.queryByTestId(/money-activity-row-/u),
    ).not.toBeInTheDocument();
  });

  it('renders a Pending section above date groups when in-flight items exist', () => {
    const pending = makePendingDeposit();
    const items = [pending, ...mockItems];
    mockUseMoneyActivityItems.mockReturnValue({
      items,
      buckets: buildMoneyActivityBuckets(items),
    });

    renderWithLocalization(<MoneyActivityPage />);

    expect(
      screen.getByTestId('money-activity-pending-header'),
    ).toHaveTextContent(messages.moneyActivityPending.message);
    expect(
      screen.getByText(messages.moneyActivityDepositing.message),
    ).toBeInTheDocument();
  });

  it('invokes the item click handler when details navigation is enabled', () => {
    const onItemClick = jest.fn();
    mockUseMoneyActivityItemClick.mockReturnValue(onItemClick);

    renderWithLocalization(<MoneyActivityPage />);

    fireEvent.click(screen.getByTestId(`money-activity-row-${mockItems[0].id}`));
    expect(onItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('does not make rows clickable when details navigation is disabled', () => {
    renderWithLocalization(<MoneyActivityPage />);

    expect(
      screen.getByTestId(`money-activity-row-${mockItems[0].id}`).tagName,
    ).toBe('DIV');
  });
});
