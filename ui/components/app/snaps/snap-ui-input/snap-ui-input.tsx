import React, {
  ChangeEvent,
  FormEvent,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { FormTextField, FormTextFieldProps } from '../../../component-library';

const DECIMAL_INPUT_REGEX = /^\d*(\.|,)?\d*$/u;

export type SnapUIInputProps = {
  name: string;
  form?: string;
  label?: string | React.ReactNode;
};

export const SnapUIInput: FunctionComponent<
  SnapUIInputProps & FormTextFieldProps<'div'>
> = ({ name, form, label, disabled, type, textFieldProps, ...props }) => {
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

  /**
   * Get the input value, replacing commas with dots for number inputs.
   *
   * @param text - The current text input value.
   * @returns The processed input value.
   */
  const getInputValue = (text: string) => {
    if (type === 'number') {
      // Mimic browser behaviour where commas are replaced.
      return text.replace(/,/gu, '.');
    }

    return text;
  };

  /**
   * Handle input change event.
   * The value is processed to replace commas with dots for number inputs.
   *
   * @param event - The change event object.
   */
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const textValue = getInputValue(event.target.value);

    setValue(textValue);
    handleInputChange(name, textValue ?? null, form);
  };

  /**
   * Handle before input event to restrict invalid characters for number inputs.
   * This is necessary because Firefox does not support type="number".
   *
   * @param event - The form event object.
   */
  const handleBeforeInput = (event: FormEvent<HTMLInputElement>) => {
    const inputValue = (event.nativeEvent as InputEvent).data;

    if (
      type === 'number' &&
      inputValue &&
      !DECIMAL_INPUT_REGEX.test(inputValue)
    ) {
      event.preventDefault();
    }
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
      textFieldProps={{
        ...textFieldProps,
        inputProps: {
          onBeforeInput: handleBeforeInput,
          ...textFieldProps?.inputProps,
        },
      }}
      onChange={handleChange}
      label={label}
      labelProps={{ marginBottom: 0 }}
      disabled={disabled}
      {...props}
    />
  );
};
