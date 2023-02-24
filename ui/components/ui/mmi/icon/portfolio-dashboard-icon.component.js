import React from 'react';
import PropTypes from 'prop-types';

export default function PortfolioDashboardIcon({
  width = '17',
  height = '17',
  fill = 'white',
  className,
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill={fill}
      className={className}
    >
      <path
        d="M0.75 17.25V15.5083L2.125 14.1333V17.25H0.75ZM4.53125 17.25V11.8417L5.90625 10.4667V17.25H4.53125ZM8.3125 17.25V10.4667L9.6875 11.8646V17.25H8.3125ZM12.0938 17.25V11.8646L13.4688 10.4896V17.25H12.0938ZM15.875 17.25V8.175L17.25 6.8V17.25H15.875ZM0.75 11.8417V9.89375L7.16667 3.52292L10.8333 7.18958L17.25 0.75V2.69792L10.8333 9.1375L7.16667 5.47083L0.75 11.8417Z"
        fill={fill}
      />
    </svg>
  );
}

PortfolioDashboardIcon.propTypes = {
  /**
   * Width of the icon
   */
  width: PropTypes.string,
  /**
   * Height of the icon
   */
  height: PropTypes.string,
  /**
   * Fill  of the icon should be a valid design system color
   */
  fill: PropTypes.string,
  /**
   * Classname being passed to the svg
   */
  className: PropTypes.string,
};
