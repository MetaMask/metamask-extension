import React from 'react';

import I18nValue from '../../../../ui/i18n-value';

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

const StatusSlider = () => {
  // todo: value below to be replaced with dynamic values from api once it is available
  // corresponding test cases also to be added
  const statusValue = 0.5;
  const sliderValueNumeric = Math.round(statusValue * 10);

  let statusLabel = 'stable';
  if (statusValue <= 0.33) {
    statusLabel = 'notBusy';
  } else if (statusValue > 0.66) {
    statusLabel = 'busy';
  }

  return (
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
        <I18nValue messageKey={statusLabel} />
      </div>
    </div>
  );
};

export default StatusSlider;
