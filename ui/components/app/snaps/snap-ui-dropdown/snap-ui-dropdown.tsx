import React, { useEffect, useRef, useState } from 'react';
import classnames from 'clsx';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Label,
  HelpText,
  HelpTextSeverity,
} from '../../../component-library';
import Dropdown from '../../../ui/dropdown';

export type SnapUIDropdownProps = {
  name: string;
  label?: string;
  error?: string;
  options: { name: string; value: string }[];
  form?: string;
  disabled?: boolean;
};

export const SnapUIDropdown = ({
  name,
  label,
  error,
  form,
  disabled,
  ...props
}: SnapUIDropdownProps) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = useState(initialValue ?? '');
  const prevInitialValueRef = useRef<typeof initialValue | undefined>(undefined);

  useEffect(() => {
    if (prevInitialValueRef.current === undefined) {
      prevInitialValueRef.current = initialValue;
      return;
    }
    if (initialValue === prevInitialValueRef.current) {
      return;
    }
    prevInitialValueRef.current = initialValue;
    if (initialValue !== undefined && initialValue !== null) {
      queueMicrotask(() => setValue(initialValue));
    }
  }, [initialValue]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    handleInputChange(name, newValue, form);
  };

  return (
    <Box
      className={classnames('snap-ui-renderer__dropdown', {
        'snap-ui-renderer__field': label !== undefined,
      })}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      {label && <Label htmlFor={name}>{label}</Label>}
      <Dropdown
        data-testid="snaps-dropdown"
        selectedOption={value}
        onChange={handleChange}
        style={{
          border: '1px solid var(--color-border-muted)',
        }}
        disabled={disabled}
        {...props}
      />
      {error && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {error}
        </HelpText>
      )}
    </Box>
  );
};
