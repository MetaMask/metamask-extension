import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getAllScopesFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
} from '@metamask/chain-agnostic-permission';
import { toCaipAccountId } from '@metamask/utils';
import {
  AccountGroupType,
  AccountWalletId,
  AccountGroupId,
} from '@metamask/account-api';
import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import {
  getAllPermittedAccountsForCurrentTab,
  getOriginOfCurrentTab,
  getPermissions,
} from '../../../selectors';
import { getCaip25CaveatValueFromPermissions } from '../../../pages/permissions-connect/connect-page/utils';
import { supportsChainIds } from '../../../hooks/useAccountGroupsForPermissions';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { selectShowConnectAccountGroupToast } from './selectors';

jest.mock('@metamask/chain-agnostic-permission', () => ({
  getAllScopesFromCaip25CaveatValue: jest.fn(),
  isInternalAccountInPermittedAccountIds: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getAlertEnabledness: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getAllPermittedAccountsForCurrentTab: jest.fn(),
  getOriginOfCurrentTab: jest.fn(),
  getPermissions: jest.fn(),
}));

jest.mock('../../../pages/permissions-connect/connect-page/utils', () => ({
  getCaip25CaveatValueFromPermissions: jest.fn(),
}));

jest.mock('../../../hooks/useAccountGroupsForPermissions', () => ({
  supportsChainIds: jest.fn(),
}));

const mockGetAlertEnabledness = getAlertEnabledness as jest.MockedFunction<
  typeof getAlertEnabledness
>;
const mockGetAllPermittedAccountsForCurrentTab =
  getAllPermittedAccountsForCurrentTab as jest.MockedFunction<
    typeof getAllPermittedAccountsForCurrentTab
  >;
const mockGetOriginOfCurrentTab = getOriginOfCurrentTab as jest.MockedFunction<
  typeof getOriginOfCurrentTab
>;
const mockGetPermissions = getPermissions as jest.MockedFunction<
  typeof getPermissions
>;
const mockGetCaip25CaveatValueFromPermissions =
  getCaip25CaveatValueFromPermissions as jest.MockedFunction<
    typeof getCaip25CaveatValueFromPermissions
  >;
const mockGetAllScopesFromCaip25CaveatValue =
  getAllScopesFromCaip25CaveatValue as jest.MockedFunction<
    typeof getAllScopesFromCaip25CaveatValue
  >;
const mockSupportsChainIds = supportsChainIds as jest.MockedFunction<
  typeof supportsChainIds
>;
const mockIsInternalAccountInPermittedAccountIds =
  isInternalAccountInPermittedAccountIds as jest.MockedFunction<
    typeof isInternalAccountInPermittedAccountIds
  >;

describe('#selectShowConnectAccountGroupToast', () => {
  const mockAccount1 = createMockInternalAccount({
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    address: '0x742d35Cc6634C0532925a3b8D4F25dE8B8C5C8B4',
    name: 'Account 1',
  });

  const mockAccount2 = createMockInternalAccount({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    address: '0x8ba1f109551bD432803012645Hac136c22C6cc65',
    name: 'Account 2',
  });

  const mockAccount3 = createMockInternalAccount({
    id: '12345678-9abc-def0-1234-56789abcdef0',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    name: 'Account 3',
  });

  const mockAccount4 = createMockInternalAccount({
    id: 'fedcba98-7654-3210-fedc-ba9876543210',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    name: 'Account 4',
  });

  const mockAccount5 = createMockInternalAccount({
    id: '11111111-2222-3333-4444-555555555555',
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    name: 'Account 5',
  });

  const createMockAccountGroup = (
    groupId: string,
    accounts: InternalAccount[],
  ): AccountGroupWithInternalAccounts => ({
    id: `entropy:01JKAF3DSGM3AB87EM9N0K41AJ/${groupId}` as AccountGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'MetaMask HD Wallet',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 0,
      },
    },
    walletName: 'MetaMask HD Wallet',
    walletId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ' as AccountWalletId,
    accounts,
  });

  const createMockCaip25CaveatValue = () => ({
    requiredScopes: {},
    optionalScopes: {},
    sessionProperties: {},
    isMultichainOrigin: false,
  });

  const baseState = {
    appState: {},
    metamask: {},
    activeTab: { origin: 'https://example.com' },
  } as const;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows toast', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const accountGroup = createMockAccountGroup('0', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    // Assert
    expect(result).toBe(true);
  });

  it('does not show toast when unconnected account alert is disabled', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: false });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const accountGroup = createMockAccountGroup('1', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(false);
  });

  it('does not show toast when account group does not support chain ids', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(false);

    const accountGroup = createMockAccountGroup('3', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(false);
  });

  it('does not show toast when there is no active tab origin', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue(null);
    mockGetPermissions.mockReturnValue(null);
    // @ts-expect-error - Testing null case
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(null);
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue([]);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const accountGroup = createMockAccountGroup('4', [
      mockAccount2,
      mockAccount3,
    ]);
    const stateWithoutOrigin = {
      ...baseState,
      activeTab: { origin: null },
    };

    const result = selectShowConnectAccountGroupToast(
      // @ts-expect-error - Testing null origin case
      stateWithoutOrigin,
      accountGroup,
    );

    expect(result).toBeFalsy();
  });

  it('does not show toast when no accounts are connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([]);

    const accountGroup = createMockAccountGroup('5', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(false);
  });

  it('does not show toast when account group is already connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
      toCaipAccountId('eip155', '1', mockAccount2.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockImplementation(
      (account, _) => {
        // Account 2 is connected (in the permitted accounts list)
        return account.id === mockAccount2.id;
      },
    );

    const accountGroup = createMockAccountGroup('6', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(false);
  });

  it('shows toast when only some accounts in the group are not connected', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockImplementation(
      (account, _) => {
        // Account 1 is connected, Account 2 and Account 3 are not
        return account.id === mockAccount1.id;
      },
    );

    const accountGroup = createMockAccountGroup('7', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(true);
  });

  it('handles case when permissions do not exist', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue(null);
    // @ts-expect-error - Testing null case
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(null);
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue([]);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const accountGroup = createMockAccountGroup('8', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(true);
    expect(mockGetCaip25CaveatValueFromPermissions).not.toHaveBeenCalled();
    expect(mockGetAllScopesFromCaip25CaveatValue).not.toHaveBeenCalled();
  });

  it('shows toast when multiple accounts are connected but account group is not', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
      toCaipAccountId('eip155', '1', mockAccount4.address),
      toCaipAccountId('eip155', '1', mockAccount5.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const accountGroup = createMockAccountGroup('9', [
      mockAccount2,
      mockAccount3,
    ]);

    const result = selectShowConnectAccountGroupToast(baseState, accountGroup);

    expect(result).toBe(true);
  });

  it('does not show toast when account group has no accounts', () => {
    mockGetAlertEnabledness.mockReturnValue({ unconnectedAccount: true });
    mockGetAllPermittedAccountsForCurrentTab.mockReturnValue([
      toCaipAccountId('eip155', '1', mockAccount1.address),
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue('https://example.com');
    mockGetPermissions.mockReturnValue({ caveats: [] });
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue(
      createMockCaip25CaveatValue(),
    );
    mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:1']);
    mockSupportsChainIds.mockReturnValue(true);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);

    const emptyAccountGroup = createMockAccountGroup('empty', []);

    const result = selectShowConnectAccountGroupToast(
      baseState,
      emptyAccountGroup,
    );

    expect(result).toBe(true);
  });
});
