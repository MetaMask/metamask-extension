import React from 'react';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import {
  DEFAULT_ROUTE,
  MONEY_ACTIVITY_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { getPrivacyMode } from '../../selectors/selectors';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import MOCK_MONEY_TRANSACTIONS from './constants/mock-activity-data';
import { onchainItem } from './types/money-activity';
import { MoneyTransactionDetailsPage } from './money-transaction-details-page';
import { formatMoneyActivityDetailsDate } from './utils/money-transaction-details-display';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyActivityItems = jest.fn();
const mockNavigate = jest.fn();
const mockCopyToClipboard = jest.fn();
const mockUseParams = jest.fn();
const mockGetPrivacyMode = jest.mocked(getPrivacyMode);
const mockSelectMoneyActivityDetailsEnabled = jest.mocked(
  selectMoneyActivityDetailsEnabled,
);
const mockGetSelectedInternalAccount = jest.mocked(getSelectedInternalAccount);
const mockUseCopyToClipboard = jest.mocked(useCopyToClipboard);

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/selectors', () => ({
  ...jest.requireActual('../../selectors/selectors'),
  getPrivacyMode: jest.fn(),
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  ...jest.requireActual('../../selectors/money/money-account-feature-flags'),
  selectMoneyActivityDetailsEnabled: jest.fn(),
}));

