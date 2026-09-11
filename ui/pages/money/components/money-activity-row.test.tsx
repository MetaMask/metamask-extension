import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import MOCK_MONEY_TRANSACTIONS from '../constants/mock-activity-data';
import { onchainItem } from '../types/money-activity';
import { MoneyActivityRow } from './money-activity-row';

const deposited = onchainItem(
  MOCK_MONEY_TRANSACTIONS.find((tx) => tx.id === 'money-tx-deposited') ??
    MOCK_MONEY_TRANSACTIONS[0],
);

describe('MoneyActivityRow', () => {
  it('renders a non-interactive row when onClick is omitted', () => {
    renderWithLocalization(<MoneyActivityRow item={deposited} />);

    const row = screen.getByTestId(`money-activity-row-${deposited.id}`);
    expect(row.tagName).toBe('DIV');
    expect(row).toHaveTextContent(messages.moneyActivityDeposited.message);
  });

  it('renders a button that invokes onClick', () => {
    const onClick = jest.fn();
    renderWithLocalization(
      <MoneyActivityRow item={deposited} onClick={onClick} />,
    );

    const row = screen.getByTestId(`money-activity-row-${deposited.id}`);
    expect(row.tagName).toBe('BUTTON');
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
