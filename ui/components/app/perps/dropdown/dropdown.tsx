import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ButtonBase,
  ButtonBaseSize,
  twMerge,
} from '@metamask/design-system-react';

export type DropdownOption<OptionId extends string> = {
  id: OptionId;
  label: string;
};

export type DropdownProps<OptionId extends string> = {
  /** Available options */
  options: DropdownOption<OptionId>[];
  /**
   * Currently selected option ID, or `null` when the menu holds no selection —
   * the category rail's overflow menu never does, because the active category
   * is promoted into the visible row instead.
   */
  selectedId: OptionId | null;
  /** Callback when selection changes */
  onChange: (id: OptionId) => void;
  /** Test ID prefix for testing */
  testId: string;
  /**
   * Trigger text. Defaults to the selected option's label, which is what a
   * picker wants; the category rail's overflow menu passes a standing "More"
   * instead, because its trigger names the menu rather than the selection.
   */
  triggerLabel?: string;
  /** Extra trigger classes, merged after the default picker styling. */
  triggerClassName?: string;
  /** Accessible name for the trigger, when its label is not descriptive alone. */
  triggerAriaLabel?: string;
  /**
   * Extra menu classes, merged after the default left-anchored positioning. A
   * trigger sitting at the inline end needs `right-0 left-auto`, or its menu
   * opens past the edge of a narrow window.
   */
  menuClassName?: string;
};

/**
 * Reusable dropdown component styled like PickerNetwork
 *
 * @param props - Component props
 * @param props.options - Available options to display
 * @param props.selectedId - Currently selected option ID
 * @param props.onChange - Callback when selection changes
 * @param props.testId - Test ID prefix for testing
 * @param props.triggerLabel - Trigger text, defaulting to the selected label
 * @param props.triggerClassName - Extra trigger classes
 * @param props.triggerAriaLabel - Accessible name for the trigger
 * @param props.menuClassName - Extra menu classes, for anchoring the menu
 */
export const Dropdown = <OptionId extends string>({
  options,
  selectedId,
  onChange,
  testId,
  triggerLabel,
  triggerClassName,
  triggerAriaLabel,
  menuClassName,
}: DropdownProps<OptionId>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = options.find((opt) => opt.id === selectedId);
  const selectedIndex = options.findIndex((opt) => opt.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus a menu option when the list opens. With no selection (the category
  // More menu), land on the first option so Arrow/Enter work immediately.
  const focusIndexOnOpen = selectedIndex >= 0 ? selectedIndex : 0;
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevSelectedIndex, setPrevSelectedIndex] = useState(selectedIndex);
  if (isOpen !== prevIsOpen || selectedIndex !== prevSelectedIndex) {
    setPrevIsOpen(isOpen);
    setPrevSelectedIndex(selectedIndex);
    if (isOpen && options.length > 0) {
      setFocusedIndex(focusIndexOnOpen);
    }
  }
  useEffect(() => {
    if (isOpen && options.length > 0) {
      optionRefs.current[focusIndexOnOpen]?.focus();
    }
  }, [focusIndexOnOpen, isOpen, options.length]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (option: DropdownOption<OptionId>) => {
      onChange(option.id);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const handleTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        setIsOpen(true);
        break;
      default:
        break;
    }
  }, []);

  const handleOptionKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleSelect(options[index]);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (index < options.length - 1) {
            setFocusedIndex(index + 1);
            optionRefs.current[index + 1]?.focus();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (index > 0) {
            setFocusedIndex(index - 1);
            optionRefs.current[index - 1]?.focus();
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        case 'Tab':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        default:
          break;
      }
    },
    [handleSelect, options],
  );

  return (
    <Box ref={dropdownRef} className="relative">
      {/* Trigger button styled like PickerNetwork */}
      <ButtonBase
        ref={triggerRef}
        size={ButtonBaseSize.Sm}
        className={twMerge(
          'flex items-center justify-start gap-1 rounded-lg bg-background-muted px-3 py-2 hover:bg-hover active:opacity-70',
          triggerClassName,
        )}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={triggerAriaLabel}
        data-testid={`${testId}-button`}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {triggerLabel ?? selectedOption?.label ?? ''}
        </Text>
        <Icon
          name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconDefault}
          className="ml-auto"
        />
      </ButtonBase>

      {/* Dropdown menu */}
      {isOpen && (
        <Box
          className={twMerge(
            'absolute left-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg',
            menuClassName,
          )}
          flexDirection={BoxFlexDirection.Column}
          role="listbox"
          aria-activedescendant={
            focusedIndex >= 0
              ? `${testId}-option-${options[focusedIndex]?.id}`
              : undefined
          }
          data-testid={`${testId}-menu`}
        >
          {options.map((option, index) => {
            const isSelected = option.id === selectedId;
            return (
              <ButtonBase
                key={option.id}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                onClick={() => handleSelect(option)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                className={`w-full justify-between text-left rounded-none px-3 py-2 min-w-0 h-auto active:bg-pressed ${
                  isSelected ? 'bg-hover' : 'bg-transparent hover:bg-hover'
                }`}
                role="option"
                aria-selected={isSelected}
                id={`${testId}-option-${option.id}`}
                data-testid={`${testId}-option-${option.id}`}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextDefault}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Icon
                    name={IconName.Check}
                    size={IconSize.Sm}
                    color={IconColor.IconDefault}
                  />
                )}
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Dropdown;
