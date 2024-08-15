import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  HelpText,
  HelpTextSeverity,
  Label,
  Text,
} from '../../../component-library';

export type SnapUIRadioOption = { value: string; name: string };

export type SnapUIRadioGroupProps = {
  name: string;
  label?: string;
  error?: string;
  options: SnapUIRadioOption[];
  form?: string;
};

export const SnapUIRadioGroup: FunctionComponent<SnapUIRadioGroupProps> = ({
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
    if (initialValue && value !== initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    handleInputChange(name, newValue, form);
  };

  const displayRadioOptions = (options: SnapUIRadioOption[]) => {
    return options.map((option: SnapUIRadioOption) => {
      return (
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <input
            type="radio"
            id={option.name}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
          />
          <Text
            as="label"
            htmlFor={option.name}
            variant={TextVariant.bodyMd}
            marginLeft={1}
          >
            {option.name}
          </Text>
        </Box>
      );
    });
  };

  return (
    <Box
      className="snap-ui-renderer__radio"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
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
