import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class CircleIcon extends PureComponent {
  static propTypes = {
    size: PropTypes.string,
    circleClass: PropTypes.string,
    iconSource: PropTypes.string.isRequired,
    iconSize: PropTypes.string,
  };

  static defaultProps = {
    size: '56px',
    iconSize: '18px',
    circleClass: '',
  };

  render() {
    const { size, circleClass, iconSize, iconSource } = this.props;

    return (
      <div
        className="circle-icon__container"
        style={{
          height: size,
          width: size,
        }}
      >
        <div
          className={`circle-icon__border circle-icon__circle ${circleClass}`}
          style={{
            height: size,
            width: size,
          }}
        />
        <img
          src={iconSource}
          className="circle-icon__icon"
          style={{
            height: iconSize,
            width: iconSize,
          }}
          alt=""
        />
      </div>
    );
  }
}
