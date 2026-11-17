import React from 'react';
import BigNumber from 'bignumber.js';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  DottedTrigger,
  formatCompactUsd,
  MONEY_APY_DIALOG_TEST_ID,
  MONEY_ESTIMATED_BALANCE_DIALOG_TEST_ID,
  MONEY_USD_DIALOG_TEST_ID,
  MoneyApyDialog,
  MoneyEstimatedBalanceDialog,
  MoneyUsdDialog,
} from '.';

const store = configureStore(mockState);

describe('formatCompactUsd', () => {
  it('omits trailing .00 for whole dollar amounts', () => {
    expect(formatCompactUsd(new BigNumber('100'))).toBe('$100');
    expect(formatCompactUsd(new BigNumber('100.00'))).toBe('$100');
    expect(formatCompactUsd(new BigNumber('1000'))).toBe('$1,000');
  });

  it('keeps two decimal places when cents are non-zero', () => {
    expect(formatCompactUsd(new BigNumber('106.2'))).toBe('$106.20');
    expect(formatCompactUsd(new BigNumber('99.95'))).toBe('$99.95');
  });

  it('collapses sub-cent dust to $0', () => {
    expect(formatCompactUsd(new BigNumber('0.004'))).toBe('$0');
  });

  it('returns empty string for non-finite values', () => {
    expect(formatCompactUsd(new BigNumber(NaN))).toBe('');
  });
});

describe('DottedTrigger', () => {
  it('renders a button with a dotted underline and invokes onClick', () => {
    const onClick = jest.fn();
    renderWithProvider(
      <DottedTrigger
        text="6.2% APY"
        onClick={onClick}
        data-testid="dotted-trigger"
      />,
      store,
    );

    const trigger = screen.getByTestId('dotted-trigger');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveTextContent('6.2% APY');
    expect(trigger).toHaveClass('underline', 'decoration-dotted');

    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('MoneyEstimatedBalanceDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProvider(
      <MoneyEstimatedBalanceDialog
        isOpen={false}
        onClose={jest.fn()}
        depositAmount={new BigNumber('100')}
        projectedBalanceFormatted="$106.20"
        apyPercentFormatted="6.2%"
      />,
      store,
    );

    expect(
      screen.queryByTestId(MONEY_ESTIMATED_BALANCE_DIALOG_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders the live title, APY subtitle, bullets, disclaimer, and closes via X', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <MoneyEstimatedBalanceDialog
        isOpen
        onClose={onClose}
        depositAmount={new BigNumber('100')}
        projectedBalanceFormatted="$106.20"
        apyPercentFormatted="6.2%"
      />,
      store,
    );

    expect(
      screen.getByTestId('money-estimated-balance-dialog-title'),
    ).toHaveTextContent('Your $100 could grow to $106.20');
    expect(
      screen.getByTestId('money-estimated-balance-dialog-subtitle'),
    ).toHaveTextContent(
      'Estimated balance after one year in MetaMask Money at 6.2% APY.',
    );
    expect(
      screen.getByText(
        messages.moneyAccountDepositEstBalanceDialogCompoundTitle.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.moneyAccountDepositEstBalanceDialogCompoundBody.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyAccountDepositNoLockupsTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyAccountDepositNoLockupsBody.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-estimated-balance-dialog-disclaimer'),
    ).toHaveTextContent(
      "This estimate assumes 6.2% APY for a full year. APY is variable and isn't guaranteed.",
    );

    fireEvent.click(
      screen.getByTestId(
        `${MONEY_ESTIMATED_BALANCE_DIALOG_TEST_ID}-close-button`,
      ),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MoneyApyDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProvider(
      <MoneyApyDialog
        isOpen={false}
        onClose={jest.fn()}
        apyPercentFormatted="6.2%"
      />,
      store,
    );

    expect(
      screen.queryByTestId(MONEY_APY_DIALOG_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders the APY sections and closes via X', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <MoneyApyDialog isOpen onClose={onClose} apyPercentFormatted="6.2%" />,
      store,
    );

    expect(screen.getByTestId('money-apy-dialog-title')).toHaveTextContent(
      '6.2% APY',
    );
    expect(screen.getByTestId('money-apy-dialog-subtitle')).toHaveTextContent(
      messages.moneyAccountDepositApyDialogSubtitle.message,
    );
    expect(screen.getByTestId('money-apy-dialog-lead')).toHaveTextContent(
      messages.moneyAccountDepositApyDialogLead.message,
    );
    expect(
      screen.getByText(messages.moneyHowItWorks.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.moneyAccountDepositApyDialogHowItWorksBody.message,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Why it changes')).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.moneyAccountDepositApyDialogWhyChangesBody.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.moneyAccountDepositApyDialogWhereItComesFromTitle.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.moneyAccountDepositApyDialogWhereItComesFromBody.message,
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId(`${MONEY_APY_DIALOG_TEST_ID}-close-button`),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MoneyUsdDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProvider(
      <MoneyUsdDialog
        isOpen={false}
        onClose={jest.fn()}
        receiveAmountFormatted="$100"
        apyPercentFormatted="6.2%"
      />,
      store,
    );

    expect(
      screen.queryByTestId(MONEY_USD_DIALOG_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders the receive amount, mUSD bullets, APY highlight, and closes via X', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <MoneyUsdDialog
        isOpen
        onClose={onClose}
        receiveAmountFormatted="$100"
        apyPercentFormatted="6.2%"
      />,
      store,
    );

    expect(screen.getByTestId('money-usd-dialog-title')).toHaveTextContent(
      "You'll receive $100 of MetaMask USD",
    );
    expect(screen.getByTestId('money-usd-dialog-lead')).toHaveTextContent(
      messages.moneyAccountDepositUsdDialogLead.message,
    );
    expect(
      screen.getByText(
        messages.moneyAccountDepositUsdDialogAlwaysWorthTitle.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.moneyAccountDepositUsdDialogBackedTitle.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-usd-dialog-earns-title'),
    ).toHaveTextContent('Earns up to 6.2% APY');
    expect(
      screen.getByText(messages.moneyAccountDepositNoLockupsTitle.message),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId(`${MONEY_USD_DIALOG_TEST_ID}-close-button`),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
