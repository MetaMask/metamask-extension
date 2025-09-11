import { MultichainNetworkConfigurationsByChainIdState } from '../../../../shared/modules/selectors/networks';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  selectAccountGroupNameByInternalAccount,
  selectInternalAccountNameByAddress,
} from './accounts';

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountGroupsByAddress: jest.fn(),
}));

jest.mock('../../../helpers/utils/util', () => ({
  getAccountByAddress: jest.fn(),
}));

describe('selectAccountGroupNameByInternalAccount', () => {
  const mockState = {} as unknown as MultichainAccountsState &
    MultichainNetworkConfigurationsByChainIdState;
  const mockAccountGroups = [
    {
      id: 'group1',
      metadata: { name: 'Group 1' },
      accounts: [{ address: '0x123', metadata: { name: 'Account 1' } }],
    },
    {
      id: 'group2',
      metadata: { name: 'Group 2' },
      accounts: [{ address: '0x789', metadata: { name: 'Account 3' } }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getAccountGroupsByAddress as unknown as jest.Mock).mockReturnValue(
      mockAccountGroups,
    );
  });

  it('returns the correct account group name for a matching internal account', () => {
    const result = selectAccountGroupNameByInternalAccount(mockState, '0x123');

    expect(getAccountGroupsByAddress).toHaveBeenCalledWith(mockState, ['0x123']);
    expect(result).toBe('Group 1');
  });

  it('returns null when no group matches the internal account', () => {
    const result = selectAccountGroupNameByInternalAccount(
      mockState,

      '0x000',
    );

    expect(getAccountGroupsByAddress).toHaveBeenCalledWith(mockState, ['0x000']);
    expect(result).toBeNull();
  });

  it('returns null when internalAccount is undefined', () => {
    const result = selectAccountGroupNameByInternalAccount(
      mockState,
      undefined,
    );

    expect(getAccountGroupsByAddress).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

describe('selectInternalAccountNameByAddress', () => {
  const mockState = {} as unknown as MultichainAccountsState &
    MultichainNetworkConfigurationsByChainIdState;
  const mockAccountGroups = [
    {
      id: 'group1',
      metadata: { name: 'Group 1' },
      accounts: [
        { address: '0x123', metadata: { name: 'Account 1' } },
        { address: '0x789', metadata: { name: 'Account 3' } },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getAccountGroupsByAddress as unknown as jest.Mock).mockReturnValue(
      mockAccountGroups,
    );
  });

  it('returns the internal account name for a matching address', () => {
    (getAccountByAddress as jest.Mock).mockReturnValue({
      metadata: { name: 'Account 1' },
    });

    const result = selectInternalAccountNameByAddress(mockState, '0x123');

    expect(getAccountGroupsByAddress).toHaveBeenCalledWith(mockState, ['0x123']);
    expect(getAccountByAddress).toHaveBeenCalledWith(
      expect.arrayContaining(mockAccountGroups[0].accounts),
      '0x123',
    );
    expect(result).toBe('Account 1');
  });

  it('returns null when no account matches the address', () => {
    (getAccountByAddress as jest.Mock).mockReturnValue(undefined);

    const result = selectInternalAccountNameByAddress(mockState, '0x000');

    expect(getAccountGroupsByAddress).toHaveBeenCalledWith(mockState, ['0x000']);
    expect(getAccountByAddress).toHaveBeenCalledWith(
      expect.arrayContaining(mockAccountGroups[0].accounts),
      '0x000',
    );
    expect(result).toBeNull();
  });

  it('returns null when address is undefined', () => {
    const result = selectInternalAccountNameByAddress(mockState, undefined);

    expect(getAccountGroupsByAddress).not.toHaveBeenCalled();
    expect(getAccountByAddress).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
