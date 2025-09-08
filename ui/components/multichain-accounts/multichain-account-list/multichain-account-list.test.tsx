import React from 'react';
import { screen, fireEvent, act, within } from '@testing-library/react';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
  toDefaultAccountGroupId,
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

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: mockHistoryPush,
    }),
  };
});

jest.mock('../../../store/actions', () => {
  const actualActions = jest.requireActual('../../../store/actions');
  return {
    ...actualActions,
    setAccountGroupName: jest.fn().mockImplementation(() => {
      return async function () {
        await Promise.resolve();
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
const walletOneGroupId = toDefaultAccountGroupId(walletOneId);
const walletTwoId = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletTwoEntropySource,
);
const walletTwoGroupId = toDefaultAccountGroupId(walletTwoId);

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

  const renderComponent = (props = {}) => {
    const store = configureStore(mockDefaultState);

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
    renderComponent();

    // Check that the correct account is initially selected
    const selectedAccountIcon = screen.getByTestId(
      `multichain-account-cell-${walletOneGroupId}-selected-icon`,
    );
    expect(selectedAccountIcon).toBeInTheDocument();
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

    // Now wallet two should be selected (has selected icon)
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

  it('handles multiple account groups within a single wallet', () => {
    const secondGroupId = `${walletOneId}/group2`;
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
          },
        },
      },
    };

    renderComponent({ wallets: multiGroupWallets });

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

    // Find and click the confirm button
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
});
