import React from 'react';
import PropTypes from 'prop-types';
import MaterialSlider from '@material-ui/core/Slider';
import { withStyles } from '@material-ui/core/styles';

import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

import InfoTooltip from '../info-tooltip/info-tooltip';
import Typography from '../typography/typography';

const styles = {
  root: {
    height: 6,
    padding: '6px 0',
  },
  rail: {
    borderRadius: 50,
    background: 'var(--color-background-alternative)',
    height: 6,
  },
  track: {
    borderRadius: 50,
    background: 'var(--color-primary-default)',
    height: 6,
  },
  thumb: {
    height: 20,
    width: 20,
    marginTop: -7,
    marginLeft: -7,
    backgroundColor: 'var(--color-primary-default)',
    border: '1px solid var(--color-border-muted)',
    boxSizing: 'border-box',
    boxShadow: '0px 0px 14px 0px rgba(0, 0, 0, 0.18)',
    '&:focus, &$active': {
      height: 20,
      width: 20,
      marginTop: -7,
      marginLeft: -7,
      boxShadow: '0px 0px 14px 0px rgba(0, 0, 0, 0.18)',
    },
    '&:hover': {
      height: 22,
      width: 22,
      marginTop: -8,
      marginLeft: -8,
      border: 'none',
      boxShadow: '0px 0px 14px 0px rgba(0, 0, 0, 0.18)',
    },
  },
};

const Slider = ({
  editText,
  infoText,
  onEdit,
  titleDetail,
  titleText,
  tooltipText,
  valueText,
  ...rest
}) => (
  <div className="slider">
    <div className="slider__heading">
      <div className="slider__heading-title">
        {titleText && (
          <Typography
            tag={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TYPOGRAPHY.H6}
          >
            {titleText}
          </Typography>
        )}
        {tooltipText && (
          <InfoTooltip position="top" contentText={tooltipText} />
        )}
        {valueText && (
          <Typography
            tag={TYPOGRAPHY.Paragraph}
            color={COLORS.TEXT_ALTERNATIVE}
          >
            {valueText}
          </Typography>
        )}
      </div>
      {titleDetail && (
        <div className="slider__heading-detail">
          <Typography
            tag={TYPOGRAPHY.Paragraph}
            color={COLORS.TEXT_ALTERNATIVE}
          >
            {titleDetail}
          </Typography>
        </div>
      )}
    </div>
    <MaterialSlider {...rest} />
    <div className="slider__footer">
      <div className="slider__footer-info">
        {infoText && (
          <Typography
            tag={TYPOGRAPHY.Paragraph}
            color={COLORS.TEXT_ALTERNATIVE}
          >
            {infoText}
          </Typography>
        )}
      </div>
      <div className="slider__footer-edit">
        {onEdit && (
          <button onClick={onEdit} aria-label="edit as numeric input">
            {editText}
          </button>
        )}
      </div>
    </div>
  </div>
);

Slider.defaultProps = {
  editText: 'Edit',
};

Slider.propTypes = {
  /**
   * Show edit text
   */
  editText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show info text
   */
  infoText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show title detail text
   */
  titleDetail: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show title text
   */
  titleText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show tooltip Text
   */
  tooltipText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show value text
   */
  valueText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Set maximum step
   */
  max: PropTypes.number,
  /**
   * Set minimum step
   */
  min: PropTypes.number,
  /**
   * Handler for onChange
   */
  onChange: PropTypes.func,
  /**
   * Handler for onEdit
   */
  onEdit: PropTypes.func,
  /**
   * Total steps
   */
  step: PropTypes.number,
  /**
   * Show value on slider
   */
  value: PropTypes.number,
};

export default withStyles(styles)(Slider);
