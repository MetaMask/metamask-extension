import React from 'react';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import {
  Caip25EndowmentPermissionName,
  Caip25CaveatType,
} from '@metamask/chain-agnostic-permission';
import {
  AccountGroupType,
  AccountWalletType,
  AccountGroupId,
} from '@metamask/account-api';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import configureStore from '../../../../store/store';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import {
  AccountGroupWithInternalAccounts,
  AccountTreeState,
  InternalAccountsState,
} from '../../../../selectors/multichain-accounts/account-tree.types';
import { createMockMultichainAccountsState } from '../../../../selectors/multichain-accounts/test-utils';
import { PermissionsRequest } from '../../../../pages/permissions-connect/connect-page/utils';
import { useAccountGroupsForPermissions } from '../../../../hooks/useAccountGroupsForPermissions';
import { MultichainEditAccountsPage } from './multichain-edit-accounts-page';
import { MultichainEditAccountsPageWrapper } from './multichain-edit-account-wrapper';

jest.mock('../../../../hooks/useAccountGroupsForPermissions', () => ({
  useAccountGroupsForPermissions: jest.fn(),
}));

// Mock the MultichainEditAccountsPage component because we only need to test if the wrapper is passing the correct props to the component
jest.mock('./multichain-edit-accounts-page', () => ({
  MultichainEditAccountsPage: jest.fn(() => (
    <div data-testid="multichain-edit-accounts-page">Mocked Component</div>
  )),
}));

const MOCK_WALLET_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const MOCK_GROUP_ID_1 =
  'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;
const MOCK_GROUP_ID_2 =
  'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1' as AccountGroupId;

const mockEvmAccount1 = createMockInternalAccount({
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  name: 'EVM Account 1',
  address: '0x1111111111111111111111111111111111111111',
  type: EthAccountType.Eoa,
});

const mockEvmAccount2 = createMockInternalAccount({
  id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
  name: 'EVM Account 2',
  address: '0x2222222222222222222222222222222222222222',
  type: EthAccountType.Eoa,
});

const mockSolAccount1 = createMockInternalAccount({
  id: '9b6b30a0-3c87-4a33-9d10-a27a2aba2ba2',
  name: 'Solana Account 1',
  address: 'So1anaAddr1111111111111111111111111111111111',
  type: SolAccountType.DataAccount,
});

const createMockAccountGroups = (): AccountGroupWithInternalAccounts[] => [
  {
    id: MOCK_GROUP_ID_1,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Test Group 1',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 0,
      },
    },
    accounts: [
      {
        ...mockEvmAccount1,
        scopes: ['eip155:1'],
      },
      {
        ...mockSolAccount1,
        scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
      },
    ],
    walletName: 'Test Wallet 1',
    walletId: MOCK_WALLET_ID,
  },
  {
    id: MOCK_GROUP_ID_2,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Test Group 2',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 1,
      },
    },
    accounts: [
      {
        ...mockEvmAccount2,
        scopes: ['eip155:1'],
      },
    ],
    walletName: 'Test Wallet 2',
    walletId: MOCK_WALLET_ID,
  },
];

