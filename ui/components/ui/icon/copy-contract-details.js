import React from 'react';
import PropTypes from 'prop-types';

const CopyContractDetails = ({ className, size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.3333 9.75008V13.2501C12.3333 16.1667 11.1667 17.3334 8.24999 17.3334H4.74999C1.83332 17.3334 0.666656 16.1667 0.666656 13.2501V9.75008C0.666656 6.83341 1.83332 5.66675 4.74999 5.66675H8.24999C11.1667 5.66675 12.3333 6.83341 12.3333 9.75008Z"
      fill="#BBC0C5"
    />
    <path
      d="M13.25 0.666748H9.74999C7.18076 0.666748 5.9758 1.57849 5.72477 3.78259C5.67226 4.2437 6.05415 4.62508 6.51824 4.62508H8.24999C11.75 4.62508 13.375 6.25008 13.375 9.75008V11.4818C13.375 11.9459 13.7564 12.3278 14.2175 12.2753C16.4216 12.0243 17.3333 10.8193 17.3333 8.25008V4.75008C17.3333 1.83341 16.1667 0.666748 13.25 0.666748Z"
      fill="#BBC0C5"
    />
  </svg>
);

CopyContractDetails.defaultProps = {
  className: undefined,
};

CopyContractDetails.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
  /**
   * The size of the Icon
   */
  size: PropTypes.number.isRequired,
};

export default CopyContractDetails;
