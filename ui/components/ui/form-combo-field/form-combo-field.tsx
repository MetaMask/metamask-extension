/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import { ButtonIcon, ButtonIconSize, IconName } from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import { I18nContext } from '../../../contexts/i18n';
import { Display, IconColor } from '../../../helpers/constants/design-system';

export type FormComboFieldOption = {
  value: string;
  primaryLabel?: string;
  secondaryLabel?: string;
};

export type FormComboFieldProps<Option extends FormComboFieldOption> = {
  /** Whether to hide the 'no option' when there are no options to display. */
  hideDropdownIfNoOptions?: boolean;

  /** The maximum height of the dropdown in pixels. */
  maxDropdownHeight?: number;

  /** The text to display in the dropdown when there are no options to display. */
  noOptionsText?: string;

  /** Callback function to invoke when the value changes. */
  onChange?: (value: string) => void;

  /** Callback function to invoke when a dropdown option is clicked. */
  onOptionClick?: (option: Option) => void;

  /**
   * The options to display in the dropdown.
   */
  options: Option[];

  /** The placeholder text to display in the field when the value is empty. */
  placeholder?: string;

  /** The value to display in the field. */
  value: string;
};

function Option({
  option,
  onClick,
}: {
  option: FormComboFieldOption;
  onClick: (option: FormComboFieldOption) => void;
}) {
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();

      onClick(option);
    },
    [onClick, option],
  );

  const { primaryLabel, secondaryLabel, value } = option;

  return (
    <div
      tabIndex={0}
      className="form-combo-field__option"
      onClick={handleClick}
    >
      <span className="form-combo-field__option-primary">
        {primaryLabel ?? value}
      </span>
      {secondaryLabel ? (
        <span className="form-combo-field__option-secondary">
          {secondaryLabel}
        </span>
      ) : null}
    </div>
  );
}

function Dropdown<Option extends FormComboFieldOption>({
  hideDropdownIfNoOptions,
  maxDropdownHeight,
  noOptionsText,
  onOptionClick,
  options,
  width,
}: {
  hideDropdownIfNoOptions: boolean;
  maxDropdownHeight?: number;
  noOptionsText?: string;
  onOptionClick: (option?: Option) => void;
  options: Option[];
  width: number;
}) {
  const t = useContext(I18nContext);
  const ref = useRef<any>();
  const maxHeight = maxDropdownHeight ?? 179;
  const [dropdownHeight, setDropdownHeight] = useState(0);

  useEffect(() => {
    setDropdownHeight(ref.current?.scrollHeight ?? 0);
  });

  return (
    <div
      ref={ref}
      style={{ width, maxHeight }}
      className={classnames({
        'form-combo-field__dropdown': true,
        'form-combo-field__dropdown__scroll': dropdownHeight > maxHeight,
      })}
    >
      {options.length === 0 && !hideDropdownIfNoOptions && (
        <Option
          option={{
            primaryLabel: noOptionsText ?? t('comboNoOptions'),
            value: '',
          }}
          onClick={() => onOptionClick(undefined)}
        />
      )}
      {options.map((option, index) => (
        <Option
          key={index}
          option={option}
          onClick={() => {
            onOptionClick(option);
          }}
        />
      ))}
    </div>
  );
}

export default function FormComboField<Option extends FormComboFieldOption>({
  hideDropdownIfNoOptions = false,
  maxDropdownHeight,
  noOptionsText,
  onChange,
  onOptionClick,
  options,
  placeholder,
  value,
}: FormComboFieldProps<Option>) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const valueRef = useRef<any>();
  const [valueWidth, setValueWidth] = useState(0);
  const inputRef = useRef<any>(null);
  const t = useContext(I18nContext);

  useEffect(() => {
    setValueWidth(valueRef.current?.offsetWidth);
  });

  const handleBlur = useCallback(
    (e?: any) => {
      if (e?.relatedTarget?.className !== 'form-combo-field__option') {
        setDropdownVisible(false);
      }
    },
    [setDropdownVisible],
  );

  const handleChange = useCallback(
    (e: any) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const handleOptionClick = useCallback(
    (option?: Option) => {
      setDropdownVisible(false);

      if (option) {
        handleChange({ target: { value: option.value } });
        onOptionClick?.(option);
      }

      inputRef.current?.focus();
    },
    [setDropdownVisible, handleChange],
  );

  const handleClearClick = useCallback(() => {
    handleChange({ target: { value: '' } });
    inputRef.current?.focus();
  }, [handleChange]);

  return (
    <div className="form-combo-field" ref={valueRef}>
      <div
        onClick={() => {
          setDropdownVisible(true);
        }}
      >
        {/* @ts-ignore */}
        <FormTextField
          autoFocus
          inputRef={inputRef}
          placeholder={placeholder}
          onBlur={handleBlur}
          onKeyUp={(e: any) => {
            if (e.key === 'Enter') {
              handleBlur();
            }
          }}
          value={value}
          onChange={handleChange}
          className={classnames({
            'form-combo-field__value': true,
            'form-combo-field__value-dropdown-visible': dropdownVisible,
          })}
          endAccessory={
            <ButtonIcon
              display={Display.Flex}
              iconName={IconName.Close}
              size={ButtonIconSize.Sm}
              onClick={() => handleClearClick()}
              color={IconColor.iconMuted}
              ariaLabel={t('clear')}
            />
          }
        />
      </div>
      {dropdownVisible && (
        <Dropdown
          hideDropdownIfNoOptions={hideDropdownIfNoOptions}
          maxDropdownHeight={maxDropdownHeight}
          noOptionsText={noOptionsText}
          onOptionClick={handleOptionClick}
          options={options}
          width={valueWidth}
        />
      )}
    </div>
  );
}
