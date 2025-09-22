import React from 'react';
import { screen, fireEvent, act, within } from '@testing-library/react';
import {
  AccountGroupId,
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
} from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MultichainAccountList,
  MultichainAccountListProps,
} from './multichain-account-list';

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
  };
});

const mockSetAccountGroupName = jest.requireMock(
  '../../../store/actions',
).setAccountGroupName;

const mockSetSelectedMultichainAccount = jest.requireMock(
  '../../../store/actions',
).setSelectedMultichainAccount;
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
  });

  it('renders wallet headers and account cells correctly', () => {
    renderComponent();

    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();

    const walletHeaders = screen.getAllByTestId(
      'multichain-account-tree-wallet-header',
    );
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
    const { history } = renderComponent();
    const mockHistoryPush = jest.spyOn(history, 'push');

    // With default props, checkboxes should not be shown (showAccountCheckbox defaults to false)
    // Check that no checkboxes are present
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // Selected icon should be present for the selected account
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-icon`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
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
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('updates selected account when selectedAccountGroup changes', () => {
    const { rerender } = renderComponent();

    // With default props, no checkboxes should be shown (showAccountCheckbox defaults to false)
    let checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // Selected icon should be present for the selected account
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-icon`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
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
        `multichain-account-cell-${walletOneGroupId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
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
        `multichain-account-cell-${walletOneGroupId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
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

    expect(
      screen.queryAllByTestId('multichain-account-tree-wallet-header'),
    ).toHaveLength(1);
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
    const menuButton = document.querySelector(
      '.multichain-account-cell-popover-menu-button',
    );
    expect(menuButton).toBeInTheDocument();

    await act(async () => {
      if (menuButton) {
        fireEvent.click(menuButton);
      }
    });

    // Find the popover
    const popover = document.querySelector('.mm-popover--open');
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
    const modalHeader = document.querySelector('.mm-modal-header');
    expect(modalHeader).toBeInTheDocument();

    // Find the header text inside the modal
    if (modalHeader) {
      const headerText = within(modalHeader as HTMLElement).getByText('Rename');
      expect(headerText).toBeInTheDocument();
    }

    // Find the actual input element directly
    const inputContainer = screen.getByTestId('account-name-input');
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
    expect(screen.queryByTestId('account-name-input')).not.toBeInTheDocument();
  });

  it('opens account rename modal and closes it without saving', async () => {
    renderComponent();

    // Find the menu button for the first account and click it
    const menuButton = document.querySelector(
      '.multichain-account-cell-popover-menu-button',
    );
    expect(menuButton).toBeInTheDocument();

    await act(async () => {
      if (menuButton) {
        fireEvent.click(menuButton);
      }
    });

    // Find the popover
    const popover = document.querySelector('.mm-popover--open');
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
    const modalHeader = document.querySelector('.mm-modal-header');
    expect(modalHeader).toBeInTheDocument();

    // Find the close button by aria-label
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Verify the modal is closed and action was not called
    expect(screen.queryByTestId('account-name-input')).not.toBeInTheDocument();
    expect(mockSetAccountGroupName).not.toHaveBeenCalled();
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
      const { history } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });
      const mockHistoryPush = jest.spyOn(history, 'push');

      const checkboxes = screen.getAllByRole('checkbox');

      // Click the unchecked checkbox (wallet two)
      fireEvent.click(checkboxes[1]);

      // Verify that the action was dispatched with the correct account group ID
      expect(mockSetSelectedMultichainAccount).toHaveBeenCalledWith(
        walletTwoGroupId,
      );
      expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('handles checkbox click to deselect selected account', () => {
      const { history } = renderComponent({
        selectedAccountGroups: [walletOneGroupId],
        showAccountCheckbox: true,
      });
      const mockHistoryPush = jest.spyOn(history, 'push');

      const checkboxes = screen.getAllByRole('checkbox');

      // Click the checked checkbox (wallet one)
      fireEvent.click(checkboxes[0]);

      // Verify that the action was dispatched with the correct account group ID
      expect(mockSetSelectedMultichainAccount).toHaveBeenCalledWith(
        walletOneGroupId,
      );
      expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
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
          `multichain-account-cell-${walletOneGroupId}-selected-icon`,
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
          `multichain-account-cell-${walletOneGroupId}-selected-icon`,
        ),
      ).not.toBeInTheDocument();
    });
  });
});
