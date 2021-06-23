import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Typography from '../typography/typography';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';

export default function NumericInput({ detailText, value, onChange, error }) {
  return (
    <div
      className={classNames('numeric-input', { 'numeric-input--error': error })}
    >
      <input
        type="number"
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        min="0"
      />
      {detailText && (
        <Typography color={COLORS.UI4} variant={TYPOGRAPHY.H7} tag="span">
          {detailText}
        </Typography>
      )}
    </div>
  );
}

NumericInput.propTypes = {
  value: PropTypes.number,
  detailText: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
};

NumericInput.defaultProps = {
  value: 0,
  detailText: '',
  onChange: undefined,
  error: '',
};
