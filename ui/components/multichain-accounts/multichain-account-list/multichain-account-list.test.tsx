import React from 'react';
import { screen, fireEvent, act, within } from '@testing-library/react';
import {
  AccountGroupId,
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
} from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MultichainAccountList,
  MultichainAccountListProps,
} from './multichain-account-list';

jest.mock('../../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...actual,
    trace: jest.fn(),
    endTrace: jest.fn(),
  };
});

jest.mock('../../../selectors/multichain-accounts/account-tree', () => {
  const actual = jest.requireActual(
    '../../../selectors/multichain-accounts/account-tree',
  );
  return {
    ...actual,
    getAccountGroupsByAddress: jest.fn(),
  };
});

jest.mock('@metamask/chain-agnostic-permission', () => {
  const actual = jest.requireActual('@metamask/chain-agnostic-permission');
  return {
    ...actual,
    isInternalAccountInPermittedAccountIds: jest.fn(),
  };
});

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockGetAccountGroupsByAddress = jest.requireMock(
  '../../../selectors/multichain-accounts/account-tree',
).getAccountGroupsByAddress;

const mockIsInternalAccountInPermittedAccountIds = jest.requireMock(
  '@metamask/chain-agnostic-permission',
).isInternalAccountInPermittedAccountIds;

jest.mock('../../../store/actions', () => {
  const actualActions = jest.requireActual('../../../store/actions');
  return {
    ...actualActions,
    setAccountGroupName: jest.fn().mockImplementation(() => {
      return async function () {
        await Promise.resolve();
        return true;
      };
    }),
    setSelectedMultichainAccount: jest.fn().mockImplementation(() => {
      return async function () {
        await Promise.resolve();
      };
    }),
    setAccountGroupPinned: jest.fn().mockImplementation(() => {
      return async function () {
        await Promise.resolve();
      };
    }),
    setAccountGroupHidden: jest.fn().mockImplementation(() => {
      return async function () {
        await Promise.resolve();
      };
    }),
  };
});

const mockSetAccountGroupName = jest.requireMock(
  '../../../store/actions',
).setAccountGroupName;

const mockSetSelectedMultichainAccount = jest.requireMock(
  '../../../store/actions',
).setSelectedMultichainAccount;

const popoverOpenSelector = '.mm-popover--open';
const menuButtonSelector = '.multichain-account-cell-popover-menu-button';
const modalHeaderSelector = '.mm-modal-header';
const walletHeaderTestId = 'multichain-account-tree-wallet-header';
const accountNameInputTestId = 'account-name-input';

const mockWalletOneEntropySource = '01JKAF3DSGM3AB87EM9N0K41AJ';
const mockWalletTwoEntropySource = '01JKAF3PJ247KAM6C03G5Q0NP8';

const walletOneId = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletOneEntropySource,
);
const walletOneGroupId = `${walletOneId}/0` as AccountGroupId;
const walletTwoId = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletTwoEntropySource,
);
const walletTwoGroupId = `${walletTwoId}/0` as AccountGroupId;

const mockWallets = {
  [walletOneId]: {
    id: walletOneId,
    type: AccountWalletType.Entropy,
    metadata: {
      name: 'Wallet 1',
      entropy: {
        id: mockWalletOneEntropySource,
      },
    },
    status: 'ready',
    groups: {
      [walletOneGroupId]: {
        id: walletOneGroupId,
        type: AccountGroupType.MultichainAccount,
        metadata: {
          name: 'Account 1 from wallet 1',
          entropy: {
            groupIndex: 0,
          },
          pinned: false,
          hidden: false,
        },
        accounts: ['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'],
      },
    },
  },
  [walletTwoId]: {
    id: walletTwoId,
    type: AccountWalletType.Entropy,
    metadata: {
      name: 'Wallet 2',
      entropy: {
        id: mockWalletTwoEntropySource,
      },
    },
    groups: {
      [walletTwoGroupId]: {
        id: walletTwoGroupId,
        type: AccountGroupType.MultichainAccount,
        metadata: {
          name: 'Account 1 from wallet 2',
          entropy: {
            groupIndex: 0,
          },
          pinned: false,
          hidden: false,
        },
        accounts: ['784225f4-d30b-4e77-a900-c8bbce735b88'],
      },
    },
  },
} as AccountTreeWallets;

