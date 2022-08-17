import React from 'react';
import PropTypes from 'prop-types';

const CopyContractDetails = ({ className }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.3334 9.75008V13.2501C12.3334 16.1667 11.1667 17.3334 8.25002 17.3334H4.75002C1.83335 17.3334 0.666687 16.1667 0.666687 13.2501V9.75008C0.666687 6.83341 1.83335 5.66675 4.75002 5.66675H8.25002C11.1667 5.66675 12.3334 6.83341 12.3334 9.75008Z"
      fill="#BBC0C5"
    />
    <path
      d="M13.25 0.666748H9.75002C7.18079 0.666748 5.97583 1.57849 5.72481 3.78259C5.67229 4.2437 6.05418 4.62508 6.51827 4.62508H8.25002C11.75 4.62508 13.375 6.25008 13.375 9.75008V11.4818C13.375 11.9459 13.7564 12.3278 14.2175 12.2753C16.4216 12.0243 17.3334 10.8193 17.3334 8.25008V4.75008C17.3334 1.83341 16.1667 0.666748 13.25 0.666748Z"
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
};

export default CopyContractDetails;
