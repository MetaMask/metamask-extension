import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { AccountGroupType } from '@metamask/account-api';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { CaipAccountId } from '@metamask/utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import * as actions from '../../../../store/actions';
import * as hooks from '../../../../hooks/useAccountGroupsForPermissions';
import {
  getTokenTransferPermissionsByOrigin,
  getPermissionMetaDataByOrigin,
} from '../../../../selectors/gator-permissions/gator-permissions';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../../../shared/lib/multichain/scope-utils';
import { PREVIOUS_ROUTE } from '../../../../helpers/constants/routes';
import { MultichainReviewPermissions } from './multichain-review-permissions-page';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useSearchParams: () => [
      new URLSearchParams('origin=https%3A%2F%2Ftest.dapp'),
    ],
    useLocation: () => ({
      pathname: '/test',
      search: '?origin=https%3A%2F%2Ftest.dapp',
      hash: '',
      state: null,
    }),
    matchPath: jest.fn(() => null),
  };
});

jest.mock('../../../../hooks/useAccountGroupsForPermissions', () => ({
  useAccountGroupsForPermissions: jest.fn(() => ({
    supportedAccountGroups: [],
    connectedAccountGroups: [],
    existingConnectedCaipAccountIds: [],
  })),
}));

jest.mock('../../../../store/actions', () => ({
  forceUpdateMetamaskState: jest.fn(),
  removePermissionsFor: jest.fn(() => ({ type: 'REMOVE_PERMISSIONS_FOR' })),
  requestAccountsAndChainPermissionsWithId: jest.fn(() =>
    Promise.resolve('test-request-id'),
  ),
  setPermittedAccounts: jest.fn(() => ({ type: 'SET_PERMITTED_ACCOUNTS' })),
}));

jest.mock('../../../../selectors/gator-permissions/gator-permissions', () => ({
  getPermissionMetaDataByOrigin: jest.fn(),
  getTokenTransferPermissionsByOrigin: jest.fn(),
}));

jest.mock('../../../../../shared/lib/multichain/scope-utils', () => ({
  ...jest.requireActual('../../../../../shared/lib/multichain/scope-utils'),
  getCaip25AccountIdsFromAccountGroupAndScope: jest.fn(),
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
      lastSelected: 0,
    },
    walletName: 'Test Wallet 1',
    walletId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ' as const,
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
      lastSelected: 0,
    },
    walletName: 'Test Wallet 2',
    walletId: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8' as const,
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
  MODAL_PAGE: 'modal-page',
  BACK_BUTTON: 'back-button',
  CONNECT_MORE_ACCOUNTS_BUTTON: 'connect-more-accounts-button',
  MULTICHAIN_ACCOUNT_CELL: (id: string) => `multichain-account-cell-${id}`,
  DISCONNECT_BUTTON: 'disconnect-button',
  DISCONNECT_ALL: 'disconnect-all',
  DISCONNECT_PERMISSIONS_MODAL: 'disconnect-permissions-modal',
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
  const pathname = `/test?origin=${encodeURIComponent('https://test.dapp')}`;
  return renderWithProvider(<MultichainReviewPermissions />, store, pathname);
};

const mockConnectedAccountGroups = () => {
  jest.spyOn(hooks, 'useAccountGroupsForPermissions').mockReturnValue({
    supportedAccountGroups: mockAccountGroups,
    connectedAccountGroups: [mockAccountGroups[0]],
    existingConnectedCaipAccountIds: [
      generateCaipAccountIds(mockAccountGroups)[0],
    ],
    connectedAccountGroupWithRequested: [mockAccountGroups[0]],
    caipAccountIdsOfConnectedAndRequestedAccountGroups: [
      generateCaipAccountIds(mockAccountGroups)[0],
    ],
    selectedAndRequestedAccountGroups: mockAccountGroups,
  });
};

