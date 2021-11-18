import React from 'react';
import PropTypes from 'prop-types';

export default function NpmIcon({ className, color }) {
  return (
    <svg
      className={className}
      width="25"
      height="10"
      viewBox="0 0 25 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 5.55555H11.1111V2.77778H12.5V5.55555ZM25 0V8.33333H12.5V9.72222H6.94444V8.33333H0V0H25ZM6.94444 1.38889H1.38889V6.94444H4.16667V2.77778H5.55556V6.94444H6.94444V1.38889ZM13.8889 1.38889H8.33333V8.33333H11.1111V6.94444H13.8889V1.38889ZM23.6111 1.38889H15.2778V6.94444H18.0556V2.77778H19.4444V6.94444H20.8333V2.77778H22.2222V6.94444H23.6111V1.38889Z"
        fill={color}
      />
    </svg>
  );
}

NpmIcon.defaultProps = {
  color: '#6A737D',
};

NpmIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
};
