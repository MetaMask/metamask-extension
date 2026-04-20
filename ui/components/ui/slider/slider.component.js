import React from 'react';
import PropTypes from 'prop-types';
import { Slider as MaterialSlider } from '@mui/material';

import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

import InfoTooltip from '../info-tooltip/info-tooltip';
import { Text } from '../../component-library';

const sliderSx = {
  height: 6,
  padding: '6px 0',
  '& .MuiSlider-rail': {
    borderRadius: 50,
    background: 'var(--color-background-alternative)',
    height: 6,
  },
  '& .MuiSlider-track': {
    borderRadius: 50,
    background: 'var(--color-primary-default)',
    height: 6,
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: 'var(--color-primary-default)',
    border: '1px solid var(--color-border-muted)',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    '&:focus, &.Mui-active': {
      height: 20,
      width: 20,
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    },
    '&:hover': {
      height: 22,
      width: 22,
      border: 'none',
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
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
          <Text variant={TextVariant.bodySmBold} as="h6">
            {titleText}
          </Text>
        )}
        {tooltipText && (
          <InfoTooltip position="top" contentText={tooltipText} />
        )}
        {valueText && (
          <Text tag={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {valueText}
          </Text>
        )}
      </div>
      {titleDetail && (
        <div className="slider__heading-detail">
          <Text tag={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {titleDetail}
          </Text>
        </div>
      )}
    </div>
    <MaterialSlider sx={sliderSx} {...rest} />
    <div className="slider__footer">
      <div className="slider__footer-info">
        {infoText && (
          <Text tag={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {infoText}
          </Text>
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

export default Slider;
