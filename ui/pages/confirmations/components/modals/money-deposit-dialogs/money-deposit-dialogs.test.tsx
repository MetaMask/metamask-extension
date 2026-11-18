import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import {
  DottedTrigger,
  MONEY_APY_DIALOG_TEST_ID,
  MONEY_USD_DIALOG_TEST_ID,
  MoneyApyDialog,
  MoneyUsdDialog,
} from '.';

const store = configureStore(mockState);

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
    expect(
      screen.getByText(
        messages.moneyAccountDepositApyDialogWhyChangesTitle.message,
      ),
    ).toBeInTheDocument();
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
