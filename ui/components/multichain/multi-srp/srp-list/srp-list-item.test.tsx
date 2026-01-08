import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { type AccountGroupId } from '@metamask/account-api';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { SrpListItem } from './srp-list-item';

const mockAccountId = 'mock-account-id' as AccountGroupId;
const mockAccountName = 'Mock Account Name';
const mockBalance = '$100.00';

const render = (mockAccount: InternalAccountWithBalance) => {
  const store = configureMockStore([thunk])(mockState);
  return renderWithProvider(
    <SrpListItem
      accountId={mockAccountId}
      accountName={mockAccountName}
      balance={mockBalance}
    />,
    store,
  );
};

describe('SrpListItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders account name', () => {
    const { getByText } = render();

    expect(getByText(mockAccountName)).toBeInTheDocument();
  });

  it('calls useMultichainAccountTotalFiatBalance with correct account', () => {
    const { getByText } = render();

    expect(getByText(mockBalance)).toBeInTheDocument();
  });
});
