import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Tooltip } from 'react-tippy';
import PropTypes from 'prop-types';
import classnames from 'clsx';

const INPUT_HORIZONTAL_PADDING = 4;

function removeLeadingZeroes(str) {
  return str.replace(/^0*(?=\d)/u, '');
}

const DECIMAL_INPUT_REGEX = /^\d*(\.|,)?\d*$/u;

const UnitInput = forwardRef(function UnitInput(
  {
    className,
    dataTestId,
    children,
    actionComponent,
    error,
    onChange,
    onBlur,
    placeholder = '0',
    suffix,
    hideSuffix,
    value: valueProp = '',
    keyPressRegex = DECIMAL_INPUT_REGEX,
    isDisabled,
    isFocusOnInput,
    onPaste,
    'data-testid': dataTestIdProp,
  },
  ref,
) {
  const unitInputRef = useRef(null);
  const previousValuePropRef = useRef(valueProp);
  const [value, setValue] = useState(valueProp);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const getIsOverflowing = useCallback(() => {
    const unitInput = unitInputRef.current;
    if (!unitInput) {
      return false;
    }

    const { offsetWidth, scrollWidth } = unitInput;
    return scrollWidth - offsetWidth > INPUT_HORIZONTAL_PADDING;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      updateIsOverflowing: () => {
        setIsOverflowing(getIsOverflowing());
      },
    }),
    [getIsOverflowing],
  );

  useEffect(() => {
    if (Number(valueProp) !== Number(previousValuePropRef.current)) {
      setValue(valueProp);
      previousValuePropRef.current = valueProp;
    }
  }, [valueProp]);

  const handleFocus = useCallback(() => {
    if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      unitInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (isFocusOnInput) {
      document.addEventListener('keypress', handleFocus);
      return () => {
        document.removeEventListener('keypress', handleFocus);
      };
    }
    return undefined;
  }, [handleFocus, isFocusOnInput]);

  const handleInputFocus = useCallback(({ target: { value: inputValue } }) => {
    if (inputValue === '0') {
      setIsOverflowing(false);
      setValue('');
    }
  }, []);

  const handleInputBlur = useCallback(
    ({ target: { value: inputValue } }) => {
      if (inputValue === '') {
        setIsOverflowing(false);
        setValue('0');
      }

      onBlur?.(inputValue);
      unitInputRef.current?.scrollTo?.(0, 0);
    },
    [onBlur],
  );

  const handleChange = useCallback(
    (event) => {
      const { value: userInput } = event.target;
      let nextValue = userInput;

      if (userInput.length && userInput.length > 1) {
        nextValue = removeLeadingZeroes(userInput);
      }

      if (!keyPressRegex.test(nextValue)) {
        event.preventDefault();
        return;
      }

      setValue(nextValue);
      setIsOverflowing(getIsOverflowing());
      onChange?.(nextValue);
    },
    [getIsOverflowing, keyPressRegex, onChange],
  );

  const handleOnKeyPress = useCallback((event) => {
    const isNumericInput = DECIMAL_INPUT_REGEX.test(event.key);
    if (!isNumericInput) {
      event.preventDefault();
    }
  }, []);

  const getInputWidth = (inputValue) => {
    const valueString = String(inputValue);
    const valueLength = valueString.length || 1;
    const decimalPointDeficit = valueString.match(/\./u) ? -0.5 : 0;
    return `${valueLength + decimalPointDeficit + 0.5}ch`;
  };

  const resolvedDataTestId = dataTestId ?? dataTestIdProp;

  return (
    <div
      className={classnames(
        'unit-input',
        { 'unit-input--error': error },
        className,
      )}
      onClick={handleFocus}
    >
      <div className="unit-input__inputs">
        <Tooltip
          title={value}
          disabled={!isOverflowing || !value}
          arrow
          hideOnClick={false}
          className="unit-input__input-container"
          style={{ display: 'inherit' }}
        >
          <input
            disabled={isDisabled}
            data-testid={resolvedDataTestId}
            type="number"
            dir="ltr"
            className={classnames('unit-input__input')}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            onKeyPress={handleOnKeyPress}
            onPaste={onPaste}
            min={0}
            step="any"
            style={{ width: getInputWidth(value) }}
            ref={unitInputRef}
            autoFocus
          />
          {suffix && !hideSuffix ? (
            <div className="unit-input__suffix">{suffix}</div>
          ) : null}
        </Tooltip>
        {children}
      </div>
      {actionComponent}
    </div>
  );
});

UnitInput.propTypes = {
  className: PropTypes.string,
  dataTestId: PropTypes.string,
  children: PropTypes.node,
  actionComponent: PropTypes.node,
  error: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  suffix: PropTypes.string,
  hideSuffix: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  keyPressRegex: PropTypes.instanceOf(RegExp),
  isDisabled: PropTypes.bool,
  isFocusOnInput: PropTypes.bool,
  onPaste: PropTypes.func,
  'data-testid': PropTypes.string,
};

export default UnitInput;
