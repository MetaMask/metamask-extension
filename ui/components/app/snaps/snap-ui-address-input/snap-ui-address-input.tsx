import React, { ChangeEvent, KeyboardEvent, FunctionComponent, useEffect, useRef, useState } from 'react';
import { FormTextField, FormTextFieldProps, Icon, IconName } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import classnames from 'classnames';

export type SnapUIAddressInputProps = {
  name: string;
  form?: string;
  label?: string;
};


export const SnapUIAddressInput: FunctionComponent<SnapUIAddressInputProps & FormTextFieldProps<'div'>
> = ({ name, form, label, error, ...props }) => {
  const { handleInputChange, getValue, focusedInput, setCurrentFocusedInput } =
    useSnapInterfaceContext();

  const inputRef = useRef<HTMLDivElement>(null);

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = useState(initialValue ?? '');

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(initialValue);
    }
  }, [initialValue]);

  /*
   * Focus input if the last focused input was this input
   * This avoids losing the focus when the UI is re-rendered
   */
  useEffect(() => {
    if (inputRef.current && name === focusedInput) {
      (inputRef.current.querySelector('input') as HTMLInputElement).focus();
    }
  }, [inputRef]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    handleInputChange(name, event.target.value ?? null, form);
  };

  const handleFocus = () => setCurrentFocusedInput(name);
  const handleBlur = () => setCurrentFocusedInput(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!error && initialValue && (event.key === 'Enter' || event.key === 'Tab')) {
      event.preventDefault();
      handleInputChange(name, value, form);
    }
  };

  const handleClear = () => {
    setValue('');
    handleInputChange(name, null, form);
  };

  return (
    <FormTextField
      ref={inputRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={classnames('snap-ui-renderer__address-input', {
        'snap-ui-renderer__field': label !== undefined,
      })}
      id={name}
      value={value}
      onChange={handleChange}
      label={label}
      error={Boolean(error)}
      helpText={error}
      textFieldProps={{ onKeyDown: handleKeyDown }}
      endAccessory={value ? <Icon onClick={handleClear} name={IconName.Close} /> : null}
      {...props}
    />
  );
};
