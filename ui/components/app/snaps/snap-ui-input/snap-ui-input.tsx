import React, { ChangeEvent, FunctionComponent } from 'react';
import { useSnapInterfaceContext } from '../../../../contexts/snap';
import { FormTextField, FormTextFieldProps } from '../../../component-library';

export type SnapUIInputProps = {
  name: string;
  form?: string;
};

export const SnapUIInput: FunctionComponent<
  SnapUIInputProps & FormTextFieldProps<'div'>
> = ({ name, form, ...props }) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const value = getValue(name, form);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleInputChange(name, event.target.value ?? null, form);
  };
  return (
    <FormTextField
      className="snap-ui-renderer__input"
      id={name}
      marginBottom={1}
      marginTop={1}
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
};
