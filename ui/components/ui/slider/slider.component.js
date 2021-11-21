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
    background: '#D6D9DC',
    height: 6,
  },
  track: {
    borderRadius: 50,
    background: '#037DD6',
    height: 6,
  },
  thumb: {
    'height': 20,
    'width': 20,
    'marginTop': -7,
    'marginLeft': -7,
    'backgroundColor': '#037DD6',
    'border': '1px solid #EAF6FF',
    'boxSizing': 'border-box',
    'boxShadow': '0px 0px 14px 0px rgba(0, 0, 0, 0.18)',
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
          <Typography tag={TYPOGRAPHY.Paragraph} color={COLORS.UI4}>
            {valueText}
          </Typography>
        )}
      </div>
      {titleDetail && (
        <div className="slider__heading-detail">
          <Typography tag={TYPOGRAPHY.Paragraph} color={COLORS.UI4}>
            {titleDetail}
          </Typography>
        </div>
      )}
    </div>
    <MaterialSlider {...rest} />
    <div className="slider__footer">
      <div className="slider__footer-info">
        {infoText && (
          <Typography tag={TYPOGRAPHY.Paragraph} color={COLORS.UI4}>
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
  editText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  infoText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleDetail: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  valueText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  onEdit: PropTypes.func,
  step: PropTypes.number,
  value: PropTypes.number,
};

export default withStyles(styles)(Slider);
