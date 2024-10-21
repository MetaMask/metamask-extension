import React, { FunctionComponent, useEffect, useState } from 'react';
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
};

export const SnapUIDropdown: FunctionComponent<SnapUIDropdownProps> = ({
  name,
  label,
  error,
  form,
  ...props
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = useState(initialValue ?? '');

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    handleInputChange(name, newValue, form);
  };

  return (
    <Box
      className="snap-ui-renderer__dropdown"
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
