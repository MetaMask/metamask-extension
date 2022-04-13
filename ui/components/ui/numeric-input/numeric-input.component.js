import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Typography from '../typography/typography';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';

const DECIMAL_REGEX = /\.(\d*)/u;

export default function NumericInput({
  detailText = '',
  value = 0,
  onChange,
  error = '',
  autoFocus = false,
  allowDecimals = true,
  disabled = false,
  dataTestId,
  placeholder,
}) {
  return (
    <div
      className={classNames('numeric-input', { 'numeric-input--error': error })}
    >
      <input
        type="number"
        value={value}
        onKeyDown={(e) => {
          if (!allowDecimals && e.key === '.') {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const newValue = e.target.value;
          const match = DECIMAL_REGEX.exec(newValue);
          if (match?.[1]?.length >= 15) {
            return;
          }
          onChange?.(parseFloat(newValue || 0, 10));
        }}
        min="0"
        autoFocus={autoFocus}
        disabled={disabled}
        data-testid={dataTestId}
        placeholder={placeholder}
      />
      {detailText && (
        <Typography
          color={COLORS.TEXT_ALTERNATIVE}
          variant={TYPOGRAPHY.H7}
          tag="span"
        >
          {detailText}
        </Typography>
      )}
    </div>
  );
}

NumericInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  detailText: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  autoFocus: PropTypes.bool,
  allowDecimals: PropTypes.bool,
  disabled: PropTypes.bool,
  dataTestId: PropTypes.string,
  placeholder: PropTypes.string,
};
