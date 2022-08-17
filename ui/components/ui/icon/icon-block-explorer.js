import React from 'react';
import PropTypes from 'prop-types';

const IconBlockExplorer = ({ className }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.55555 6.44423L12.1111 1.88867M12.5557 4.111V1.44434H9.88899M6.44444 1.44434H5.33333C2.55555 1.44434 1.44444 2.55545 1.44444 5.33322V8.66656C1.44444 11.4443 2.55555 12.5554 5.33333 12.5554H8.66666C11.4444 12.5554 12.5556 11.4443 12.5556 8.66656V7.55545"
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
