import React, {
  ChangeEvent,
  FormEvent,
  FunctionComponent,
  memo,
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
  min?: number;
  max?: number;
  step?: number;
};

/**
 * Clamp a number between optional minimum and maximum values.
 *
 * @param inputValue - The number to clamp.
 * @param minimum - The optional minimum value.
 * @param maximum - The optional maximum value.
 * @returns The clamped number.
 */
const clamp = (inputValue: number, minimum?: number, maximum?: number) => {
  if (minimum !== undefined && inputValue < minimum) {
    return minimum;
  }

  if (maximum !== undefined && inputValue > maximum) {
    return maximum;
  }

  return inputValue;
};

export const SnapUIInput: FunctionComponent<
  SnapUIInputProps & FormTextFieldProps<'div'>
> = memo(
  ({
    name,
    form,
    step = 1,
    min,
    max,
    label,
    disabled,
    type,
    textFieldProps,
    ...props
  }) => {
    const {
      handleInputChange,
      getValue,
      focusedInput,
      setCurrentFocusedInput,
    } = useSnapInterfaceContext();

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
     * Apply the change to the input value in the UI and in the interface state.
     * The value is processed to replace commas with dots for number inputs.
     *
     * @param text - The new text input value.
     */
    const applyChange = (text: string) => {
      const textValue = getInputValue(text);

      setValue(textValue);
      handleInputChange(name, textValue ?? null, form);
    };

    /**
     * Handle input change event.
     *
     * @param event - The change event object.
     */
    const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
      applyChange(event.target.value);

    /**
     * Check if a character is allowed in number inputs.
     *
     * @param character - The character to check.
     * @param currentValue - The current input value.
     * @param selectionStart - The current cursor position.
     * @returns Whether the character is allowed.
     */
    const isAllowedCharacter = (
      character: string,
      currentValue: string,
      selectionStart: number | null,
    ) => {
      if (/\d/u.test(character)) {
        return true;
      }

      if (character === '.' || character === ',') {
        // allow only one decimal separator
        return !currentValue.includes('.') && !currentValue.includes(',');
      }

      if (character === '-') {
        // only allow minus at position 0
        return (
          (selectionStart === 0 || selectionStart === null) &&
          !currentValue.includes('-')
        );
      }
      return false;
    };

    /**
     * Handle before input event to restrict invalid characters for number inputs.
     * This is necessary because Firefox does not support type="number".
     *
     * @param event - The form event object.
     */
    const handleBeforeInput = (event: FormEvent<HTMLInputElement>) => {
      const inputEvent = event.nativeEvent as InputEvent;
      const character = inputEvent.data;

      if (!character) {
        return;
      }

      const target = event.target as HTMLInputElement;
      const { value: eventValue, selectionStart } = target;

      // helper reused from above
      if (!isAllowedCharacter(character, eventValue, selectionStart)) {
        event.preventDefault();
      }
    };

    /**
     * Handle incrementing or decrementing the number input value.
     *
     * @param direction - Direction to increment (1) or decrement (-1).
     * @param multiplier - Multiplier for the step (e.g., 10 when Shift is held).
     */
    const handleIncrement = (direction: 1 | -1, multiplier = 1) => {
      const base = Number(value) ?? 0;
      const delta = step * multiplier * direction;
      const next = clamp(Number(base + delta), min, max).toString();

      applyChange(next);

      inputRef.current?.querySelector('input')?.focus();
    };

    /**
     * Handle key down events for number inputs to support arrow key increment/decrement.
     *
     * @param event - The keyboard event object.
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const multiplier = event.shiftKey ? 10 : 1;

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          handleIncrement(1, multiplier);
          break;
        }

        case 'ArrowDown': {
          event.preventDefault();
          handleIncrement(-1, multiplier);
          break;
        }

        default:
          break;
      }
    };

    /**
     * Handle mouse wheel events for number inputs to support increment/decrement.
     *
     * @param event - The wheel event object.
     */
    const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
      // If wheel on input, increment/decrement
      if (document.activeElement === inputRef.current?.querySelector('input')) {
        event.preventDefault();

        const direction = event.deltaY < 0 ? 1 : -1;
        const multiplier = event.shiftKey ? 10 : 1;

        handleIncrement(direction, multiplier);
      }
    };

    const handleFocus = () => setCurrentFocusedInput(name);
    const handleBlur = () => setCurrentFocusedInput(null);

    return type === 'number' ? (
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
          inputProps: {
            onBeforeInput: handleBeforeInput,
          },
        }}
        onChange={handleChange}
        label={label}
        labelProps={{ marginBottom: 0 }}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        {...props}
      />
    ) : (
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
  },
);
