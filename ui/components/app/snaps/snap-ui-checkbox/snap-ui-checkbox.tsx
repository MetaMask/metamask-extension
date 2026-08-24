import React, { useEffect, useState } from 'react';
import classnames from 'clsx';
import { Checkbox } from '@metamask/design-system-react';
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
import ToggleButton from '../../../ui/toggle-button';

export type SnapUICheckboxProps = {
  name: string;
  fieldLabel?: string;
  variant?: 'default' | 'toggle';
  label?: string;
  error?: string;
  form?: string;
  disabled?: boolean;
};

export const SnapUICheckbox = ({
  name,
  variant,
  fieldLabel,
  label,
  error,
  form,
  disabled,
  ...props
}: SnapUICheckboxProps) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as boolean;

  const [value, setValue] = useState(initialValue ?? false);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = () => {
    // ToggleButton passes the current value; design-system Checkbox passes the
    // next selected value. Ignore the argument and always flip local state so
    // both variants stay in sync.
    setValue(!value);
    handleInputChange(name, !value, form);
  };

  return (
    <Box
      className={classnames('snap-ui-renderer__checkbox', {
        'snap-ui-renderer__field': label !== undefined,
      })}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      {fieldLabel && <Label htmlFor={name}>{fieldLabel}</Label>}
      {variant === 'toggle' ? (
        <ToggleButton
          onToggle={handleChange}
          value={value}
          onLabel={label}
          offLabel={label}
          disabled={disabled}
          {...props}
        />
      ) : (
        <Checkbox
          id={name}
          onChange={handleChange}
          isSelected={value}
          label={label}
          isDisabled={disabled}
          {...props}
          inputProps={{
            'data-testid': `snap-ui-checkbox-${name}`,
          }}
        />
      )}
      {error && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {error}
        </HelpText>
      )}
    </Box>
  );
};
