import React from 'react';
import PropTypes from 'prop-types';

const IconBlockExplorer = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.66666 7.33312L14.1333 1.86646M14.6668 4.53325V1.33325H11.4668M7.33333 1.33325H5.99999C2.66666 1.33325 1.33333 2.66659 1.33333 5.99992V9.99992C1.33333 13.3333 2.66666 14.6666 5.99999 14.6666H9.99999C13.3333 14.6666 14.6667 13.3333 14.6667 9.99992V8.66658"
      stroke="#BBC0C5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

IconBlockExplorer.defaultProps = {
  className: undefined,
};

IconBlockExplorer.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
};

export default IconBlockExplorer;