describe('MultichainReviewPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getTokenTransferPermissionsByOrigin).mockReturnValue([]);
    jest.mocked(getPermissionMetaDataByOrigin).mockReturnValue({
      tokenTransfer: { count: 0, chains: [] },
    });
  });

  it('renders the edit accounts page', () => {
    const { getByTestId, getByText } = render();

    expect(getByTestId(TEST_IDS.MODAL_PAGE)).toBeInTheDocument();
    expect(
      getByText(messages.manageConnectedAccounts.message),
    ).toBeInTheDocument();
  });

  it('navigates back when the back button is clicked', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId(TEST_IDS.BACK_BUTTON));

    expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  describe('account selection', () => {
    beforeEach(() => {
      mockConnectedAccountGroups();
    });

    it('shows connected account groups', () => {
      const { getByTestId } = render();

      expect(
        getByTestId(TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[0].id)),
      ).toBeInTheDocument();
      expect(
        getByTestId(TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[1].id)),
      ).toBeInTheDocument();
    });

    it('dispatches setPermittedAccounts and navigates back when accounts are saved', async () => {
      const remainingCaipAccountIds = generateCaipAccountIds([
        mockAccountGroups[0],
        mockAccountGroups[1],
      ]);
      jest
        .mocked(getCaip25AccountIdsFromAccountGroupAndScope)
        .mockReturnValue(remainingCaipAccountIds);
      const setPermittedAccountsSpy = jest.spyOn(
        actions,
        'setPermittedAccounts',
      );

      const { getByTestId } = render();

      fireEvent.click(
        getByTestId(TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[1].id)),
      );
      fireEvent.click(getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON));

      await waitFor(() => {
        expect(setPermittedAccountsSpy).toHaveBeenCalledWith(
          'https://test.dapp',
          remainingCaipAccountIds,
        );
        expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
      });
    });

    it('dispatches setPermittedAccounts when deselecting some account groups', async () => {
      jest.spyOn(hooks, 'useAccountGroupsForPermissions').mockReturnValue({
        supportedAccountGroups: mockAccountGroups,
        connectedAccountGroups: mockAccountGroups,
        existingConnectedCaipAccountIds:
          generateCaipAccountIds(mockAccountGroups),
        connectedAccountGroupWithRequested: mockAccountGroups,
        caipAccountIdsOfConnectedAndRequestedAccountGroups:
          generateCaipAccountIds(mockAccountGroups),
        selectedAndRequestedAccountGroups: mockAccountGroups,
      });

      const remainingCaipAccountIds = generateCaipAccountIds([
        mockAccountGroups[0],
      ]);
      jest
        .mocked(getCaip25AccountIdsFromAccountGroupAndScope)
        .mockReturnValue(remainingCaipAccountIds);
      const setPermittedAccountsSpy = jest.spyOn(
        actions,
        'setPermittedAccounts',
      );

      const { getByTestId } = render();

      fireEvent.click(
        getByTestId(TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[1].id)),
      );
      fireEvent.click(getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON));

      await waitFor(() => {
        expect(setPermittedAccountsSpy).toHaveBeenCalledWith(
          'https://test.dapp',
          remainingCaipAccountIds,
        );
        expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
      });
    });

    it('disables Save when all accounts are deselected', () => {
      const { getByTestId } = render();

      fireEvent.click(
        getByTestId(TEST_IDS.MULTICHAIN_ACCOUNT_CELL(mockAccountGroups[0].id)),
      );

      expect(getByTestId(TEST_IDS.CONNECT_MORE_ACCOUNTS_BUTTON)).toBeDisabled();
    });
  });

  describe('disconnect', () => {
    beforeEach(() => {
      mockConnectedAccountGroups();
    });

    it('disconnects and navigates back when there are no gator permissions', () => {
      const removePermissionsForSpy = jest.spyOn(
        actions,
        'removePermissionsFor',
      );
      const { getByTestId } = render({
        subjects: {
          ...mockState.metamask.subjects,
          'https://test.dapp': {
            origin: 'https://test.dapp',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                parentCapability: Caip25EndowmentPermissionName,
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: [
                            'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                          ],
                        },
                      },
                      optionalScopes: {},
                      sessionProperties: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
        },
      });

      fireEvent.click(getByTestId(TEST_IDS.DISCONNECT_BUTTON));
      fireEvent.click(getByTestId(TEST_IDS.DISCONNECT_ALL));

      expect(removePermissionsForSpy).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });

    it('shows the gator permissions modal when token transfer permissions exist', () => {
      jest.mocked(getPermissionMetaDataByOrigin).mockReturnValue({
        tokenTransfer: {
          count: 2,
          chains: ['0x1'],
        },
      });

      const { getByTestId } = render();

      fireEvent.click(getByTestId(TEST_IDS.DISCONNECT_BUTTON));
      fireEvent.click(getByTestId(TEST_IDS.DISCONNECT_ALL));

      expect(
        getByTestId(TEST_IDS.DISCONNECT_PERMISSIONS_MODAL),
      ).toBeInTheDocument();
    });
  });
});
