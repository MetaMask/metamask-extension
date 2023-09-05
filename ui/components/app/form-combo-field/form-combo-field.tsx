/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import {
  ButtonIcon,
  ButtonIconSize,
  FormTextField,
  IconName,
} from '../../component-library';
import { I18nContext } from '../../../contexts/i18n';
import { Display, IconColor } from '../../../helpers/constants/design-system';

export interface FormComboFieldOption {
  primaryLabel: string;
  secondaryLabel?: string;
}

export interface FormComboFieldProps {
  maxDropdownHeight?: number;
  noOptionsText?: string;
  onChange?: (value: string) => void;
  onOptionClick?: (option: FormComboFieldOption) => void;
  options: FormComboFieldOption[];
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
  noOptionsText,
  onOptionClick,
  options,
  width,
}: {
  maxDropdownHeight?: number;
  noOptionsText?: string;
  onOptionClick: (option?: FormComboFieldOption) => void;
  options: FormComboFieldOption[];
  width: number;
}) {
  const t = useContext(I18nContext);

  return (
    <div
      className="form-combo-field__dropdown"
      style={{ width, maxHeight: maxDropdownHeight }}
    >
      {options.length === 0 && (
        <Option
          option={{ primaryLabel: noOptionsText ?? t('comboNoOptions') }}
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

export default function FormComboField({
  maxDropdownHeight,
  noOptionsText,
  onChange,
  onOptionClick,
  options,
  placeholder,
  value,
}: FormComboFieldProps) {
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
    (option) => {
      setDropdownVisible(false);

      if (option) {
        handleChange({ target: { value: option.primaryLabel } });
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
