import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { AccountTreeControllerState } from '@metamask/account-tree-controller';
import { toChecksumAddress } from 'ethereumjs-util';
import mockState from '../../../../../test/data/mock-state.json';
import {
  getSelectedAccountGroupFromAccountTree,
  getSelectedInternalAccountFromMockState,
} from '../../../../../test/jest/mocks';
import {
  InternalAccountWithBalance,
  MetaMaskReduxState,
} from '../../../../selectors';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { shortenAddress } from '../../../../helpers/utils/util';
import { SrpListItem } from './srp-list-item';

const mockTotalFiatBalance = '100';

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

const render = (mockAccount: InternalAccountWithBalance) => {
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

  const mockAccount: InternalAccountWithBalance = {
    ...getSelectedInternalAccountFromMockState(
      mockState as unknown as MetaMaskReduxState,
    ),
    balance: mockTotalFiatBalance,
  };
  const mockAccountGroup = getSelectedAccountGroupFromAccountTree(
    // TODO: Use widen type here.
    mockState.metamask
      .accountTree as unknown as AccountTreeControllerState['accountTree'],
  );

  it('renders account name and shortened address', () => {
    const { getByText } = render(mockAccount);

    expect(mockAccountGroup).toBeDefined();
    expect(mockAccountGroup.accounts).toContain(mockAccount.id);
    expect(getByText(mockAccountGroup.metadata.name)).toBeInTheDocument();
    expect(
      getByText(shortenAddress(toChecksumAddress(mockAccount.address))),
    ).toBeInTheDocument();
  });

  it('calls useMultichainAccountTotalFiatBalance with correct account', () => {
    render(mockAccount);

    expect(mocks.useMultichainAccountTotalFiatBalance).toHaveBeenCalledWith(
      mockAccount,
    );
  });
});
