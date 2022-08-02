import React from 'react';
import PropTypes from 'prop-types';

const IconChart = ({
  size = 12,
  color = 'var(--color-primary-default)',
  className,
  ariaLabel,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    className={className}
    aria-label={ariaLabel}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.5 9.375C1.5 9.58125 1.66781 9.75 1.875 9.75H11.25C11.6648 9.75 12 10.0852 12 10.5C12 10.9148 11.6648 11.25 11.25 11.25H1.875C0.839531 11.25 0 10.4109 0 9.375V1.5C0 1.08586 0.335859 0.75 0.75 0.75C1.16414 0.75 1.5 1.08586 1.5 1.5V9.375ZM8.02969 6.52969C7.73672 6.82266 7.26328 6.82266 6.97031 6.52969L5.625 5.18672L3.52969 7.27969C3.23672 7.57266 2.76328 7.57266 2.47031 7.27969C2.17688 6.98672 2.17688 6.51328 2.47031 6.22031L5.09531 3.59531C5.38828 3.30234 5.86172 3.30234 6.15469 3.59531L7.5 4.93828L9.97031 2.47031C10.2633 2.17687 10.7367 2.17687 11.0297 2.47031C11.3227 2.76328 11.3227 3.23672 11.0297 3.52969L8.02969 6.52969Z"
      fill={color}
    />
  </svg>
);

IconChart.propTypes = {
  /**
   * The size of the Icon follows an 8px grid 2 = 16px, 3 = 24px etc
   */
  size: PropTypes.number,
  /**
   * The color of the icon accepts design token css variables
   */
  color: PropTypes.string,
  /**
   * An additional className to assign the Icon
   */
  className: PropTypes.string,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconChart;
