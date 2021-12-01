import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class CircleIcon extends PureComponent {
  static propTypes = {
    /**
     * add size (px) for the image container
     */
    size: PropTypes.string,
    /**
     * add css classname for the component based on the parent css
     */
    circleClass: PropTypes.string,
    /**
     * image source path
     */
    iconSource: PropTypes.string.isRequired,
    /**
     * add size (px) for the image
     */
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
