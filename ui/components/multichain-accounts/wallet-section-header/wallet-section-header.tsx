import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { InlineEditableLabel } from '../inline-editable-label';
import { DragHandleIcon } from '../drag-handle-icon';

export type WalletSectionHeaderProps = {
  title: string;
  testId?: string;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isLocked?: boolean;
  isRemovable?: boolean;
  showDragHandle?: boolean;
  onRemove?: () => void;
  onRename?: (newTitle: string) => void;
  className?: string;
};

export const WalletSectionHeader = ({
  title,
  testId,
  isCollapsible = false,
  isExpanded = true,
  onToggleExpand,
  isLocked = false,
  isRemovable = false,
  showDragHandle = false,
  onRemove,
  onRename,
  className = '',
}: WalletSectionHeaderProps) => {
  const t = useI18nContext();

  const handleHeaderClick = () => {
    if (isCollapsible) {
      onToggleExpand?.();
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const content = (
    <Box
      className={`flex w-full px-4 py-2 justify-between items-center ${className}`}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        {showDragHandle && (
          <Box
            className="flex items-center justify-center text-icon-muted cursor-grab"
            data-testid={
              testId
                ? `${testId}-drag-handle`
                : 'wallet-section-header-drag-handle'
            }
            aria-hidden="true"
          >
            <DragHandleIcon size={16} />
          </Box>
        )}
        {onRename ? (
          <InlineEditableLabel
            value={title}
            onSave={onRename}
            testId="wallet-section-header-title"
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            fontWeight={FontWeight.Medium}
            ariaLabel={t('walletName')}
          />
        ) : (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {title}
          </Text>
        )}
        {isLocked && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            data-testid="wallet-section-header-locked-badge"
          >
            <Icon
              name={IconName.Lock}
              size={IconSize.Sm}
              color={IconColor.IconMuted}
            />
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextMuted}
              fontWeight={FontWeight.Medium}
            >
              {t('locked')}
            </Text>
          </Box>
        )}
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        {isRemovable && (
          <Button
            isDanger
            variant={ButtonVariant.Tertiary}
            size={ButtonSize.Sm}
            startAccessory={
              <Icon
                name={IconName.RemoveMinus}
                size={IconSize.Sm}
                color={IconColor.ErrorDefault}
              />
            }
            onClick={handleRemoveClick}
            data-testid={
              testId
                ? `${testId}-remove-button`
                : 'wallet-section-header-remove-button'
            }
          >
            {t('remove')}
          </Button>
        )}
        {isCollapsible && (
          <Icon
            name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        )}
      </Box>
    </Box>
  );

  if (isCollapsible) {
    return (
      <Box
        role="button"
        tabIndex={0}
        onClick={handleHeaderClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleHeaderClick();
          }
        }}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        className="flex w-full text-left cursor-pointer"
        data-testid={testId}
        aria-expanded={isExpanded}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      data-testid={testId}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="w-full"
    >
      {content}
    </Box>
  );
};
