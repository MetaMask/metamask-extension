import React, { FunctionComponent, useEffect, useState } from 'react';
import classnames from 'classnames';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  BorderColor,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Label,
  HelpText,
  HelpTextSeverity,
  Checkbox,
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

export const SnapUICheckbox: FunctionComponent<SnapUICheckboxProps> = ({
  name,
  variant,
  fieldLabel,
  label,
  error,
  form,
  disabled,
  ...props
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as boolean;

  const [value, setValue] = useState(initialValue ?? false);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = () => {
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
          onChange={handleChange}
          isChecked={value}
          label={label}
          inputProps={{
            borderColor: BorderColor.borderMuted,
          }}
          isDisabled={disabled}
          {...props}
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
