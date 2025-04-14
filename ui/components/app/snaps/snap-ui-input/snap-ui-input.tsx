// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, {
  ChangeEvent,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { FormTextField, FormTextFieldProps } from '../../../component-library';

export type SnapUIInputProps = {
  name: string;
  form?: string;
  label?: string | React.ReactNode;
};

export const SnapUIInput: FunctionComponent<
  SnapUIInputProps & FormTextFieldProps<'div'>
> = ({ name, form, label, disabled, ...props }) => {
  const { handleInputChange, getValue, focusedInput, setCurrentFocusedInput } =
    useSnapInterfaceContext();

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      (inputRef.current.querySelector('input') as HTMLInputElement).focus();
    }
  }, [inputRef]);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    handleInputChange(name, event.target.value ?? null, form);
  };

  const handleFocus = () => setCurrentFocusedInput(name);
  const handleBlur = () => setCurrentFocusedInput(null);

  return (
    <FormTextField
      ref={inputRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={classnames('snap-ui-renderer__input', {
        'snap-ui-renderer__field': label !== undefined,
      })}
      id={name}
      value={value}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      {...props}
    />
  );
};
