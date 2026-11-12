import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MOCK_ACCOUNTS_API_ACTIVITY } from '../constants/mock-activity-data';
import {
  formatMoneyActivityDetailsDate,
  shortenMoneyActivityHex,
} from '../utils/money-transaction-details-display';
import { MoneyApiActivityDetails } from './money-api-activity-details';

const mockCopyToClipboard = jest.fn();
const mockUseCopyToClipboard = jest.mocked(useCopyToClipboard);

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('../../../components/app/token-icon', () => ({
  TokenIcon: ({
    chainId,
    tokenAddress,
    symbol,
    size,
  }: {
    chainId: string;
    tokenAddress: string;
    symbol?: string;
    size?: string;
  }) => (
    <div
      data-testid="money-api-activity-details-token-icon"
      data-chain-id={chainId}
      data-token-address={tokenAddress}
      data-symbol={symbol}
      data-size={size}
    />
  ),
}));

const [cardActivity, cashbackActivity, refundActivity] =
  MOCK_ACCOUNTS_API_ACTIVITY;

describe('MoneyApiActivityDetails', () => {
  const onBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCopyToClipboard.mockReturnValue([
      false,
      mockCopyToClipboard,
      jest.fn(),
    ]);
  });

  it('renders card purchase details with Paid to and You spent', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails activity={cardActivity} onBack={onBack} />,
    );

    expect(
      screen.getByTestId('money-api-activity-details-title'),
    ).toHaveTextContent(messages.moneyActivityPurchase.message);
    expect(
      screen.getByTestId('money-api-activity-details-hero-copy'),
    ).toHaveTextContent(messages.moneyActivityDetailsYouSpent.message);
    expect(
      screen.getByTestId('money-api-activity-details-hero-amount'),
    ).toHaveTextContent('-$10.00');
    const icon = screen.getByTestId('money-api-activity-details-token-icon');
    expect(icon).toHaveAttribute('data-chain-id', cardActivity.chainId);
    expect(icon).toHaveAttribute(
      'data-token-address',
      cardActivity.token.address,
    );
    expect(icon).toHaveAttribute('data-symbol', cardActivity.token.symbol);
    expect(icon).toHaveAttribute('data-size', 'xl');
    expect(
      screen.getByTestId('money-api-activity-details-status-value'),
    ).toHaveTextContent(messages.completed.message);
    expect(
      screen.getByTestId('money-api-activity-details-date'),
    ).toHaveTextContent(formatMoneyActivityDetailsDate(cardActivity.time));
    expect(
      screen.getByTestId('money-api-activity-details-counterparty'),
    ).toHaveTextContent(
      `${messages.moneyActivityDetailsPaidTo.message}${shortenMoneyActivityHex(
        '0x8dFE562Cbb4E93D5029f39DA26BB6B501a8d1D3e',
      )}`,
    );
    expect(
      screen.getByTestId('money-api-activity-details-hash'),
    ).toHaveTextContent(shortenMoneyActivityHex(cardActivity.hash));
    expect(
      screen.getByTestId('money-api-activity-details-explorer'),
    ).toBeInTheDocument();
  });

  it('renders cashback details with Received from and You earned', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails activity={cashbackActivity} onBack={onBack} />,
    );

    expect(
      screen.getByTestId('money-api-activity-details-title'),
    ).toHaveTextContent(messages.moneyActivityMusdBack.message);
    expect(
      screen.getByTestId('money-api-activity-details-hero-copy'),
    ).toHaveTextContent(messages.moneyActivityDetailsYouEarned.message);
    expect(
      screen.getByTestId('money-api-activity-details-hero-amount'),
    ).toHaveTextContent('+$0.30');
    expect(
      screen.getByTestId('money-api-activity-details-counterparty'),
    ).toHaveTextContent(
      `${messages.moneyActivityDetailsReceivedFrom.message}${shortenMoneyActivityHex(
        '0x8dFE562Cbb4E93D5029f39DA26BB6B501a8d1D3e',
      )}`,
    );
  });

  it('renders refund details with You were refunded', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails activity={refundActivity} onBack={onBack} />,
    );

    expect(
      screen.getByTestId('money-api-activity-details-title'),
    ).toHaveTextContent(messages.moneyActivityRefund.message);
    expect(
      screen.getByTestId('money-api-activity-details-hero-copy'),
    ).toHaveTextContent(messages.moneyActivityDetailsYouWereRefunded.message);
    expect(
      screen.getByTestId('money-api-activity-details-hero-amount'),
    ).toHaveTextContent('+$10.00');
  });

  it('copies the transaction hash when the copy button is pressed', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails activity={cardActivity} onBack={onBack} />,
    );

    fireEvent.click(screen.getByTestId('money-api-activity-details-copy-hash'));
    expect(mockCopyToClipboard).toHaveBeenCalledWith(cardActivity.hash);
  });

  it('opens the block explorer when the explorer button is pressed', () => {
    global.platform.openTab = jest.fn();

    renderWithLocalization(
      <MoneyApiActivityDetails activity={cardActivity} onBack={onBack} />,
    );

    fireEvent.click(screen.getByTestId('money-api-activity-details-explorer'));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: `https://monadscan.com/tx/${cardActivity.hash}`,
    });
  });

  it('hides the explorer button when the hash is invalid', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails
        activity={{ ...cardActivity, hash: '0xbad' }}
        onBack={onBack}
      />,
    );

    expect(
      screen.queryByTestId('money-api-activity-details-explorer'),
    ).not.toBeInTheDocument();
  });

  it('navigates back when the back button is clicked', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails activity={cardActivity} onBack={onBack} />,
    );

    fireEvent.click(
      screen.getByTestId('money-api-activity-details-back-button'),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('masks the hero amount in privacy mode', () => {
    renderWithLocalization(
      <MoneyApiActivityDetails
        activity={cardActivity}
        privacyMode
        onBack={onBack}
      />,
    );

    expect(
      screen.getByTestId('money-api-activity-details-hero-amount'),
    ).toHaveTextContent('•'.repeat(9));
  });
});
