import React, {
  ChangeEvent,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { FormTextField, FormTextFieldProps } from '../../../component-library';

export type SnapUIInputProps = {
  name: string;
  form?: string;
};

export const SnapUIInput: FunctionComponent<
  SnapUIInputProps & FormTextFieldProps<'div'>
> = ({ name, form, ...props }) => {
  const { handleInputChange, getValue, focusedInput, setCurrentFocusedInput } =
    useSnapInterfaceContext();

  const inputRef = useRef<HTMLDivElement>(null);

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = useState(initialValue ?? '');

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  /*
   * Focus input if the last focused input was this input
   * This avoids loosing the focus when the UI is re-rendered
   */
  useEffect(() => {
    if (inputRef.current && name === focusedInput) {
      (inputRef.current.children[0] as HTMLInputElement).focus();
    }
  }, [inputRef]);

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
      className="snap-ui-renderer__input"
      id={name}
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
};