jest.mock('../../../shared/lib/selectors/accounts', () => ({
  ...jest.requireActual('../../../shared/lib/selectors/accounts'),
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

jest.mock('../../hooks/money/use-money-activity-items', () => ({
  useMoneyActivityItems: () => mockUseMoneyActivityItems(),
}));

const mockItems = MOCK_MONEY_TRANSACTIONS.map(onchainItem);
const deposited = mockItems.find((item) => item.id === 'money-tx-deposited');
const failedDeposit = mockItems.find(
  (item) => item.id === 'money-tx-deposit-failed',
);

if (!deposited || !failedDeposit) {
  throw new Error('missing deposited or failed mock');
}

const VALID_TX_HASH =
  '0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd';
const EXPLORER_TX_URL = `https://monadscan.com/tx/${VALID_TX_HASH}`;

describe('MoneyTransactionDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPrivacyMode.mockReturnValue(false);
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(true);
    mockGetSelectedInternalAccount.mockReturnValue({
      address: '0x23212abcde12321ffffffffffffffffffffffffff',
      metadata: { name: 'Defi account' },
    } as ReturnType<typeof getSelectedInternalAccount>);
    mockUseCopyToClipboard.mockReturnValue([
      false,
      mockCopyToClipboard,
      jest.fn(),
    ]);
    mockUseParams.mockReturnValue({ transactionId: deposited.id });
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
      isLoading: false,
    });
    mockUseMoneyActivityItems.mockReturnValue({
      items: mockItems,
    });
  });

  it('redirects home when Money Account is unavailable', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: false,
    });

    renderWithLocalization(<MoneyTransactionDetailsPage />);

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

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(
      screen.getByTestId('money-transaction-details-loading'),
    ).toBeInTheDocument();
  });

  it('redirects to the activity page when details are disabled', () => {
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(false);

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      MONEY_ACTIVITY_ROUTE,
    );
  });

  it('redirects to the activity page when the transaction is not found', () => {
    mockUseParams.mockReturnValue({ transactionId: 'missing-id' });

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      MONEY_ACTIVITY_ROUTE,
    );
  });

  it('renders the confirmed deposit details', () => {
    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(
      screen.getByTestId('money-transaction-details-page'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-transaction-details-title'),
    ).toHaveTextContent(messages.moneyActivityDeposited.message);
    expect(
      screen.getByTestId('money-transaction-details-hero-amount'),
    ).toHaveTextContent('+$1,000.00');
    expect(
      screen.getByTestId('money-transaction-details-status-value'),
    ).toHaveTextContent(messages.confirmed.message);
    expect(
      screen.getByTestId('money-transaction-details-date'),
    ).toHaveTextContent(formatMoneyActivityDetailsDate(deposited.time));
    expect(
      screen.getByTestId('money-transaction-details-paid-with'),
    ).toHaveTextContent('Transak');
    expect(
      screen.getByTestId('money-transaction-details-account'),
    ).toHaveTextContent('Defi account (0x2321...ffff)');
    expect(
      screen.queryByTestId('money-transaction-details-hash'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('money-transaction-details-explorer'),
    ).not.toBeInTheDocument();
  });

  it('navigates back when the back button is clicked', () => {
    renderWithLocalization(<MoneyTransactionDetailsPage />);

    fireEvent.click(
      screen.getByTestId('money-transaction-details-back-button'),
    );
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('masks the hero amount in privacy mode', () => {
    mockGetPrivacyMode.mockReturnValue(true);

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(
      screen.getByTestId('money-transaction-details-hero-amount'),
    ).toHaveTextContent('•'.repeat(9));
  });

  it('renders a pending title and status', () => {
    const pending = onchainItem({
      ...deposited.tx,
      id: 'money-tx-depositing',
      status: TransactionStatus.submitted,
      type: TransactionType.moneyAccountDeposit,
    } as TransactionMeta);
    mockUseParams.mockReturnValue({ transactionId: pending.id });
    mockUseMoneyActivityItems.mockReturnValue({ items: [pending] });

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(
      screen.getByTestId('money-transaction-details-title'),
    ).toHaveTextContent(messages.moneyActivityDepositing.message);
    expect(
      screen.getByTestId('money-transaction-details-status-value'),
    ).toHaveTextContent(messages.pending.message);
  });

  it('renders a failed status and foldable error message', () => {
    const failed = onchainItem({
      ...failedDeposit.tx,
      error: {
        message:
          "MetaMask Pay: Relay submit: Relay execute: 500... body/executionOptions must have required property 'referrer'",
      },
    } as TransactionMeta);
    mockUseParams.mockReturnValue({ transactionId: failed.id });
    mockUseMoneyActivityItems.mockReturnValue({ items: [failed] });

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    expect(
      screen.getByTestId('money-transaction-details-title'),
    ).toHaveTextContent(messages.moneyActivityDepositFailed.message);
    expect(
      screen.getByTestId('money-transaction-details-status-value'),
    ).toHaveTextContent(messages.failed.message);
    expect(
      screen.getByTestId('money-transaction-details-error'),
    ).toHaveTextContent(
      "MetaMask Pay: Relay submit: Relay execute: 500... body/executionOptions must have required property 'referrer'",
    );
  });

  it('copies the transaction hash when the copy button is pressed', () => {
    const hashed = onchainItem({
      ...deposited.tx,
      hash: VALID_TX_HASH,
    } as TransactionMeta);
    mockUseParams.mockReturnValue({ transactionId: hashed.id });
    mockUseMoneyActivityItems.mockReturnValue({ items: [hashed] });

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    fireEvent.click(screen.getByTestId('money-transaction-details-copy-hash'));
    expect(mockCopyToClipboard).toHaveBeenCalledWith(hashed.tx.hash);
    expect(
      screen.getByTestId('money-transaction-details-explorer'),
    ).toBeInTheDocument();
  });

  it('opens the block explorer when the explorer button is pressed', () => {
    const hashed = onchainItem({
      ...deposited.tx,
      hash: VALID_TX_HASH,
    } as TransactionMeta);
    mockUseParams.mockReturnValue({ transactionId: hashed.id });
    mockUseMoneyActivityItems.mockReturnValue({ items: [hashed] });
    global.platform.openTab = jest.fn();

    renderWithLocalization(<MoneyTransactionDetailsPage />);

    fireEvent.click(screen.getByTestId('money-transaction-details-explorer'));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: EXPLORER_TX_URL,
    });
  });
});
