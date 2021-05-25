import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class GasSlider extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    lowLabel: PropTypes.string,
    highLabel: PropTypes.string,
    value: PropTypes.number,
    step: PropTypes.number,
    max: PropTypes.number,
    min: PropTypes.number,
  };

  render() {
    const { onChange, lowLabel, highLabel, value, step, max, min } = this.props;

    return (
      <div className="gas-slider">
        <input
          className="gas-slider__input"
          type="range"
          step={step}
          max={max}
          min={min}
          value={value}
          id="gasSlider"
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="gas-slider__bar">
          <div className="gas-slider__colored" />
        </div>
        <div className="gas-slider__labels">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    );
  }
}
