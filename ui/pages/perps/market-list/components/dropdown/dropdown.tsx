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

export type DropdownOption<T extends string> = {
  id: T;
  label: string;
};

export type DropdownProps<T extends string> = {
  /** Available options */
  options: DropdownOption<T>[];
  /** Currently selected option ID */
  selectedId: T;
  /** Callback when selection changes */
  onChange: (id: T) => void;
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
export function Dropdown<T extends string>({
  options,
  selectedId,
  onChange,
  testId,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (option: DropdownOption<T>) => {
      onChange(option.id);
      setIsOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button styled like PickerNetwork */}
      <ButtonBase
        size={ButtonBaseSize.Sm}
        className="flex items-center justify-start gap-1 rounded-lg bg-background-muted px-3 py-2 hover:bg-hover active:opacity-70"
        onClick={handleToggle}
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
          data-testid={`${testId}-menu`}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-hover active:bg-pressed"
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
            </button>
          ))}
        </Box>
      )}
    </div>
  );
}

export default Dropdown;
