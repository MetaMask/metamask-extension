import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SRPListItem } from './srp-list-item';
import mockState from '../../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { InternalAccountWithBalance } from '../../../../selectors';
import { renderWithProvider } from '../../../../../test/jest/rendering';

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
  shortenAddress: jest.fn().mockReturnValue(mockAccount.address),
};

jest.mock('../../../../hooks/useMultichainAccountTotalFiatBalance', () => ({
  useMultichainAccountTotalFiatBalance: (account: InternalAccountWithBalance) =>
    mocks.useMultichainAccountTotalFiatBalance(account),
}));
jest.mock('../../../../helpers/utils/util', () => ({
  ...jest.requireActual('../../../../helpers/utils/util'),
  shortenAddress: (...args: any[]) => mocks.shortenAddress(...args),
}));

const render = () => {
  const store = configureMockStore([thunk])(mockState);
  return renderWithProvider(<SRPListItem account={mockAccount} />, store);
};

describe('SRPListItem', () => {
  beforeEach(() => {
    // Reset mock implementations before each test
    mocks.useMultichainAccountTotalFiatBalance.mockReturnValue({
      totalFiatBalance: mockTotalFiatBalance,
    });
    mocks.shortenAddress.mockReturnValue(mockAccount.address);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders account name and shortened address', () => {
    const { getByText } = render();

    expect(getByText(mockAccount.metadata.name)).toBeInTheDocument();
    expect(getByText(mockAccount.address)).toBeInTheDocument();
  });

  it('calls useMultichainAccountTotalFiatBalance with correct account', () => {
    render();

    expect(mocks.useMultichainAccountTotalFiatBalance).toHaveBeenCalledWith(
      mockAccount,
    );
  });
});
