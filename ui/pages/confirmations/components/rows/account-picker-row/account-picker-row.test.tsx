import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { AccountPickerRowContent } from './account-picker-row';

jest.mock('../../../../../components/app/preferred-avatar', () => ({
  PreferredAvatar: () => <div data-testid="preferred-avatar" />,
}));

const mockStore = configureStore([thunk]);

const TEST_IDS = {
  row: 'account-picker-row',
  pill: 'account-picker-pill',
  name: 'account-picker-name',
  arrow: 'account-picker-arrow',
  sheet: 'account-picker-sheet',
  searchInput: 'account-picker-search',
  accountItem: 'account-picker-item',
};

const ACCOUNTS = [
  { id: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Account One' },
  { id: '0x1234567890abcdef1234567890abcdef12345678', name: 'Account Two' },
];

function renderContent(
  props: Partial<React.ComponentProps<typeof AccountPickerRowContent>> = {},
) {
  return renderWithProvider(
    <AccountPickerRowContent
      subAccounts={ACCOUNTS}
      selectedSubAccount={ACCOUNTS[0]}
      onSelect={jest.fn()}
      formatBalance={() => '$1'}
      title="Test account picker title"
      searchPlaceholder="Search"
      testIds={TEST_IDS}
      {...props}
    />,
    mockStore({}),
  );
}

describe('AccountPickerRowContent', () => {
  it('returns null when there are no sub-accounts', () => {
    const { container } = renderContent({
      subAccounts: [],
      selectedSubAccount: null,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('opens the picker with the provided title', () => {
    renderContent();

    expect(screen.queryByTestId(TEST_IDS.sheet)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(TEST_IDS.pill));

    expect(screen.getByTestId(TEST_IDS.sheet)).toBeInTheDocument();
    expect(screen.getByText('Test account picker title')).toBeInTheDocument();
  });

  it('filters accounts by search query', () => {
    renderContent();

    fireEvent.click(screen.getByTestId(TEST_IDS.pill));
    fireEvent.change(screen.getByTestId(TEST_IDS.searchInput), {
      target: { value: 'Two' },
    });

    expect(
      screen.queryByTestId(`${TEST_IDS.accountItem}-${ACCOUNTS[0].id}`),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`${TEST_IDS.accountItem}-${ACCOUNTS[1].id}`),
    ).toBeInTheDocument();
  });

  it('calls onSelect when an account is pressed', () => {
    const onSelect = jest.fn();
    renderContent({ onSelect });

    fireEvent.click(screen.getByTestId(TEST_IDS.pill));
    fireEvent.click(
      screen.getByTestId(`${TEST_IDS.accountItem}-${ACCOUNTS[1].id}`),
    );

    expect(onSelect).toHaveBeenCalledWith(ACCOUNTS[1].id);
  });

  it('renders fallback label when no account is selected', () => {
    renderContent({ selectedSubAccount: null });

    expect(screen.getAllByText('To').length).toBeGreaterThan(0);
  });

  it('displays the formatted balance for each account', () => {
    renderContent({
      formatBalance: (account) => `bal-${account.id.slice(-2)}`,
    });

    fireEvent.click(screen.getByTestId(TEST_IDS.pill));

    expect(screen.getByText('bal-12')).toBeInTheDocument();
    expect(screen.getByText('bal-78')).toBeInTheDocument();
  });
});