describe('MultichainAccountList', () => {
  const defaultProps: MultichainAccountListProps = {
    wallets: mockWallets,
    selectedAccountGroups: [walletOneGroupId],
  };

  const renderComponent = (props = {}, state = mockDefaultState) => {
    const store = configureStore(state);

    return renderWithProvider(
      <MultichainAccountList {...defaultProps} {...props} />,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountGroupsByAddress.mockReturnValue([]);
    mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);
  });

  it('renders wallet headers and account cells correctly', () => {
    renderComponent();

    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();

    const walletHeaders = screen.getAllByTestId(walletHeaderTestId);
    expect(walletHeaders).toHaveLength(2);

    expect(
      screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
    ).toBeInTheDocument();

    expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 1 from wallet 2')).toBeInTheDocument();
  });

  it('does not render wallet headers based on prop', () => {
    renderComponent({ displayWalletHeader: false });

    expect(screen.queryByText('Wallet 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Wallet 2')).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
    ).toBeInTheDocument();

    expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 1 from wallet 2')).toBeInTheDocument();
  });

  it('marks only the selected account with a check icon and dispatches action on click', () => {
    renderComponent();

    // With default props, checkboxes should not be shown (showAccountCheckbox defaults to false)
    // Check that no checkboxes are present
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // Selected icon should be present for the selected account
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-indicator`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();

    // Find and click the second account cell (wallet two)
    const accountCell = screen.getByTestId(
      `multichain-account-cell-${walletTwoGroupId}`,
    );
    accountCell.click();

    // Verify that the action was dispatched with the correct account group ID
    expect(mockSetSelectedMultichainAccount).toHaveBeenCalledWith(
      walletTwoGroupId,
    );
    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('updates selected account when selectedAccountGroup changes', () => {
    const { rerender } = renderComponent();

    // With default props, no checkboxes should be shown (showAccountCheckbox defaults to false)
    let checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // Selected icon should be present for the selected account
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-indicator`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();

    // Change the selected account to wallet two
    rerender(
      <MultichainAccountList
        wallets={mockWallets}
        selectedAccountGroups={[walletTwoGroupId]}
      />,
    );

    // Still no checkboxes should be present
    checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // Now wallet two should have the selected icon
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-indicator`,
      ),
    ).toBeInTheDocument();
  });

  it('shows no checkboxes and no selected icons when selectedAccountGroups is empty', () => {
    renderComponent({ selectedAccountGroups: [] });

    // No checkboxes should be present
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    // No selected icons should be present since no accounts are marked as selected
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();
  });

  it('handles multiple account groups within a single wallet', () => {
    const secondGroupId = `${walletOneId}/1`;
    const multiGroupWallets = {
      [walletOneId]: {
        ...mockWallets[walletOneId],
        groups: {
          [walletOneGroupId]: {
            ...mockWallets[walletOneId].groups[walletOneGroupId],
          },
          [secondGroupId]: {
            id: secondGroupId,
            metadata: {
              name: 'Account 2 from wallet 1',
            },
            accounts: ['784225f4-d30b-4e77-a900-c8bbce735b88'],
          },
        },
      },
    };

    renderComponent(
      { wallets: multiGroupWallets },
      {
        ...mockDefaultState,
        metamask: {
          ...mockDefaultState.metamask,
          accountTree: {
            ...mockDefaultState.metamask.accountTree,
            // @ts-expect-error - multiGroupWallets does not follow the exact structure due to test simplification
            wallets: multiGroupWallets,
          },
        },
      },
    );

    // With displayWalletHeader=true (default), wallet header should be shown
    expect(screen.queryAllByTestId(walletHeaderTestId)).toHaveLength(1);
    expect(
      screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`multichain-account-cell-${secondGroupId}`),
    ).toBeInTheDocument();

    expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2 from wallet 1')).toBeInTheDocument();
  });

  it('opens account rename modal when clicking rename in menu and handles form submission', async () => {
    renderComponent();

    // Find the menu button for the first account and click it
    const menuButton = document.querySelector(menuButtonSelector);
    expect(menuButton).toBeInTheDocument();

    await act(async () => {
      if (menuButton) {
        fireEvent.click(menuButton);
      }
    });

    // Find the popover
    const popover = document.querySelector(popoverOpenSelector);
    expect(popover).toBeInTheDocument();

    // Find all menu items within the popover
    const menuItems = popover
      ? within(popover as HTMLElement).getAllByText(/\w+/u)
      : [];

    // Find the "Rename" option by text
    const renameOption = menuItems.find(
      (item) => item.textContent === 'Rename',
    );
    expect(renameOption).toBeInTheDocument();

    await act(async () => {
      if (renameOption) {
        fireEvent.click(renameOption);
      }
    });

    // Verify the modal is open by finding the modal header
    const modalHeader = document.querySelector(modalHeaderSelector);
    expect(modalHeader).toBeInTheDocument();

    // Find the header text inside the modal
    if (modalHeader) {
      const headerText = within(modalHeader as HTMLElement).getByText('Rename');
      expect(headerText).toBeInTheDocument();
    }

    // Find the actual input element directly
    const inputContainer = screen.getByTestId(accountNameInputTestId);
    // Get the input element inside the container using a more direct selector
    const inputElement = inputContainer.querySelector('input');
    expect(inputElement).toBeInTheDocument();

    // Enter a new name
    const newAccountName = 'Renamed Account';
    await act(async () => {
      if (inputElement) {
        fireEvent.change(inputElement, { target: { value: newAccountName } });
      }
    });

    // Find and click the confirmation button
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeInTheDocument();

    // The button should no longer be disabled after entering text
    expect(confirmButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Verify the action was dispatched with the correct parameters
    expect(mockSetAccountGroupName).toHaveBeenCalledWith(
      walletOneGroupId,
      newAccountName,
    );

    // Verify the modal is closed after submission
    expect(
      screen.queryByTestId(accountNameInputTestId),
    ).not.toBeInTheDocument();
  });

  it('opens account rename modal and closes it without saving', async () => {
    renderComponent();

    // Find the menu button for the first account and click it
    const menuButton = document.querySelector(menuButtonSelector);
    expect(menuButton).toBeInTheDocument();

    await act(async () => {
      if (menuButton) {
        fireEvent.click(menuButton);
      }
    });

    // Find the popover
    const popover = document.querySelector(popoverOpenSelector);
    expect(popover).toBeInTheDocument();

    // Find all menu items within the popover
    const menuItems = popover
      ? within(popover as HTMLElement).getAllByText(/\w+/u)
      : [];

    // Find the "Rename" option by text
    const renameOption = menuItems.find(
      (item) => item.textContent === 'Rename',
    );
    expect(renameOption).toBeInTheDocument();

    await act(async () => {
      if (renameOption) {
        fireEvent.click(renameOption);
      }
    });

    // Verify that the modal is open
    const modalHeader = document.querySelector(modalHeaderSelector);
    expect(modalHeader).toBeInTheDocument();

    // Find the close button by aria-label
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Verify the modal is closed and action was not called
    expect(
      screen.queryByTestId(accountNameInputTestId),
    ).not.toBeInTheDocument();
    expect(mockSetAccountGroupName).not.toHaveBeenCalled();
  });

  describe('Menu state management', () => {
    it('opens menu for specific account when menu button is clicked', async () => {
      renderComponent();

      // Initially no menus should be open
      expect(
        document.querySelector(popoverOpenSelector),
      ).not.toBeInTheDocument();

      // Click first account's menu button
      const firstMenuButton = document.querySelector(menuButtonSelector);
      expect(firstMenuButton).toBeInTheDocument();

      await act(async () => {
        if (firstMenuButton) {
          fireEvent.click(firstMenuButton);
        }
      });

      // Menu should now be open
      expect(document.querySelector(popoverOpenSelector)).toBeInTheDocument();
    });

    it('closes menu when same menu button is clicked twice', async () => {
      renderComponent();

      const menuButton = document.querySelector(menuButtonSelector);
      expect(menuButton).toBeInTheDocument();

      // Click to open
      await act(async () => {
        if (menuButton) {
          fireEvent.click(menuButton);
        }
      });
      expect(document.querySelector(popoverOpenSelector)).toBeInTheDocument();

      // Click again to close
      await act(async () => {
        if (menuButton) {
          fireEvent.click(menuButton);
        }
      });
      expect(
        document.querySelector(popoverOpenSelector),
      ).not.toBeInTheDocument();
    });

    it('switches between menus when different menu buttons are clicked', async () => {
      renderComponent();

      const menuButtons = document.querySelectorAll(menuButtonSelector);
      expect(menuButtons.length).toBeGreaterThanOrEqual(2);

      // Click first menu button
      await act(async () => {
        fireEvent.click(menuButtons[0]);
      });

      const openPopover = document.querySelector(popoverOpenSelector);
      expect(openPopover).toBeInTheDocument();

      // Click second menu button
      await act(async () => {
        fireEvent.click(menuButtons[1]);
      });

      // Should still have exactly one open popover (switched to second menu)
      const openPopovers = document.querySelectorAll(popoverOpenSelector);
      expect(openPopovers).toHaveLength(1);
    });
  });

  describe('Checkbox functionality', () => {
    it('displays checkboxes when showAccountCheckbox is true', () => {
      renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });

      // Check that checkboxes are rendered for both accounts
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('does not display checkboxes when showAccountCheckbox is false', () => {
      renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: false,
      });

      // Check that no checkboxes are rendered
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('shows correct checkbox states based on selected accounts', () => {
      renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // First checkbox (wallet one) should be checked
      expect(checkboxes[0]).toBeChecked();

      // Second checkbox (wallet two) should not be checked
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('shows correct checkbox states when multiple accounts are selected', () => {
      renderComponent({
        selectedAccountGroups: [walletOneGroupId, walletTwoGroupId],
        showAccountCheckbox: true,
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Both checkboxes should be checked
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('handles checkbox click to select unselected account', () => {
      renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Click the unchecked checkbox (wallet two)
      fireEvent.click(checkboxes[1]);

      // Verify that the action was dispatched with the correct account group ID
      expect(mockSetSelectedMultichainAccount).toHaveBeenCalledWith(
        walletTwoGroupId,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('handles checkbox click to deselect selected account', () => {
      renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Click the checked checkbox (wallet one)
      fireEvent.click(checkboxes[0]);

      // Verify that the action was dispatched with the correct account group ID
      expect(mockSetSelectedMultichainAccount).toHaveBeenCalledWith(
        walletOneGroupId,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('updates checkbox states when selectedAccountGroups prop changes', () => {
      const { rerender } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });

      let checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();

      // Change selection to wallet two
      rerender(
        <MultichainAccountList
          wallets={mockWallets}
          selectedAccountGroups={[walletTwoGroupId]}
          showAccountCheckbox={true}
        />,
      );

      checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('removes checkboxes when showAccountCheckbox becomes false', () => {
      const { rerender } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });

      // Initially checkboxes should be present
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);

      // Change showAccountCheckbox to false
      rerender(
        <MultichainAccountList
          wallets={mockWallets}
          selectedAccountGroups={[walletOneGroupId]}
          showAccountCheckbox={false}
        />,
      );

      // Checkboxes should be removed
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('shows checkboxes when showAccountCheckbox becomes true', () => {
      const { rerender } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: false,
      });

      // Initially no checkboxes should be present
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

      // Change showAccountCheckbox to true
      rerender(
        <MultichainAccountList
          wallets={mockWallets}
          selectedAccountGroups={[walletOneGroupId]}
          showAccountCheckbox={true}
        />,
      );

      // Checkboxes should now be present
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
      expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
    });

    it('checkboxes and selected icons are mutually exclusive', () => {
      const { rerender } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: false,
      });

      // With checkboxes disabled, selected icon should be visible
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
      expect(
        screen.getByTestId(
          `multichain-account-cell-${walletOneGroupId}-selected-indicator`,
        ),
      ).toBeInTheDocument();

      // Enable checkboxes
      rerender(
        <MultichainAccountList
          wallets={mockWallets}
          selectedAccountGroups={[walletOneGroupId]}
          showAccountCheckbox={true}
        />,
      );

      // Now checkboxes should be visible and selected icon should be hidden
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      expect(
        screen.queryByTestId(
          `multichain-account-cell-${walletOneGroupId}-selected-indicator`,
        ),
      ).not.toBeInTheDocument();
    });

    it('hides account menu (3 dots) when showAccountCheckbox is true', () => {
      const { rerender } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: false,
      });

      // With checkboxes disabled, menu buttons should be visible
      let menuButtons = document.querySelectorAll(menuButtonSelector);
      expect(menuButtons.length).toBe(2);

      // Enable checkboxes
      rerender(
        <MultichainAccountList
          wallets={mockWallets}
          selectedAccountGroups={[walletOneGroupId]}
          showAccountCheckbox={true}
        />,
      );

      // With checkboxes enabled, menu buttons should be hidden
      menuButtons = document.querySelectorAll(menuButtonSelector);
      expect(menuButtons.length).toBe(0);
    });
  });

  describe('Connection Status', () => {
    it('does not show connection status when showConnectionStatus is false', () => {
      renderComponent({
        showConnectionStatus: false,
      });

      expect(
        screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).toBeInTheDocument();

      // Connection badge dot and tooltip should not render when disabled
      expect(
        screen.queryAllByTestId('multichain-badge-status__tooltip'),
      ).toHaveLength(0);
      expect(
        document.querySelectorAll('.multichain-badge-status__badge').length,
      ).toBe(0);
    });

    it('shows connected status for selected connected account', () => {
      mockGetAccountGroupsByAddress.mockReturnValue([
        {
          id: walletOneGroupId,
          accounts: [{ address: '0x123' }],
        },
      ]);
      mockIsInternalAccountInPermittedAccountIds.mockReturnValue(true);

      renderComponent({
        showConnectionStatus: true,
        selectedAccountGroups: [walletOneGroupId],
      });

      expect(
        screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).toBeInTheDocument();

      expect(mockGetAccountGroupsByAddress).toHaveBeenCalled();

      // BadgeStatus should be rendered for both accounts
      const badgeStatuses = screen.getAllByTestId('multichain-badge-status');
      expect(badgeStatuses).toHaveLength(2);

      // The selected account (walletOneGroupId) should show as connected/active
      // The connected account cell should have specific styling indicating active status
      expect(mockIsInternalAccountInPermittedAccountIds).toHaveBeenCalled();
    });

    it('shows connected to another account status for non-selected connected account', () => {
      mockGetAccountGroupsByAddress.mockReturnValue([
        {
          id: walletTwoGroupId,
          accounts: [{ address: '0x456' }],
        },
      ]);
      mockIsInternalAccountInPermittedAccountIds.mockReturnValue(true);

      renderComponent({
        showConnectionStatus: true,
        selectedAccountGroups: [walletOneGroupId], // Only wallet one is selected
      });

      expect(
        screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).toBeInTheDocument();

      expect(mockGetAccountGroupsByAddress).toHaveBeenCalled();

      // BadgeStatus should be rendered for both accounts
      const badgeStatuses = screen.getAllByTestId('multichain-badge-status');
      expect(badgeStatuses).toHaveLength(2);

      // Wallet two is connected but not selected, wallet one is selected but not connected
      // This test verifies that connection status is displayed correctly for both scenarios
      expect(mockIsInternalAccountInPermittedAccountIds).toHaveBeenCalled();
    });
  });
  describe('Pinned accounts section', () => {
    it('renders pinned section when there are pinned accounts', () => {
      const walletsWithPinnedAccounts = {
        [walletOneId]: {
          ...mockWallets[walletOneId],
          groups: {
            [walletOneGroupId]: {
              ...mockWallets[walletOneId].groups[walletOneGroupId],
              metadata: {
                ...mockWallets[walletOneId].groups[walletOneGroupId].metadata,
                pinned: true,
              },
            },
          },
        },
        [walletTwoId]: {
          ...mockWallets[walletTwoId],
          groups: {
            [walletTwoGroupId]: {
              ...mockWallets[walletTwoId].groups[walletTwoGroupId],
              metadata: {
                ...mockWallets[walletTwoId].groups[walletTwoGroupId].metadata,
                pinned: true,
              },
            },
          },
        },
      };

      renderComponent({ wallets: walletsWithPinnedAccounts });

      // Pinned section header should be present
      expect(screen.getByText('Pinned')).toBeInTheDocument();

      // Pinned accounts should be rendered
      expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
      expect(screen.getByText('Account 1 from wallet 2')).toBeInTheDocument();
    });

    it('shows pinned section even with one pinned account', () => {
      const walletsWithOnePinnedAccount = {
        [walletOneId]: {
          ...mockWallets[walletOneId],
          groups: {
            [walletOneGroupId]: {
              ...mockWallets[walletOneId].groups[walletOneGroupId],
              metadata: {
                ...mockWallets[walletOneId].groups[walletOneGroupId].metadata,
                pinned: true,
              },
            },
          },
        },
        [walletTwoId]: mockWallets[walletTwoId],
      };

      renderComponent({ wallets: walletsWithOnePinnedAccount });

      // Pinned section header should be present even with just 1 pinned account
      expect(screen.getByText('Pinned')).toBeInTheDocument();
      expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    });

    it('excludes pinned accounts from their wallet sections', () => {
      const walletsWithPinnedAccount = {
        [walletOneId]: {
          ...mockWallets[walletOneId],
          groups: {
            [walletOneGroupId]: {
              ...mockWallets[walletOneId].groups[walletOneGroupId],
              metadata: {
                ...mockWallets[walletOneId].groups[walletOneGroupId].metadata,
                pinned: true,
              },
            },
          },
        },
        [walletTwoId]: {
          ...mockWallets[walletTwoId],
          groups: {
            [walletTwoGroupId]: {
              ...mockWallets[walletTwoId].groups[walletTwoGroupId],
              metadata: {
                ...mockWallets[walletTwoId].groups[walletTwoGroupId].metadata,
                pinned: true,
              },
            },
          },
        },
      };

      renderComponent(
        { wallets: walletsWithPinnedAccount },
        {
          ...mockDefaultState,
          metamask: {
            ...mockDefaultState.metamask,
            accountTree: {
              ...mockDefaultState.metamask.accountTree,
              // @ts-expect-error - walletsWithPinnedAccount does not follow the exact structure due to test simplification
              wallets: walletsWithPinnedAccount,
            },
          },
        },
      );

      // Pinned section should exist
      expect(screen.getByText('Pinned')).toBeInTheDocument();

      // Wallet headers should still be present
      const walletHeaders = screen.getAllByTestId(walletHeaderTestId);
      expect(walletHeaders).toHaveLength(2);
      expect(
        within(walletHeaders[0]).getByText('Wallet 1'),
      ).toBeInTheDocument();
      expect(
        within(walletHeaders[1]).getByText('Wallet 2'),
      ).toBeInTheDocument();

      // Accounts should appear in pinned section, not in wallet sections
      // Only match the actual account cells, not indicators or accessories
      // Regex matches entropy:ID/number but not -selected-indicator or other suffixes
      const accountCells = screen.getAllByTestId(
        /^multichain-account-cell-entropy:[^/]+\/\d+$/u,
      );
      // Should be 2 accounts total (both in pinned section)
      expect(accountCells.length).toBe(2);
    });

    it('shows wallet headers when there is one wallet with pinned accounts', () => {
      const walletsWithOnePinnedAccount = {
        [walletOneId]: {
          ...mockWallets[walletOneId],
          groups: {
            [walletOneGroupId]: {
              ...mockWallets[walletOneId].groups[walletOneGroupId],
              metadata: {
                ...mockWallets[walletOneId].groups[walletOneGroupId].metadata,
                pinned: true,
              },
            },
          },
        },
      };

      renderComponent(
        { wallets: walletsWithOnePinnedAccount },
        {
          ...mockDefaultState,
          metamask: {
            ...mockDefaultState.metamask,
            accountTree: {
              ...mockDefaultState.metamask.accountTree,
              // @ts-expect-error - walletsWithOnePinnedAccount does not follow the exact structure due to test simplification
              wallets: walletsWithOnePinnedAccount,
            },
          },
        },
      );

      // With one wallet but pinned accounts, wallet header should be shown
      const walletHeader = screen.getByTestId(walletHeaderTestId);
      expect(walletHeader).toBeInTheDocument();
      // Wallet name should be in the header
      expect(within(walletHeader).getByText('Wallet 1')).toBeInTheDocument();
      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });
  });

  describe('Hidden accounts section', () => {
    it('renders collapsible hidden section when there are hidden accounts', () => {
      const walletsWithHiddenAccounts = {
        [walletOneId]: mockWallets[walletOneId],
        [walletTwoId]: {
          ...mockWallets[walletTwoId],
          groups: {
            [walletTwoGroupId]: {
              ...mockWallets[walletTwoId].groups[walletTwoGroupId],
              metadata: {
                ...mockWallets[walletTwoId].groups[walletTwoGroupId].metadata,
                hidden: true,
              },
            },
          },
        },
      };

      renderComponent({ wallets: walletsWithHiddenAccounts });

      // Hidden section header should be present
      const hiddenHeader = screen.getByTestId(
        'multichain-account-tree-hidden-header',
      );
      expect(hiddenHeader).toBeInTheDocument();
      expect(screen.getByText('Hidden (1)')).toBeInTheDocument();

      // Hidden account should NOT be visible initially (collapsed)
      expect(
        screen.queryByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).not.toBeInTheDocument();
    });

    it('expands hidden section when clicked', async () => {
      const walletsWithHiddenAccounts = {
        [walletOneId]: mockWallets[walletOneId],
        [walletTwoId]: {
          ...mockWallets[walletTwoId],
          groups: {
            [walletTwoGroupId]: {
              ...mockWallets[walletTwoId].groups[walletTwoGroupId],
              metadata: {
                ...mockWallets[walletTwoId].groups[walletTwoGroupId].metadata,
                hidden: true,
              },
            },
          },
        },
      };

      renderComponent({ wallets: walletsWithHiddenAccounts });

      const hiddenHeader = screen.getByTestId(
        'multichain-account-tree-hidden-header',
      );

      // Initially hidden account should not be visible
      expect(
        screen.queryByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).not.toBeInTheDocument();

      // Click to expand
      await act(async () => {
        fireEvent.click(hiddenHeader);
      });

      // Now hidden account should be visible
      expect(
        screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).toBeInTheDocument();
      expect(screen.getByText('Account 1 from wallet 2')).toBeInTheDocument();
    });

    it('collapses hidden section when clicked twice', async () => {
      const walletsWithHiddenAccounts = {
        [walletOneId]: mockWallets[walletOneId],
        [walletTwoId]: {
          ...mockWallets[walletTwoId],
          groups: {
            [walletTwoGroupId]: {
              ...mockWallets[walletTwoId].groups[walletTwoGroupId],
              metadata: {
                ...mockWallets[walletTwoId].groups[walletTwoGroupId].metadata,
                hidden: true,
              },
            },
          },
        },
      };

      renderComponent({ wallets: walletsWithHiddenAccounts });

      const hiddenHeader = screen.getByTestId(
        'multichain-account-tree-hidden-header',
      );

      // Click to expand
      await act(async () => {
        fireEvent.click(hiddenHeader);
      });

      expect(
        screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).toBeInTheDocument();

      // Click again to collapse
      await act(async () => {
        fireEvent.click(hiddenHeader);
      });

      // Hidden account should not be visible again
      expect(
        screen.queryByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).not.toBeInTheDocument();
    });

    it('excludes hidden accounts from their wallet sections', () => {
      const walletsWithHiddenAccount = {
        [walletOneId]: mockWallets[walletOneId],
        [walletTwoId]: {
          ...mockWallets[walletTwoId],
          groups: {
            [walletTwoGroupId]: {
              ...mockWallets[walletTwoId].groups[walletTwoGroupId],
              metadata: {
                ...mockWallets[walletTwoId].groups[walletTwoGroupId].metadata,
                hidden: true,
              },
            },
          },
        },
      };

      renderComponent({ wallets: walletsWithHiddenAccount });

      // Wallet headers should still be present
      expect(screen.getByText('Wallet 1')).toBeInTheDocument();
      expect(screen.getByText('Wallet 2')).toBeInTheDocument();

      // Only one account should be visible in wallet section (not hidden one)
      expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();

      // Hidden account should not be in wallet section (collapsed by default)
      expect(
        screen.queryByTestId(`multichain-account-cell-${walletTwoGroupId}`),
      ).not.toBeInTheDocument();
    });
  });

  describe('Trace events', () => {
    it('ends AccountList and ShowAccountList traces on mount', () => {
      renderComponent();
      const traceLib = jest.requireMock('../../../../shared/lib/trace');
      expect(traceLib.endTrace).toHaveBeenCalledWith(
        expect.objectContaining({ name: traceLib.TraceName.AccountList }),
      );
      expect(traceLib.endTrace).toHaveBeenCalledWith(
        expect.objectContaining({ name: traceLib.TraceName.ShowAccountList }),
      );
    });
  });
});
