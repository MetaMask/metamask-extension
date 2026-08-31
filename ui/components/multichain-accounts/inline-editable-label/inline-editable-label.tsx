import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { InlineEditableLabelProps } from './inline-editable-label.types';

export const InlineEditableLabel = ({
  value,
  onSave,
  placeholder,
  maxLength = 50,
  ariaLabel,
  variant = TextVariant.BodyMd,
  color = TextColor.TextDefault,
  fontWeight = FontWeight.Medium,
  className,
  testId = 'inline-editable-label',
  disabled = false,
}: InlineEditableLabelProps) => {
  const t = useI18nContext();
  const [isEditing, setIsEditing] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setCurrentValue(value);
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) {
      return;
    }
    setCurrentValue(value);
    setIsEditing(true);
  };

  const handleCancel = useCallback(() => {
    setCurrentValue(value);
    setIsEditing(false);
  }, [value]);

  const handleSave = useCallback(async () => {
    const trimmed = currentValue.trim();
    if (!trimmed || trimmed === value) {
      handleCancel();
      return;
    }
    await onSave(trimmed);
    setIsEditing(false);
  }, [currentValue, value, onSave, handleCancel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
        className="inline-editable-label__editing"
        data-testid={`${testId}-editing`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel || t('accountName')}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          className="px-2 py-1 text-sm rounded border border-primary-default bg-background-default text-text-default outline-none"
          data-testid={`${testId}-input`}
        />
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.Check}
          ariaLabel={t('save')}
          onMouseDown={(e) => {
            // Prevent onBlur from canceling before save click fires
            e.preventDefault();
          }}
          onClick={handleSave}
          data-testid={`${testId}-save`}
        />
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      className={`inline-editable-label ${disabled ? '' : 'cursor-pointer'} ${className || ''}`.trim()}
      onClick={handleStartEdit}
      data-testid={testId}
    >
      <Text
        variant={variant}
        color={color}
        fontWeight={fontWeight}
        ellipsis
      >
        {value}
      </Text>
    </Box>
  );
};
