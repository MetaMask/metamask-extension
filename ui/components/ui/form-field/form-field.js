import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Typography from '../typography/typography';
import Box from '../box/box';
import {
  COLORS,
  TEXT_ALIGN,
  DISPLAY,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

import NumericInput from '../numeric-input/numeric-input.component';
import InfoTooltip from '../info-tooltip/info-tooltip';

export default function FormField({
  titleText,
  titleUnit,
  tooltipText,
  titleDetail,
  error,
  onChange,
  value,
  numeric,
  detailText,
  autoFocus,
  password,
  allowDecimals,
  disabled,
}) {
  return (
    <div
      className={classNames('form-field', {
        'form-field__row--error': error,
      })}
    >
      <label>
        <div className="form-field__heading">
          <div className="form-field__heading-title">
            {titleText && (
              <Typography
                tag={TYPOGRAPHY.H6}
                fontWeight={FONT_WEIGHT.BOLD}
                variant={TYPOGRAPHY.H6}
                boxProps={{ display: DISPLAY.INLINE_BLOCK }}
              >
                {titleText}
              </Typography>
            )}
            {titleUnit && (
              <Typography
                tag={TYPOGRAPHY.H6}
                variant={TYPOGRAPHY.H6}
                color={COLORS.UI4}
                boxProps={{ display: DISPLAY.INLINE_BLOCK }}
              >
                {titleUnit}
              </Typography>
            )}
            {tooltipText && (
              <InfoTooltip position="top" contentText={tooltipText} />
            )}
          </div>
          {titleDetail && (
            <Box
              className="form-field__heading-detail"
              textAlign={TEXT_ALIGN.END}
              marginBottom={3}
              marginRight={2}
            >
              {titleDetail}
            </Box>
          )}
        </div>
        {numeric ? (
          <NumericInput
            error={error}
            onChange={onChange}
            value={value}
            detailText={detailText}
            autoFocus={autoFocus}
            allowDecimals={allowDecimals}
            disabled={disabled}
          />
        ) : (
          <input
            className={classNames('form-field__input', {
              'form-field__input--error': error,
            })}
            onChange={(e) => onChange(e.target.value)}
            value={value}
            type={password ? 'password' : 'text'}
            autoFocus={autoFocus}
            disabled={disabled}
          />
        )}
        {error && (
          <Typography
            color={COLORS.ERROR1}
            variant={TYPOGRAPHY.H7}
            className="form-field__error"
          >
            {error}
          </Typography>
        )}
      </label>
    </div>
  );
}

FormField.propTypes = {
  titleText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleUnit: PropTypes.string,
  tooltipText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleDetail: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  error: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.number,
  detailText: PropTypes.string,
  autoFocus: PropTypes.bool,
  numeric: PropTypes.bool,
  password: PropTypes.bool,
  allowDecimals: PropTypes.bool,
  disabled: PropTypes.bool,
};

FormField.defaultProps = {
  titleText: '',
  titleUnit: '',
  tooltipText: '',
  titleDetail: '',
  error: '',
  onChange: undefined,
  value: 0,
  detailText: '',
  autoFocus: false,
  numeric: false,
  password: false,
  allowDecimals: true,
  disabled: false,
};
