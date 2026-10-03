import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { QuoteErrorInfo } from '@metamask/transaction-pay-controller';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { NoQuoteAlert } from './no-quote-alert';

const DETAIL_MOCK = ['Required - 100 USDC', 'Current - 10 USDC'];
const MESSAGE_MOCK = 'Quote simulation failed';
const COLLAPSED_MESSAGE = messages.alertNoPayTokenQuotesMessage.message;

function createError(overrides?: Partial<QuoteErrorInfo>): QuoteErrorInfo {
  return {
    detail: DETAIL_MOCK,
    message: MESSAGE_MOCK,
    reason: 'simulation-failed',
    ...overrides,
  };
}

function render(error: QuoteErrorInfo) {
  return renderWithLocalization(<NoQuoteAlert error={error} />);
}

describe('NoQuoteAlert', () => {
  it('renders the generic collapsed message by default', () => {
    render(createError());

    expect(screen.getByText(COLLAPSED_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(MESSAGE_MOCK)).not.toBeInTheDocument();

    DETAIL_MOCK.forEach((detail) => {
      expect(screen.queryByText(detail)).not.toBeInTheDocument();
    });
  });

  it('renders the insufficient balance collapsed message for that reason', () => {
    render(createError({ reason: 'insufficient-source-balance' }));

    expect(
      screen.getByText(messages.alertInsufficientPayMethodBalance.message),
    ).toBeInTheDocument();

    expect(screen.queryByText(COLLAPSED_MESSAGE)).not.toBeInTheDocument();
  });

  it('does not expand on a single click', () => {
    render(createError());

    fireEvent.click(screen.getByTestId('no-quote-alert'));

    expect(screen.queryByText(MESSAGE_MOCK)).not.toBeInTheDocument();
  });

  it('renders the error message and detail rows on double click', () => {
    render(createError());

    fireEvent.doubleClick(screen.getByTestId('no-quote-alert'));

    expect(screen.getByText(COLLAPSED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(MESSAGE_MOCK)).toBeInTheDocument();

    DETAIL_MOCK.forEach((detail) => {
      expect(screen.getByText(detail)).toBeInTheDocument();
    });
  });

  it('collapses again on a second double click', () => {
    render(createError());

    const alert = screen.getByTestId('no-quote-alert');

    fireEvent.doubleClick(alert);
    fireEvent.doubleClick(alert);

    expect(screen.getByText(COLLAPSED_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(MESSAGE_MOCK)).not.toBeInTheDocument();
  });

  it('renders the error message when expanded with no detail rows', () => {
    render(createError({ detail: undefined }));

    fireEvent.doubleClick(screen.getByTestId('no-quote-alert'));

    expect(screen.getByText(COLLAPSED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(MESSAGE_MOCK)).toBeInTheDocument();
  });
});
