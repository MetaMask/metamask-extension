import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { FormTextField } from '../../component-library';

export interface FormComboFieldOption {
  primaryLabel: string;
  secondaryLabel?: string;
}

export interface FormComboFieldProps {
  alwaysVisible?: boolean;
  maxDropdownHeight?: number;
  options: FormComboFieldOption[];
  onChange?: (value: string) => void;
  onOptionClick?: (option: FormComboFieldOption) => void;
  placeholder?: string;
  value: string;
}

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

  const { primaryLabel, secondaryLabel } = option;

  return (
    <div
      tabIndex={0}
      className="form-combo-field__option"
      onClick={handleClick}
    >
      <span className="form-combo-field__option-primary">{primaryLabel}</span>
      {secondaryLabel ? (
        <span className="form-combo-field__option-secondary">
          {secondaryLabel}
        </span>
      ) : null}
    </div>
  );
}

function Dropdown({
  maxDropdownHeight,
  options,
  onOptionClick,
  width,
}: {
  maxDropdownHeight?: number;
  options: FormComboFieldOption[];
  onOptionClick: (option: FormComboFieldOption) => void;
  width: number;
}) {
  return (
    <div
      className="form-combo-field__dropdown"
      style={{ width, maxHeight: maxDropdownHeight }}
    >
      {options.map((option) => (
        <Option
          option={option}
          onClick={() => {
            onOptionClick(option);
          }}
        />
      ))}
    </div>
  );
}

export default function FormComboField({
  alwaysVisible = false,
  maxDropdownHeight,
  options,
  onChange,
  onOptionClick,
  placeholder,
  value,
}: FormComboFieldProps) {
  const [dropdownVisible, setDropdownVisible] = useState(alwaysVisible);
  const valueRef = useRef<any>();
  const [valueWidth, setValueWidth] = useState(0);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setValueWidth(valueRef.current?.offsetWidth);
  });

  const handleBlur = useCallback(
    (e?: any) => {
      if (alwaysVisible) {
        return;
      }

      if (e?.relatedTarget?.className !== 'form-combo-field__option') {
        setDropdownVisible(false);
      }
    },
    [alwaysVisible, setDropdownVisible],
  );

  const handleChange = useCallback(
    (e: any) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const handleOptionClick = useCallback(
    (option) => {
      handleChange({ target: { value: option.primaryLabel } });
      setDropdownVisible(alwaysVisible);
      onOptionClick?.(option);
      inputRef.current?.focus();
    },
    [alwaysVisible, setDropdownVisible],
  );

  return (
    <div className="form-combo-field" ref={valueRef}>
      <div
        onClick={() => {
          setDropdownVisible(true);
        }}
      >
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
        />
      </div>
      {dropdownVisible && (
        <Dropdown
          maxDropdownHeight={maxDropdownHeight}
          options={options}
          onOptionClick={handleOptionClick}
          width={valueWidth}
        />
      )}
    </div>
  );
}
