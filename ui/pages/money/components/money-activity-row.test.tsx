import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import MOCK_MONEY_TRANSACTIONS from '../constants/mock-activity-data';
import { accountsApiItem, onchainItem } from '../types/money-activity';
import { MoneyActivityRow } from './money-activity-row';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state?: unknown) => unknown) => selector({}),
}));

const deposited = onchainItem(
  MOCK_MONEY_TRANSACTIONS.find((tx) => tx.id === 'money-tx-deposited') ??
    MOCK_MONEY_TRANSACTIONS[0],
);

describe('MoneyActivityRow', () => {
  it('renders a non-interactive row when onItemClick is omitted', () => {
    renderWithLocalization(<MoneyActivityRow item={deposited} />);

    const row = screen.getByTestId(`money-activity-row-${deposited.id}`);
    expect(row.tagName).toBe('DIV');
    expect(row).toHaveTextContent(messages.moneyActivityDeposited.message);
  });

  it('renders a button that invokes onItemClick', () => {
    const onItemClick = jest.fn();
    renderWithLocalization(
      <MoneyActivityRow item={deposited} onItemClick={onItemClick} />,
    );

    const row = screen.getByTestId(`money-activity-row-${deposited.id}`);
    expect(row.tagName).toBe('BUTTON');
    fireEvent.click(row);
    expect(onItemClick).toHaveBeenCalledWith(deposited);
  });

  it('keeps Accounts API rows non-interactive even when onItemClick is set', () => {
    const onItemClick = jest.fn();
    const apiItem = accountsApiItem({
      kind: 'card',
      hash: '0xabc',
      time: 1,
      chainId: '0x1',
      token: {
        address: '0x1',
        symbol: 'mUSD',
        decimals: 6,
      },
      amount: '1000000',
      paidTo: '0xdef',
    });

    renderWithLocalization(
      <MoneyActivityRow item={apiItem} onItemClick={onItemClick} />,
    );

    const row = screen.getByTestId(`money-activity-row-${apiItem.id}`);
    expect(row.tagName).toBe('DIV');
    fireEvent.click(row);
    expect(onItemClick).not.toHaveBeenCalled();
  });
});
