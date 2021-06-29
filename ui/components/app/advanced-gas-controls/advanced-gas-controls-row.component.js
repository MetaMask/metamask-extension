import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TEXT_ALIGN,
  DISPLAY,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

import NumericInput from '../../ui/numeric-input/numeric-input.component';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';

export default function AdvancedGasControlsRow({
  titleText,
  tooltipText,
  titleDetailText,
  error,
  onChange,
  value,
}) {
  return (
    <div
      className={classNames('advanced-gas-controls__row', {
        'advanced-gas-controls__row--error': error,
      })}
    >
      <label>
        <div className="advanced-gas-controls__row-heading">
          <div className="advanced-gas-controls__row-heading-title">
            <Typography
              tag={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              variant={TYPOGRAPHY.H6}
              boxProps={{ display: DISPLAY.INLINE_BLOCK }}
            >
              {titleText}
            </Typography>

            <InfoTooltip position="top" contentText={tooltipText} />
          </div>
          {titleDetailText && (
            <Typography
              className="advanced-gas-controls__row-heading-detail"
              align={TEXT_ALIGN.END}
              color={COLORS.UI4}
              variant={TYPOGRAPHY.H8}
            >
              {titleDetailText}
            </Typography>
          )}
        </div>
        <NumericInput error={error} onChange={onChange} value={value} />
        {error && (
          <Typography
            color={COLORS.ERROR1}
            variant={TYPOGRAPHY.H7}
            className="advanced-gas-controls__row-error"
          >
            {error}
          </Typography>
        )}
      </label>
    </div>
  );
}

AdvancedGasControlsRow.propTypes = {
  titleText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleDetailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  error: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.number,
};

AdvancedGasControlsRow.defaultProps = {
  titleText: '',
  tooltipText: '',
  titleDetailText: '',
  error: '',
  onChange: undefined,
  value: 0,
};
