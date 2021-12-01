import React from 'react';

import I18nValue from '../../../../ui/i18n-value';
import { NetworkStabilityTooltip } from '../tooltips';

const GRADIENT_COLORS = [
  '#037DD6',
  '#1876C8',
  '#2D70BA',
  '#4369AB',
  '#57629E',
  '#6A5D92',
  '#805683',
  '#9A4D71',
  '#B44561',
  '#C54055',
];

const StatusInfo = {
  low: {
    statusLabel: 'notBusy',
    tooltipLabel: 'stable',
    color: GRADIENT_COLORS[0],
  },
  stable: {
    statusLabel: 'stable',
    tooltipLabel: 'stable',
    color: GRADIENT_COLORS[4],
  },
  high: {
    statusLabel: 'busy',
    tooltipLabel: 'stable',
    color: GRADIENT_COLORS[9],
  },
};

const getStatusInfo = (status) => {
  if (status <= 0.33) {
    return StatusInfo.low;
  } else if (status > 0.66) {
    return StatusInfo.high;
  }
  return StatusInfo.stable;
};

const StatusSlider = () => {
  const statusValue = 0.5;
  const sliderValueNumeric = Math.round(statusValue * 10);

  const statusInfo = getStatusInfo(statusValue);

  return (
    <NetworkStabilityTooltip statusInfo={statusInfo}>
      <div className="status-slider">
        <div className="status-slider__arrow-border">
          <div
            className="status-slider__arrow"
            style={{
              borderTopColor: GRADIENT_COLORS[sliderValueNumeric],
              marginLeft: `${sliderValueNumeric * 10}%`,
            }}
          />
        </div>
        <div className="status-slider__line" />
        <div
          className="status-slider__label"
          style={{ color: GRADIENT_COLORS[sliderValueNumeric] }}
        >
          <I18nValue messageKey={statusInfo?.statusLabel} />
        </div>
      </div>
    </NetworkStabilityTooltip>
  );
};

export default StatusSlider;