const createMockState = (overrides = {}) => {
  const accountTreeState = {
    selectedAccountGroup: MOCK_GROUP_ID_1,
    wallets: {
      [MOCK_WALLET_ID]: {
        id: MOCK_WALLET_ID,
        type: AccountWalletType.Entropy,
        metadata: {
          name: 'Test Wallet 1',
          entropy: {
            id: '01JKAF3DSGM3AB87EM9N0K41AJ',
          },
        },
        groups: {
          [MOCK_GROUP_ID_1]: {
            id: MOCK_GROUP_ID_1,
            type: AccountGroupType.MultichainAccount,
            metadata: {
              name: 'Test Group 1',
              pinned: false,
              hidden: false,
              entropy: {
                groupIndex: 0,
              },
            },
            accounts: [mockEvmAccount1.id, mockSolAccount1.id],
          },
          [MOCK_GROUP_ID_2]: {
            id: MOCK_GROUP_ID_2,
            type: AccountGroupType.MultichainAccount,
            metadata: {
              name: 'Test Group 2',
              pinned: false,
              hidden: false,
              entropy: {
                groupIndex: 1,
              },
            },
            accounts: [mockEvmAccount2.id],
          },
        },
      },
    },
  };

  const internalAccountsState = {
    accounts: {
      [mockEvmAccount1.id]: {
        ...mockEvmAccount1,
        scopes: ['eip155:1'],
      },
      [mockEvmAccount2.id]: {
        ...mockEvmAccount2,
        scopes: ['eip155:1'],
      },
      [mockSolAccount1.id]: {
        ...mockSolAccount1,
        scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
      },
    },
    selectedAccount: mockEvmAccount1.id,
  };

  const mockMultichainState = createMockMultichainAccountsState(
    accountTreeState as unknown as AccountTreeState,
    internalAccountsState as unknown as InternalAccountsState,
  );

  return {
    ...mockMultichainState,
    metamask: {
      ...mockMultichainState.metamask,
      keyrings: [],
      defaultHomeActiveTabName: 'activity',
      ...overrides,
    },
  };
};

const createMockPermissions = (): PermissionsRequest => ({
  [Caip25EndowmentPermissionName]: {
    caveats: [
      {
        type: Caip25CaveatType,
        value: {
          optionalScopes: {},
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1111111111111111111111111111111111111111'],
            },
          },
          sessionProperties: {},
          isMultichainOrigin: false,
        },
      },
    ],
  },
});

const renderComponent = (
  props: {
    title?: string;
    permissions?: PermissionsRequest;
    onSubmit?: (accountGroups: AccountGroupId[]) => void;
    onClose?: () => void;
  } = {},
) => {
  const store = configureStore(createMockState());

  const defaultProps = {
    title: 'Edit Accounts',
    permissions: createMockPermissions(),
    onSubmit: jest.fn(),
    onClose: jest.fn(),
    defaultSelectedAccountGroups: [MOCK_GROUP_ID_1],
    supportedAccountGroups: createMockAccountGroups(),
    ...props,
  };

  return renderWithProvider(
    <MultichainEditAccountsPageWrapper {...defaultProps} />,
    store,
  );
};

const mockUseAccountGroupsForPermissions =
  useAccountGroupsForPermissions as jest.MockedFunction<
    typeof useAccountGroupsForPermissions
  >;
const mockMultichainEditAccountsPage =
  MultichainEditAccountsPage as jest.MockedFunction<
    typeof MultichainEditAccountsPage
  >;

describe('MultichainEditAccountsPageWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMultichainEditAccountsPage.mockClear();

    mockUseAccountGroupsForPermissions.mockReturnValue({
      connectedAccountGroups: [createMockAccountGroups()[0]], // 1 connected account group
      supportedAccountGroups: createMockAccountGroups(), // 2 supported account groups
      existingConnectedCaipAccountIds: [],
      connectedAccountGroupWithRequested: [createMockAccountGroups()[0]],
      caipAccountIdsOfConnectedAndRequestedAccountGroups: [],
      selectedAndRequestedAccountGroups: createMockAccountGroups(),
    });
  });

  it('passes correct props to MultichainEditAccountsPage with default values', () => {
    renderComponent();

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Accounts',
        defaultSelectedAccountGroups: [MOCK_GROUP_ID_1],
        supportedAccountGroups: createMockAccountGroups(),
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
      }),
      expect.any(Object), // React ref
    );
  });

  it('calls useAccountGroupsForPermissions with correct parameters', () => {
    const mockPermissions = createMockPermissions();

    renderComponent({ permissions: mockPermissions });

    expect(mockUseAccountGroupsForPermissions).toHaveBeenCalledWith(
      expect.objectContaining({
        optionalScopes: {},
        requiredScopes: expect.any(Object),
        sessionProperties: {},
        isMultichainOrigin: false,
      }),
      expect.any(Array), // requestedCaipAccountIds
      expect.any(Array), // requestedCaipChainIds
      expect.any(Array), // requestedNamespacesWithoutWallet
    );
  });

  it('passes custom props to MultichainEditAccountsPage', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();
    const mockTitle = 'Custom Title';

    renderComponent({
      title: mockTitle,
      onSubmit: mockOnSubmit,
      onClose: mockOnClose,
    });

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockTitle,
        defaultSelectedAccountGroups: [MOCK_GROUP_ID_1],
        supportedAccountGroups: createMockAccountGroups(),
        onSubmit: mockOnSubmit,
        onClose: mockOnClose,
      }),
      expect.any(Object), // React ref
    );
  });

  it('passes empty defaultSelectedAccountGroups when no connected account groups', () => {
    mockUseAccountGroupsForPermissions.mockReturnValue({
      connectedAccountGroups: [],
      supportedAccountGroups: createMockAccountGroups(),
      existingConnectedCaipAccountIds: [],
      connectedAccountGroupWithRequested: [],
      caipAccountIdsOfConnectedAndRequestedAccountGroups: [],
      selectedAndRequestedAccountGroups: createMockAccountGroups(),
    });

    renderComponent();

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Accounts',
        defaultSelectedAccountGroups: [],
        supportedAccountGroups: createMockAccountGroups(),
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
      }),
      expect.any(Object), // React ref
    );
  });

  it('passes empty supportedAccountGroups when no supported account groups', () => {
    mockUseAccountGroupsForPermissions.mockReturnValue({
      connectedAccountGroups: [createMockAccountGroups()[0]],
      supportedAccountGroups: [],
      existingConnectedCaipAccountIds: [],
      connectedAccountGroupWithRequested: [createMockAccountGroups()[0]],
      caipAccountIdsOfConnectedAndRequestedAccountGroups: [],
      selectedAndRequestedAccountGroups: [],
    });

    renderComponent();

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Accounts',
        defaultSelectedAccountGroups: [MOCK_GROUP_ID_1],
        supportedAccountGroups: [],
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
      }),
      expect.any(Object), // React ref
    );
  });

  it('passes correct props when permissions is undefined', () => {
    renderComponent({ permissions: undefined });

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Accounts',
        defaultSelectedAccountGroups: [MOCK_GROUP_ID_1],
        supportedAccountGroups: createMockAccountGroups(),
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
      }),
      expect.any(Object), // React ref
    );
  });

  it('passes correct props when permissions is empty object', () => {
    renderComponent({ permissions: {} });

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Accounts',
        defaultSelectedAccountGroups: [MOCK_GROUP_ID_1],
        supportedAccountGroups: createMockAccountGroups(),
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
      }),
      expect.any(Object), // React ref
    );
  });

  it('passes multiple connected account groups as defaultSelectedAccountGroups', () => {
    mockUseAccountGroupsForPermissions.mockReturnValue({
      connectedAccountGroups: createMockAccountGroups(), // Both groups connected
      supportedAccountGroups: createMockAccountGroups(),
      existingConnectedCaipAccountIds: [],
      connectedAccountGroupWithRequested: createMockAccountGroups(),
      caipAccountIdsOfConnectedAndRequestedAccountGroups: [],
      selectedAndRequestedAccountGroups: createMockAccountGroups(),
    });

    renderComponent();

    expect(mockMultichainEditAccountsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Accounts',
        defaultSelectedAccountGroups: [MOCK_GROUP_ID_1, MOCK_GROUP_ID_2],
        supportedAccountGroups: createMockAccountGroups(),
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
      }),
      expect.any(Object), // React ref
    );
  });
});
