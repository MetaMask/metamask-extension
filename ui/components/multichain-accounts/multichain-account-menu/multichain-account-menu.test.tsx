import React from 'react';
import { AccountGroupId } from '@metamask/account-api';
import { fireEvent, act, within } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { MultichainAccountMenu } from './multichain-account-menu';
import type { MultichainAccountMenuProps } from './multichain-account-menu.types';

jest.mock('../../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...actual,
    trace: jest.fn(),
    endTrace: jest.fn(),
  };
});

const popoverOpenSelector = '.mm-popover--open';
const menuButtonSelector = '.multichain-account-cell-popover-menu-button';
const menuIconSelector = '.multichain-account-cell-popover-menu-button-icon';
const menuItemSelector = '.multichain-account-cell-menu-item';
const errorColorSelector = '.mm-box--color-error-default';

const mockState = {
  metamask: {
    accountTree: {
      wallets: {
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
          groups: {
            'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default': {
              metadata: {
                name: 'Test Account',
                pinned: false,
                hidden: false,
              },
            },
          },
        },
      },
    },
  },
};

jest.mock('../../../store/actions', () => {
  const actualActions = jest.requireActual('../../../store/actions');
  return {
    ...actualActions,
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

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockSetAccountGroupPinned = jest.requireMock(
  '../../../store/actions',
).setAccountGroupPinned;

const mockSetAccountGroupHidden = jest.requireMock(
  '../../../store/actions',
).setAccountGroupHidden;

describe('MultichainAccountMenu', () => {
  const renderComponent = (
    props: MultichainAccountMenuProps = {
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: false,
      onToggle: jest.fn(),
    },
  ) => {
    const store = configureStore(mockState);
    return renderWithProvider(<MultichainAccountMenu {...props} />, store);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the menu button and popover is initially closed', () => {
    renderComponent();

    const menuButton = document.querySelector(menuButtonSelector);

    expect(menuButton).toBeInTheDocument();

    const menuIcon = document.querySelector(menuIconSelector);

    expect(menuIcon).toBeInTheDocument();
    expect(document.querySelector(popoverOpenSelector)).not.toBeInTheDocument();
  });

  it('renders with controlled props - closed state', () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: false,
      onToggle: jest.fn(),
    });

    expect(document.querySelector(menuButtonSelector)).toBeInTheDocument();
    expect(document.querySelector(popoverOpenSelector)).not.toBeInTheDocument();
  });

  it('renders with controlled props - open state', () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: true,
      onToggle: jest.fn(),
    });

    expect(document.querySelector(menuButtonSelector)).toBeInTheDocument();
    expect(document.querySelector(popoverOpenSelector)).toBeInTheDocument();
  });

  it('calls onToggle when menu button is clicked with controlled props', async () => {
    const mockOnToggle = jest.fn();
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: false,
      onToggle: mockOnToggle,
    });

    const menuButton = document.querySelector(menuButtonSelector);
    expect(menuButton).not.toBeNull();

    if (menuButton) {
      await act(async () => {
        fireEvent.click(menuButton);
      });
    }

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('shows 5 menu items when menu is open (details, rename, addresses, pin, hide)', () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: true,
      onToggle: jest.fn(),
    });

    const popover = document.querySelector(popoverOpenSelector);
    expect(popover).toBeInTheDocument();

    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(5);
  });

  it('adds the remove option to menu when isRemovable is true', () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: true,
      isOpen: true,
      onToggle: jest.fn(),
    });

    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(6);

    const removeOption = document.querySelector(errorColorSelector);
    expect(removeOption).toBeInTheDocument();
  });

  it('navigates to account details page when clicking the account details option', async () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: true,
      onToggle: jest.fn(),
    });

    const accountDetailsOption = document.querySelector(menuItemSelector);
    expect(accountDetailsOption).not.toBeNull();

    if (accountDetailsOption) {
      await act(async () => {
        fireEvent.click(accountDetailsOption);
      });
    }

    expect(mockUseNavigate).toHaveBeenCalledWith(
      '/multichain-account-details/entropy%3A01JKAF3DSGM3AB87EM9N0K41AJ%2Fdefault',
    );
  });

  it('calls handleAccountRenameAction when clicking the rename option', async () => {
    const mockHandleAccountRenameAction = jest.fn();
    const mockOnToggle = jest.fn();
    const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default';

    renderComponent({
      accountGroupId,
      isRemovable: false,
      isOpen: true,
      onToggle: mockOnToggle,
      handleAccountRenameAction: mockHandleAccountRenameAction,
    });

    // Rename option should be the second menu item
    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(5);

    const renameOption = menuItems[1];
    expect(renameOption).not.toBeNull();

    if (renameOption) {
      await act(async () => {
        fireEvent.click(renameOption);
      });
    }

    expect(mockHandleAccountRenameAction).toHaveBeenCalledWith(accountGroupId);
  });

  it('calls setAccountGroupPinned when clicking the pin option', async () => {
    const mockOnToggle = jest.fn();
    const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default';

    renderComponent({
      accountGroupId,
      isRemovable: false,
      isOpen: true,
      onToggle: mockOnToggle,
    });

    // Pin option should be the fourth menu item (details, rename, addresses, pin)
    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(5);

    const pinOption = menuItems[3];
    expect(pinOption).not.toBeNull();

    if (pinOption) {
      await act(async () => {
        fireEvent.click(pinOption);
      });
    }

    expect(mockSetAccountGroupPinned).toHaveBeenCalledWith(
      accountGroupId,
      true,
    );
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('calls setAccountGroupHidden when clicking the hide option', async () => {
    const mockOnToggle = jest.fn();
    const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default';

    renderComponent({
      accountGroupId,
      isRemovable: false,
      isOpen: true,
      onToggle: mockOnToggle,
    });

    // Hide option should be the fifth menu item
    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(5);

    const hideOption = menuItems[4];
    expect(hideOption).not.toBeNull();

    if (hideOption) {
      await act(async () => {
        fireEvent.click(hideOption);
      });
    }

    expect(mockSetAccountGroupHidden).toHaveBeenCalledWith(
      accountGroupId,
      true,
    );
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('unpins account before hiding when clicking hide on a pinned account', async () => {
    const mockOnToggle = jest.fn();
    const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default';

    // Create state with pinned account
    const stateWithPinnedAccount = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        accountTree: {
          ...mockState.metamask.accountTree,
          wallets: {
            'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
              ...mockState.metamask.accountTree.wallets[
                'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
              ],
              groups: {
                'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default': {
                  ...mockState.metamask.accountTree.wallets[
                    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
                  ].groups['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default'],
                  metadata: {
                    ...mockState.metamask.accountTree.wallets[
                      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
                    ].groups['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default']
                      .metadata,
                    pinned: true,
                    hidden: false,
                  },
                },
              },
            },
          },
        },
      },
    };

    const store = configureStore(stateWithPinnedAccount);
    renderWithProvider(
      <MultichainAccountMenu
        accountGroupId={accountGroupId}
        isRemovable={false}
        isOpen={true}
        onToggle={mockOnToggle}
      />,
      store,
    );

    // Hide option should be the fifth menu item
    const menuItems = document.querySelectorAll(menuItemSelector);
    const hideOption = menuItems[4];

    if (hideOption) {
      await act(async () => {
        fireEvent.click(hideOption);
      });
    }

    // Should unpin first, then hide
    expect(mockSetAccountGroupPinned).toHaveBeenCalledWith(
      accountGroupId,
      false,
    );
    expect(mockSetAccountGroupHidden).toHaveBeenCalledWith(
      accountGroupId,
      true,
    );
  });

  it('unhides account before pinning when clicking pin on a hidden account', async () => {
    const mockOnToggle = jest.fn();
    const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default';

    // Create state with hidden account
    const stateWithHiddenAccount = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        accountTree: {
          ...mockState.metamask.accountTree,
          wallets: {
            'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
              ...mockState.metamask.accountTree.wallets[
                'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
              ],
              groups: {
                'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default': {
                  ...mockState.metamask.accountTree.wallets[
                    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
                  ].groups['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default'],
                  metadata: {
                    ...mockState.metamask.accountTree.wallets[
                      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
                    ].groups['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default']
                      .metadata,
                    pinned: false,
                    hidden: true,
                  },
                },
              },
            },
          },
        },
      },
    };

    const store = configureStore(stateWithHiddenAccount);
    renderWithProvider(
      <MultichainAccountMenu
        accountGroupId={accountGroupId}
        isRemovable={false}
        isOpen={true}
        onToggle={mockOnToggle}
      />,
      store,
    );

    // Pin option should be the fourth menu item
    const menuItems = document.querySelectorAll(menuItemSelector);
    const pinOption = menuItems[3];

    if (pinOption) {
      await act(async () => {
        fireEvent.click(pinOption);
      });
    }

    // Should unhide first, then pin
    expect(mockSetAccountGroupHidden).toHaveBeenCalledWith(
      accountGroupId,
      false,
    );
    expect(mockSetAccountGroupPinned).toHaveBeenCalledWith(
      accountGroupId,
      true,
    );
  });

  describe('tracing', () => {
    const groupId = mockDefaultState.metamask.accountTree
      .selectedAccountGroup as AccountGroupId;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('calls trace ShowAccountAddressList when clicking Addresses', async () => {
      const store = configureStore(mockDefaultState);
      renderWithProvider(
        <MultichainAccountMenu
          accountGroupId={groupId}
          isRemovable={false}
          isOpen
          onToggle={() => undefined}
        />,
        store,
      );

      const popover = document.querySelector(
        '.multichain-account-cell-popover-menu',
      );
      expect(popover).toBeInTheDocument();

      const addressesItem = popover
        ? within(popover as HTMLElement).getByText('Addresses')
        : null;
      expect(addressesItem).toBeInTheDocument();

      await act(async () => {
        if (addressesItem) {
          fireEvent.click(addressesItem);
        }
      });

      const traceLib = jest.requireMock('../../../../shared/lib/trace');
      expect(traceLib.trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: traceLib.TraceName.ShowAccountAddressList,
        }),
      );
    });
  });
});
