import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountGroupId,
  toAccountWalletId,
  toMultichainAccountGroupId,
  toMultichainAccountWalletId,
} from '@metamask/account-api';
import type { AccountGroupObject } from '@metamask/account-tree-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { AccountManagementRow } from './account-management-row';
import { AccountManagementRowItem } from './account-management-list.utils';

describe('AccountManagementRow', () => {
  const defaultWalletId = toMultichainAccountWalletId('01');
  const defaultGroupId = toMultichainAccountGroupId(defaultWalletId, 0);
  const importedWalletId = toAccountWalletId(
    AccountWalletType.Keyring,
    'imported',
  );
  const importedGroupId = toAccountGroupId(importedWalletId, '0');
  const hiddenGroupId = toMultichainAccountGroupId(defaultWalletId, 1);

  const createMockRowItem = (
    overrides?: Partial<AccountManagementRowItem>,
  ): AccountManagementRowItem => {
    const isSingleAccount = overrides?.isImported || overrides?.isHardware;
    const defaultItemGroupId = isSingleAccount
      ? importedGroupId
      : defaultGroupId;
    const defaultItemWalletId = isSingleAccount
      ? importedWalletId
      : defaultWalletId;

    const groupId = overrides?.groupId || defaultItemGroupId;
    const walletId = overrides?.walletId || defaultItemWalletId;
    const accounts: [string, ...string[]] = [`${groupId}/0`];

    const groupData: AccountGroupObject = isSingleAccount
      ? {
          id: groupId,
          type: AccountGroupType.SingleAccount,
          metadata: {
            name: 'Account 1',
            pinned: false,
            hidden: false,
            lastSelected: 0,
          },
          accounts: [accounts[0]],
          ...overrides?.groupData,
        }
      : {
          id: defaultGroupId,
          type: AccountGroupType.MultichainAccount,
          metadata: {
            name: 'Account 1',
            pinned: false,
            hidden: false,
            lastSelected: 0,
            entropy: { groupIndex: 0 },
          },
          accounts,
          ...overrides?.groupData,
        };

    return {
      id: `account-${groupId}`,
      groupId,
      groupData,
      walletId,
      walletName: 'Wallet 1',
      isPinned: false,
      isHidden: false,
      isLocked: false,
      isHardware: false,
      isImported: false,
      isRemovable: false,
      ...overrides,
    };
  };

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof AccountManagementRow>> = {},
  ) => {
    const store = configureStore(mockState);

    const defaultProps = {
      item: createMockRowItem(),
      balance: '$100.00',
      ...props,
    };

    return renderWithProvider(<AccountManagementRow {...defaultProps} />, store);
  };

  it('renders account name and balance', () => {
    renderComponent();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  describe('Mode 1: Hide Mode (Visible SRP / Entropy Account)', () => {
    it('renders Eye toggle, drag handle with cursor-grab class, and no remove button', () => {
      renderComponent({
        item: createMockRowItem({ isHidden: false, isRemovable: false }),
      });

      const hideButton = screen.getByTestId(
        `account-management-row-visibility-toggle-${defaultGroupId}`,
      );
      expect(hideButton).toBeInTheDocument();
      expect(
        screen.getByLabelText(messages.hideAccount.message),
      ).toBeInTheDocument();

      const dragHandle = screen.getByTestId(
        `account-management-row-drag-handle-${defaultGroupId}`,
      );
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveClass('cursor-grab');
      expect(dragHandle).not.toHaveClass('opacity-30');

      expect(
        screen.queryByTestId(
          `account-management-row-remove-${defaultGroupId}`,
        ),
      ).not.toBeInTheDocument();
    });

    it('calls onToggleVisibility with (groupId, false) when clicking Eye toggle', () => {
      const handleToggle = jest.fn();
      renderComponent({
        item: createMockRowItem({ isHidden: false, isRemovable: false }),
        onToggleVisibility: handleToggle,
      });

      const hideButton = screen.getByTestId(
        `account-management-row-visibility-toggle-${defaultGroupId}`,
      );
      fireEvent.click(hideButton);
      expect(handleToggle).toHaveBeenCalledWith(defaultGroupId, false);
    });
  });

  describe('Mode 2: Delete Mode (Visible Removable Imported / Hardware Account)', () => {
    it('renders RemoveMinus button, drag handle with cursor-grab class, and no eye toggle', () => {
      const item = createMockRowItem({
        groupId: importedGroupId,
        walletId: importedWalletId,
        isRemovable: true,
        isImported: true,
        isHidden: false,
      });
      renderComponent({ item });

      const removeButton = screen.getByTestId(
        `account-management-row-remove-${importedGroupId}`,
      );
      expect(removeButton).toBeInTheDocument();
      expect(
        screen.getByLabelText(messages.removeAccount.message),
      ).toBeInTheDocument();
      expect(removeButton).toHaveClass('text-error-default');

      const dragHandle = screen.getByTestId(
        `account-management-row-drag-handle-${importedGroupId}`,
      );
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveClass('cursor-grab');

      expect(
        screen.queryByTestId(
          `account-management-row-visibility-toggle-${importedGroupId}`,
        ),
      ).not.toBeInTheDocument();
    });

    it('calls onRemoveAccount with item when clicking remove button', () => {
      const handleRemove = jest.fn();
      const item = createMockRowItem({
        groupId: importedGroupId,
        walletId: importedWalletId,
        isRemovable: true,
        isImported: true,
        isHidden: false,
      });
      renderComponent({
        item,
        onRemoveAccount: handleRemove,
      });

      const removeButton = screen.getByTestId(
        `account-management-row-remove-${importedGroupId}`,
      );
      fireEvent.click(removeButton);
      expect(handleRemove).toHaveBeenCalledWith(item);
    });
  });

  describe('Mode 3: Hidden State', () => {
    it('renders EyeSlash unhide button, disabled drag handle with opacity-30 and cursor-not-allowed, and has hidden class', () => {
      renderComponent({
        item: createMockRowItem({
          groupId: hiddenGroupId,
          isHidden: true,
          isRemovable: true, // Even if removable, hidden state takes precedence
        }),
      });

      const row = screen.getByTestId(
        `account-management-row-${hiddenGroupId}`,
      );
      expect(row).toHaveClass('account-management-row--hidden');
      expect(row).toHaveClass('opacity-50');

      const showButton = screen.getByTestId(
        `account-management-row-visibility-toggle-${hiddenGroupId}`,
      );
      expect(showButton).toBeInTheDocument();
      expect(
        screen.getByLabelText(messages.showAccount.message),
      ).toBeInTheDocument();

      const dragHandle = screen.getByTestId(
        `account-management-row-drag-handle-${hiddenGroupId}`,
      );
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveClass('opacity-30');
      expect(dragHandle).toHaveClass('cursor-not-allowed');

      expect(
        screen.queryByTestId(
          `account-management-row-remove-${hiddenGroupId}`,
        ),
      ).not.toBeInTheDocument();
    });

    it('calls onToggleVisibility with (groupId, true) when clicking EyeSlash button', () => {
      const handleToggle = jest.fn();
      renderComponent({
        item: createMockRowItem({
          groupId: hiddenGroupId,
          isHidden: true,
        }),
        onToggleVisibility: handleToggle,
      });

      const showButton = screen.getByTestId(
        `account-management-row-visibility-toggle-${hiddenGroupId}`,
      );
      fireEvent.click(showButton);
      expect(handleToggle).toHaveBeenCalledWith(hiddenGroupId, true);
    });

    it('does not trigger onClick when clicking a hidden row', () => {
      const handleClick = jest.fn();
      renderComponent({
        item: createMockRowItem({
          groupId: hiddenGroupId,
          isHidden: true,
        }),
        onClick: handleClick,
      });

      const row = screen.getByTestId(
        `account-management-row-${hiddenGroupId}`,
      );
      fireEvent.click(row);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Inline Rename', () => {
    it('renders InlineEditableLabel and invokes onRenameAccount when saving new name via save button', async () => {
      const handleRename = jest.fn();
      renderComponent({
        item: createMockRowItem({
          groupId: defaultGroupId,
          isHidden: false,
        }),
        onRenameAccount: handleRename,
      });

      const editableLabel = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}`,
      );
      expect(editableLabel).toBeInTheDocument();
      fireEvent.click(editableLabel);

      const input = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}-input`,
      );
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'Renamed Account' } });

      const saveButton = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}-save`,
      );
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(handleRename).toHaveBeenCalledWith(
          defaultGroupId,
          'Renamed Account',
        );
      });
      expect(
        screen.queryByTestId(
          `account-management-row-name-${defaultGroupId}-input`,
        ),
      ).not.toBeInTheDocument();
    });

    it('invokes onRenameAccount when pressing Enter key in input', async () => {
      const handleRename = jest.fn();
      renderComponent({
        item: createMockRowItem({
          groupId: defaultGroupId,
          isHidden: false,
        }),
        onRenameAccount: handleRename,
      });

      const editableLabel = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}`,
      );
      fireEvent.click(editableLabel);

      const input = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}-input`,
      );
      fireEvent.change(input, { target: { value: 'Enter Account Name' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(handleRename).toHaveBeenCalledWith(
          defaultGroupId,
          'Enter Account Name',
        );
      });
    });

    it('cancels rename without invoking onRenameAccount when pressing Escape key', () => {
      const handleRename = jest.fn();
      renderComponent({
        item: createMockRowItem({
          groupId: defaultGroupId,
          isHidden: false,
        }),
        onRenameAccount: handleRename,
      });

      const editableLabel = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}`,
      );
      fireEvent.click(editableLabel);

      const input = screen.getByTestId(
        `account-management-row-name-${defaultGroupId}-input`,
      );
      fireEvent.change(input, { target: { value: 'Cancelled Name' } });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(handleRename).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId(
          `account-management-row-name-${defaultGroupId}-input`,
        ),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Account 1')).toBeInTheDocument();
    });

    it('renders static name string when onRenameAccount is not provided', () => {
      renderComponent({
        item: createMockRowItem({
          groupId: defaultGroupId,
          isHidden: false,
        }),
        onRenameAccount: undefined,
      });

      expect(
        screen.queryByTestId(
          `account-management-row-name-${defaultGroupId}`,
        ),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Account 1')).toBeInTheDocument();
    });

    it('renders static name string and does not allow editing when account is hidden even if onRenameAccount is provided', () => {
      const handleRename = jest.fn();
      renderComponent({
        item: createMockRowItem({
          groupId: hiddenGroupId,
          isHidden: true,
        }),
        onRenameAccount: handleRename,
      });

      expect(
        screen.queryByTestId(
          `account-management-row-name-${hiddenGroupId}`,
        ),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Account 1')).toBeInTheDocument();
    });
  });

  describe('Row Interactivity', () => {
    it('triggers onClick when clicking a visible row', () => {
      const handleClick = jest.fn();
      renderComponent({
        item: createMockRowItem({ isHidden: false }),
        onClick: handleClick,
      });

      const row = screen.getByTestId(
        `account-management-row-${defaultGroupId}`,
      );
      const cell = row.querySelector('.multichain-account-cell');
      if (cell) {
        fireEvent.click(cell);
      }
      expect(handleClick).toHaveBeenCalledWith(defaultGroupId);
    });

    it('does not trigger onClick when pending is true', () => {
      const handleClick = jest.fn();
      renderComponent({
        item: createMockRowItem({ isHidden: false }),
        pending: true,
        onClick: handleClick,
      });

      const row = screen.getByTestId(
        `account-management-row-${defaultGroupId}`,
      );
      const cell = row.querySelector('.multichain-account-cell');
      if (cell) {
        fireEvent.click(cell);
      }
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
