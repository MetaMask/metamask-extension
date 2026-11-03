import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MoneyTransactionDetailsError } from './money-transaction-details-error';

const LONG_MESSAGE =
  "MetaMask Pay: Relay submit: Relay execute: 500... body/executionOptions must have required property 'referrer'";

describe('MoneyTransactionDetailsError', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when the message fits on one line', () => {
    it('renders the message without a show more control', () => {
      renderWithLocalization(
        <MoneyTransactionDetailsError message="Relay failed" />,
      );

      expect(
        screen.getByTestId('money-transaction-details-error'),
      ).toHaveTextContent('Relay failed');
      expect(
        screen.queryByTestId('money-transaction-details-error-toggle'),
      ).not.toBeInTheDocument();
    });
  });

  describe('when the message overflows', () => {
    beforeEach(() => {
      jest
        .spyOn(HTMLParagraphElement.prototype, 'scrollWidth', 'get')
        .mockReturnValue(400);
      jest
        .spyOn(HTMLParagraphElement.prototype, 'clientWidth', 'get')
        .mockReturnValue(80);
    });

    it('truncates the error text element itself', () => {
      renderWithLocalization(
        <MoneyTransactionDetailsError message={LONG_MESSAGE} />,
      );

      expect(screen.getByTestId('money-transaction-details-error')).toHaveClass(
        'truncate',
      );
    });

    it('shows the overflow toggle', () => {
      renderWithLocalization(
        <MoneyTransactionDetailsError message={LONG_MESSAGE} />,
      );

      expect(
        screen.getByTestId('money-transaction-details-error-toggle'),
      ).toHaveTextContent(messages.showMore.message);
    });

    it('expands and collapses the message', () => {
      renderWithLocalization(
        <MoneyTransactionDetailsError message={LONG_MESSAGE} />,
      );

      const toggle = screen.getByTestId(
        'money-transaction-details-error-toggle',
      );
      const error = screen.getByTestId('money-transaction-details-error');

      fireEvent.click(toggle);

      expect(toggle).toHaveTextContent(messages.showLess.message);
      expect(error).not.toHaveClass('truncate');

      fireEvent.click(toggle);

      expect(toggle).toHaveTextContent(messages.showMore.message);
      expect(error).toHaveClass('truncate');
    });
  });
});
