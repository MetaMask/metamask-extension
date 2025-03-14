import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { InternalAccountWithBalance } from '../../../../selectors';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { shortenAddress } from '../../../../helpers/utils/util';
import { SrpListItem } from './srp-list-item';

const mockTotalFiatBalance = '100';
const mockAccount: InternalAccountWithBalance = {
  ...createMockInternalAccount({
    name: 'Test Account',
    address: '0xB1BAF6A2f4A808937bb97a2F12CCF08F1233e3D9',
  }),
  balance: mockTotalFiatBalance,
};

const mocks = {
  useMultichainAccountTotalFiatBalance: jest.fn().mockReturnValue({
    totalFiatBalance: mockTotalFiatBalance,
  }),
};

jest.mock('../../../../hooks/useMultichainAccountTotalFiatBalance', () => ({
  useMultichainAccountTotalFiatBalance: (account: InternalAccountWithBalance) =>
    mocks.useMultichainAccountTotalFiatBalance(account),
}));
jest.mock('../../../../helpers/utils/util', () => ({
  ...jest.requireActual('../../../../helpers/utils/util'),
}));

const render = () => {
  const store = configureMockStore([thunk])(mockState);
  return renderWithProvider(<SrpListItem account={mockAccount} />, store);
};

describe('SrpListItem', () => {
  beforeEach(() => {
    // Reset mock implementations before each test
    mocks.useMultichainAccountTotalFiatBalance.mockReturnValue({
      totalFiatBalance: mockTotalFiatBalance,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders account name and shortened address', () => {
    const { getByText } = render();

    expect(getByText(mockAccount.metadata.name)).toBeInTheDocument();
    expect(getByText(shortenAddress(mockAccount.address))).toBeInTheDocument();
  });

  it('calls useMultichainAccountTotalFiatBalance with correct account', () => {
    render();

    expect(mocks.useMultichainAccountTotalFiatBalance).toHaveBeenCalledWith(
      mockAccount,
    );
  });
});
