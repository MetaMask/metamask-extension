import React from 'react';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountCell } from '../multichain-account-cell';
import { InlineEditableLabel } from '../inline-editable-label';
import { DragHandleIcon } from '../drag-handle-icon';
import { AccountManagementRowItem } from './account-management-list.utils';

export type AccountManagementRowProps = {
  item: AccountManagementRowItem;
  balance?: string;
  privacyMode?: boolean;
  showDefaultAddress?: boolean;
  onClick?: (groupId: AccountGroupId) => void;
  onToggleVisibility?: (groupId: AccountGroupId, currentHidden: boolean) => void;
  onRemoveAccount?: (item: AccountManagementRowItem) => void;
  onRenameAccount?: (groupId: AccountGroupId, newName: string) => void;
  pending?: boolean;
};

export const AccountManagementRow = ({
  item,
  balance,
  privacyMode = false,
  showDefaultAddress = false,
  onClick,
  onToggleVisibility,
  onRemoveAccount,
  onRenameAccount,
  pending = false,
}: AccountManagementRowProps) => {
  const t = useI18nContext();
  const { groupId, groupData, isHidden, isRemovable } = item;

  const handleRowClick = () => {
    if (isHidden || pending) {
      return;
    }
    onClick?.(groupId);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility?.(groupId, isHidden);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveAccount?.(item);
  };

  let actionButton: React.ReactNode;
  if (isHidden) {
    actionButton = (
      <ButtonIcon
        size={ButtonIconSize.Sm}
        iconName={IconName.EyeSlash}
        ariaLabel={t('showAccount')}
        onClick={handleToggleVisibility}
        data-testid={`account-management-row-visibility-toggle-${groupId}`}
      />
    );
  } else if (isRemovable) {
    actionButton = (
      <ButtonIcon
        size={ButtonIconSize.Sm}
        iconName={IconName.RemoveMinus}
        ariaLabel={t('removeAccount')}
        onClick={handleRemoveClick}
        data-testid={`account-management-row-remove-${groupId}`}
        className="text-error-default"
      />
    );
  } else {
    actionButton = (
      <ButtonIcon
        size={ButtonIconSize.Sm}
        iconName={IconName.Eye}
        ariaLabel={t('hideAccount')}
        onClick={handleToggleVisibility}
        data-testid={`account-management-row-visibility-toggle-${groupId}`}
      />
    );
  }

  const startAccessory = actionButton;

  const endAccessory = (
    <Box
      className={`account-management-row__drag-handle flex items-center justify-center text-icon-muted ${
        isHidden ? 'opacity-30 cursor-not-allowed' : 'cursor-grab'
      }`}
      data-testid={`account-management-row-drag-handle-${groupId}`}
      aria-hidden="true"
    >
      <DragHandleIcon size={16} />
    </Box>
  );

  const accountNameContent =
    !isHidden && onRenameAccount ? (
      <InlineEditableLabel
        value={groupData.metadata?.name || ''}
        onSave={(newName) => onRenameAccount(groupId, newName)}
        testId={`account-management-row-name-${groupId}`}
        ariaLabel={t('accountName')}
      />
    ) : (
      groupData.metadata?.name || ''
    );

  return (
    <Box
      className={`account-management-row${isHidden ? ' account-management-row--hidden opacity-50 pointer-events-auto' : ''}`}
      style={isHidden ? { opacity: 0.5 } : undefined}
      data-testid={`account-management-row-${groupId}`}
    >
      <MultichainAccountCell
        accountId={groupId}
        accountName={accountNameContent}
        accountNameString={groupData.metadata?.name || ''}
        balance={balance}
        privacyMode={privacyMode}
        showDefaultAddress={!isHidden && showDefaultAddress}
        onClick={isHidden ? undefined : handleRowClick}
        disableHoverEffect={isHidden}
        pending={pending}
        startAccessory={startAccessory}
        endAccessory={endAccessory}
      />
    </Box>
  );
};
