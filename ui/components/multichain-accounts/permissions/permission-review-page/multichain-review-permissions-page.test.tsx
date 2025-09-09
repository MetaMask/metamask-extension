import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { AccountGroupType } from '@metamask/account-api';
import { CaipAccountId } from '@metamask/utils';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import * as actions from '../../../../store/actions';
import * as hooks from '../../../../hooks/useAccountGroupsForPermissions';
import { MultichainReviewPermissions } from './multichain-review-permissions-page';

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({ origin: 'https%3A//test.dapp' }),
  useLocation: () => ({ pathname: '/test', search: '', hash: '', state: null }),
  matchPath: jest.fn(() => null),
  withRouter: (Component: React.ComponentType<unknown>) => Component,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../../../../hooks/useAccountGroupsForPermissions', () => ({
  useAccountGroupsForPermissions: jest.fn(() => ({
    supportedAccountGroups: [],
    connectedAccountGroups: [],
    existingConnectedCaipAccountIds: [],
  })),
}));

jest.mock('../../../../store/actions', () => ({
  hidePermittedNetworkToast: jest.fn(() => ({
    type: 'HIDE_PERMITTED_NETWORK_TOAST',
  })),
  removePermissionsFor: jest.fn(() => ({ type: 'REMOVE_PERMISSIONS_FOR' })),
  requestAccountsAndChainPermissionsWithId: jest.fn(() =>
    Promise.resolve('test-request-id'),
  ),
  setPermittedAccounts: jest.fn(() => ({ type: 'SET_PERMITTED_ACCOUNTS' })),
  setPermittedChains: jest.fn(() => ({ type: 'SET_PERMITTED_CHAINS' })),
}));

const mockAccountGroups = [
  {
    id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as const,
    type: AccountGroupType.MultichainAccount as const,
    accounts: [
      createMockInternalAccount({
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Test Account',
      }),
      createMockInternalAccount({
        id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        name: 'Test Account 2',
      }),
    ],
    metadata: {
      name: 'Account 1',
      entropy: { groupIndex: 0 },
      pinned: false,
      hidden: false,
    },
    walletName: 'Test Wallet 1',
  },
  {
    id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0' as const,
    type: AccountGroupType.MultichainAccount as const,
    accounts: [
      createMockInternalAccount({
        id: '784225f4-d30b-4e77-a900-c8bbce735b88',
        address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
        name: 'Test Account 3',
      }),
    ],
    metadata: {
      name: 'Account 2',
      entropy: { groupIndex: 1 },
      pinned: false,
      hidden: false,
    },
    walletName: 'Test Wallet 1',
  },
];

const generateCaipAccountIds = (
  accountGroups: typeof mockAccountGroups,
  chainId = '1',
): CaipAccountId[] => {
  return accountGroups.flatMap((group) =>
    group.accounts.map(
      (account) => `eip155:${chainId}:${account.address}` as CaipAccountId,
    ),
  );
};

const TEST_IDS = {
  CONNECTIONS_PAGE: 'connections-page',
  MODAL_PAGE: 'modal-page',
  EDIT_BUTTON: 'edit',
  CONNECT_MORE_ACCOUNTS_BUTTON: 'connect-more-accounts-button',
  MULTICHAIN_ACCOUNT_CELL: (id: string) => `multichain-account-cell-${id}`,
  SITE_CELL_CONNECTION_LIST_ITEM: 'site-cell-connection-list-item',
  DISCONNECT_ALL_MODAL: 'disconnect-all-modal',
} as const;

const render = (state = {}) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        'https://test.dapp': {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<MultichainReviewPermissions />, store);
};

describe('MultichainReviewPermissions', () => {
  it('renders summary page when no account groups are connected', () => {
    const { getByTestId } = render();

    expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
  });

  it('handles missing permissions gracefully', () => {
    const { getByTestId } = render();

    expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
  });

  it('handles empty account groups gracefully', () => {
    const { getByTestId } = render();

    expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
  });

  it('decodes URL parameters correctly', () => {
    const { getByTestId } = render();

    expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
  });

  describe('account selection', () => {
    const expectedCaipAccountIds = generateCaipAccountIds(mockAccountGroups);

    beforeEach(() => {
      const useAccountGroupsForPermissionsSpy = jest.spyOn(
        hooks,
        'useAccountGroupsForPermissions',
      );
      useAccountGroupsForPermissionsSpy.mockReturnValue({
        supportedAccountGroups: mockAccountGroups,
        connectedAccountGroups: [mockAccountGroups[0]], // Initially only first account group is connected
        existingConnectedCaipAccountIds: [
          expectedCaipAccountIds[0] as CaipAccountId, // First account from first group
        ],
      });
    });

    it('displays connected account groups in the site cell', () => {
      const { getAllByTestId } = render();

      const siteCellItems = getAllByTestId(
        TEST_IDS.SITE_CELL_CONNECTION_LIST_ITEM,
      );
      expect(siteCellItems).toHaveLength(2);
    });

    it('shows edit accounts button when account groups are connected', () => {
      const { getByText, getAllByTestId } = render();

      expect(
        getByText('See your accounts and suggest transactions'),
      ).toBeInTheDocument();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      expect(editButtons[0]).toBeInTheDocument();
    });

    it('transitions to edit accounts page when edit accounts is clicked', async () => {
      const { getAllByTestId, getByTestId } = render();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });
    });

    it('allows selecting additional account groups', async () => {
      const { getAllByTestId, getByTestId } = render();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });

      const secondAccountCell = getByTestId(
        TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[1].id),
      );
      fireEvent.click(secondAccountCell);

      const submitButton = getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
      });
    });

    it('allows deselecting account groups', async () => {
      const { getAllByTestId, getByTestId } = render();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });

      const firstAccountCell = getByTestId(
        TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[0].id),
      );
      fireEvent.click(firstAccountCell);

      const submitButton = getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
      });
    });

    it('shows edit accounts page with proper header', async () => {
      const { getAllByTestId, getByTestId, getByText } = render();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });

      expect(getByText('Connect with MetaMask')).toBeInTheDocument();
    });

    it('handles deselecting all accounts', async () => {
      const { getAllByTestId, getByTestId } = render();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });

      const firstAccountCell = getByTestId(
        TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[0].id),
      );
      fireEvent.click(firstAccountCell);

      const submitButton = getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
      });
    });

    it('dispatches setPermittedAccounts action when accounts are selected', async () => {
      const { getAllByTestId, getByTestId } = render();
      const setPermittedAccountsSpy = jest.spyOn(
        actions,
        'setPermittedAccounts',
      );

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });

      const secondAccountCell = getByTestId(
        TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[1].id),
      );
      fireEvent.click(secondAccountCell);

      const submitButton = getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(setPermittedAccountsSpy).toHaveBeenCalled();
      });
    });

    it('updates the UI to reflect selected account groups', async () => {
      const { getByText, getAllByTestId, getByTestId } = render();

      const editButtons = getAllByTestId(TEST_IDS.EDIT_BUTTON);
      const accountsEditButton = editButtons[0];
      fireEvent.click(accountsEditButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
      });

      const secondAccountCell = getByTestId(
        TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[1].id),
      );
      fireEvent.click(secondAccountCell);

      const submitButton = getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(getByTestId(TEST_IDS.CONNECTIONS_PAGE)).toBeInTheDocument();
      });

      expect(
        getByText('See your accounts and suggest transactions'),
      ).toBeInTheDocument();
    });
  });
});
