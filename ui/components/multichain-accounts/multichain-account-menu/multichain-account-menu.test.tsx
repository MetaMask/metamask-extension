import React from 'react';
import { fireEvent, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MultichainAccountMenu } from './multichain-account-menu';
import type { MultichainAccountMenuProps } from './multichain-account-menu.types';

const popoverOpenSelector = '.mm-popover--open';
const menuButtonSelector = '.multichain-account-cell-popover-menu-button';
const menuIconSelector = '.multichain-account-cell-popover-menu-button-icon';
const menuItemSelector = '.multichain-account-cell-menu-item';
const errorColorSelector = '.mm-box--color-error-default';

describe('MultichainAccountMenu', () => {
  const renderComponent = (
    props: MultichainAccountMenuProps = {
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: false,
      onToggle: jest.fn(),
    },
  ) => {
    return renderWithProvider(<MultichainAccountMenu {...props} />);
  };

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

  it('shows 3 menu items when menu is open', () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: true,
      onToggle: jest.fn(),
    });

    const popover = document.querySelector(popoverOpenSelector);
    expect(popover).toBeInTheDocument();

    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(3);
  });

  it('adds the remove option to menu when isRemovable is true', () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: true,
      isOpen: true,
      onToggle: jest.fn(),
    });

    const menuItems = document.querySelectorAll(menuItemSelector);
    expect(menuItems.length).toBe(4);

    const removeOption = document.querySelector(errorColorSelector);
    expect(removeOption).toBeInTheDocument();
  });

  it('navigates to account details page when clicking the account details option', async () => {
    const { history } = renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
      isOpen: true,
      onToggle: jest.fn(),
    });
    const mockHistoryPush = jest.spyOn(history, 'push');

    const accountDetailsOption = document.querySelector(menuItemSelector);
    expect(accountDetailsOption).not.toBeNull();

    if (accountDetailsOption) {
      await act(async () => {
        fireEvent.click(accountDetailsOption);
      });
    }

    expect(mockHistoryPush).toHaveBeenCalledWith(
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
    expect(menuItems.length).toBe(3);

    const renameOption = menuItems[1];
    expect(renameOption).not.toBeNull();

    if (renameOption) {
      await act(async () => {
        fireEvent.click(renameOption);
      });
    }

    expect(mockHandleAccountRenameAction).toHaveBeenCalledWith(accountGroupId);
  });
});
