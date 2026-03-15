import React, { FunctionComponent, useEffect, useState } from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { TextVariant } from '../../../../helpers/constants/design-system';
import {
  HelpText,
  HelpTextSeverity,
  Label,
  Text,
} from '../../../component-library';

export type SnapUIRadioOption = {
  value: string;
  name: string;
  disabled: boolean;
};

export type SnapUIRadioGroupProps = {
  name: string;
  label?: string;
  error?: string;
  options: SnapUIRadioOption[];
  form?: string;
  disabled?: boolean;
};

export const SnapUIRadioGroup: FunctionComponent<SnapUIRadioGroupProps> = ({
  name,
  label,
  error,
  form,
  disabled,
  ...props
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = useState(initialValue ?? '');

  useEffect(() => {
    if (initialValue) {
      setValue((currentValue) =>
        currentValue === initialValue ? currentValue : initialValue,
      );
    }
  }, [initialValue]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    handleInputChange(name, newValue, form);
  };

  const displayRadioOptions = (options: SnapUIRadioOption[]) => {
    return options.map((option: SnapUIRadioOption) => {
      return (
        <Box
          key={option.value}
          className="flex"
          alignItems={BoxAlignItems.Center}
        >
          <input
            type="radio"
            id={option.name}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            style={{ margin: '0' }} // radio buttons have default margins that need to be stripped to ensure proper centering
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880

            disabled={disabled || option.disabled}
          />
          <Text
            className={classnames({
              'snap-ui-renderer__radio-label--disabled':
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880

                disabled || option.disabled,
            })}
            as="label"
            htmlFor={option.name}
            variant={TextVariant.bodyMd}
            marginLeft={2}
          >
            {option.name}
          </Text>
        </Box>
      );
    });
  };

  return (
    <Box
      className={classnames(
        'snap-ui-renderer__radio',
        {
          'snap-ui-renderer__field': label !== undefined,
        },
        'flex',
      )}
      flexDirection={BoxFlexDirection.Column}
    >
      {label && <Label htmlFor={name}>{label}</Label>}
      {displayRadioOptions(props.options)}
      {error && (
        <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
          {error}
        </HelpText>
      )}
    </Box>
  );
};
