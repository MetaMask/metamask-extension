import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { onchainItem } from '../types/money-activity';
import type { MoneyActivityTransactionMeta } from '../constants/mock-activity-data';
import MOCK_MONEY_TRANSACTIONS from '../constants/mock-activity-data';
import { MoneyActivityList, MAX_PREVIEW_ITEMS } from './money-activity-list';

const previewItems = MOCK_MONEY_TRANSACTIONS.slice(0, MAX_PREVIEW_ITEMS).map(
  onchainItem,
);

describe('MoneyActivityList', () => {
  it('renders the empty copy when there are no items', () => {
    renderWithLocalization(<MoneyActivityList items={[]} />);

    expect(screen.getByTestId('money-activity-list')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyActivity.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyActivityPlaceholderDescription.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-activity-view-all'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(/money-activity-row-/u),
    ).not.toBeInTheDocument();
  });

  it('renders at most five preview rows', () => {
    renderWithLocalization(
      <MoneyActivityList items={MOCK_MONEY_TRANSACTIONS.map(onchainItem)} />,
    );

    expect(screen.getAllByTestId(/money-activity-row-money-tx-/u)).toHaveLength(
      MAX_PREVIEW_ITEMS,
    );
    expect(
      screen.queryByText(messages.moneyActivityPlaceholderDescription.message),
    ).not.toBeInTheDocument();
  });

  it('shows an enabled View all button when there are more than five items', () => {
    const onViewAll = jest.fn();
    renderWithLocalization(
      <MoneyActivityList
        items={MOCK_MONEY_TRANSACTIONS.map(onchainItem)}
        onViewAll={onViewAll}
      />,
    );

    const viewAll = screen.getByTestId('money-activity-view-all');
    expect(viewAll).toHaveTextContent(messages.moneyActivityViewAll.message);
    expect(viewAll).toBeEnabled();
    fireEvent.click(viewAll);
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('hides View all when there are five or fewer items', () => {
    renderWithLocalization(<MoneyActivityList items={previewItems} />);

    expect(
      screen.queryByTestId('money-activity-view-all'),
    ).not.toBeInTheDocument();
  });

  it('masks amounts in privacy mode', () => {
    const item = onchainItem(
      MOCK_MONEY_TRANSACTIONS.find(
        (tx) => tx.id === 'money-tx-deposited-fiat',
      ) as MoneyActivityTransactionMeta,
    );

    renderWithLocalization(<MoneyActivityList items={[item]} privacyMode />);

    expect(
      screen.getByTestId(`money-activity-row-primary-${item.id}`),
    ).toHaveTextContent('•'.repeat(9));
    expect(
      screen.getByTestId(`money-activity-row-fiat-${item.id}`),
    ).toHaveTextContent('•'.repeat(6));
  });

  it('renders pending and failed row chrome', () => {
    const confirmedDeposit = MOCK_MONEY_TRANSACTIONS.find(
      (tx) => tx.id === 'money-tx-deposited',
    );
    const failed = MOCK_MONEY_TRANSACTIONS.find(
      (tx) => tx.status === TransactionStatus.failed,
    );
    if (!confirmedDeposit || !failed) {
      throw new Error('missing deposit or failed mock');
    }

    const pending: MoneyActivityTransactionMeta = {
      ...confirmedDeposit,
      id: 'money-tx-depositing',
      status: TransactionStatus.submitted,
    };

    renderWithLocalization(
      <MoneyActivityList items={[onchainItem(pending), onchainItem(failed)]} />,
    );

    expect(
      screen.getByText(messages.moneyActivityDepositing.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyActivityDepositFailed.message),
    ).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('invokes onItemClick when a preview row is clicked', () => {
    const onItemClick = jest.fn();
    const items = MOCK_MONEY_TRANSACTIONS.map(onchainItem);
    renderWithLocalization(
      <MoneyActivityList items={items} onItemClick={onItemClick} />,
    );

    fireEvent.click(screen.getByTestId(`money-activity-row-${items[0].id}`));
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
  });
});
