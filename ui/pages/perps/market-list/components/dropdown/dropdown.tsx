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
} from '@metamask/design-system-react';

export type DropdownOption<OptionId extends string> = {
  id: OptionId;
  label: string;
};

export type DropdownProps<OptionId extends string> = {
  /** Available options */
  options: DropdownOption<OptionId>[];
  /** Currently selected option ID */
  selectedId: OptionId;
  /** Callback when selection changes */
  onChange: (id: OptionId) => void;
  /** Test ID prefix for testing */
  testId: string;
};

/**
 * Reusable dropdown component styled like PickerNetwork
 *
 * @param props - Component props
 * @param props.options - Available options to display
 * @param props.selectedId - Currently selected option ID
 * @param props.onChange - Callback when selection changes
 * @param props.testId - Test ID prefix for testing
 */
export const Dropdown = <OptionId extends string>({
  options,
  selectedId,
  onChange,
  testId,
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

  // Focus the selected option when dropdown opens
  useEffect(() => {
    if (isOpen && selectedIndex >= 0) {
      setFocusedIndex(selectedIndex);
      optionRefs.current[selectedIndex]?.focus();
    }
  }, [isOpen, selectedIndex]);

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
        className="flex items-center justify-start gap-1 rounded-lg bg-background-muted px-3 py-2 hover:bg-hover active:opacity-70"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid={`${testId}-button`}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {selectedOption?.label ?? ''}
        </Text>
        <Icon
          name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
        />
      </ButtonBase>

      {/* Dropdown menu */}
      {isOpen && (
        <Box
          className="absolute left-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg"
          flexDirection={BoxFlexDirection.Column}
          role="listbox"
          aria-activedescendant={
            focusedIndex >= 0
              ? `${testId}-option-${options[focusedIndex]?.id}`
              : undefined
          }
          data-testid={`${testId}-menu`}
        >
          {options.map((option, index) => (
            <ButtonBase
              key={option.id}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              className="w-full justify-between text-left rounded-none px-3 py-2 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
              role="option"
              aria-selected={option.id === selectedId}
              id={`${testId}-option-${option.id}`}
              data-testid={`${testId}-option-${option.id}`}
            >
              <Text
                variant={TextVariant.BodySm}
                color={
                  option.id === selectedId
                    ? TextColor.TextDefault
                    : TextColor.TextAlternative
                }
              >
                {option.label}
              </Text>
              {option.id === selectedId && (
                <Icon
                  name={IconName.Check}
                  size={IconSize.Sm}
                  color={IconColor.PrimaryDefault}
                />
              )}
            </ButtonBase>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Dropdown;
