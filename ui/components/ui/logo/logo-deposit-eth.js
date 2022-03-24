import React from 'react';
import PropTypes from 'prop-types';

const LogoDepositEth = ({
  width = '100%',
  color = 'var(--color-text-default)',
  className,
  ariaLabel,
}) => {
  return (
    <svg
      width={width}
      fill={color}
      className={className}
      aria-label={ariaLabel}
      viewBox="0 0 80 78"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.82 37.7L34.405 44.9489L22 37.7L34.407 55L46.82 37.7ZM34.405 44.9489L34.407 44.95H34.403L34.405 44.9489Z"
      />
      <path d="M22.187 35.37L34.593 15L47 35.378L34.593 42.628L22.187 35.37Z" />
      <path d="M71.5 59.423H65.077V53H60.923V59.423H54.5V63.577H60.923V70H65.077V63.577H71.5V59.423Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34 68C38.4608 68 42.7208 67.141 46.6239 65.5793C48.6231 72.7439 55.1978 78 63 78C72.3889 78 80 70.3889 80 61C80 52.7752 74.1592 45.9147 66.3992 44.3399C67.4389 41.0794 68 37.6052 68 34C68 15.2223 52.7777 0 34 0C15.2223 0 0 15.2223 0 34C0 52.7777 15.2223 68 34 68ZM34 3C16.8792 3 3 16.8792 3 34C3 51.1208 16.8792 65 34 65C38.2818 65 42.3609 64.1319 46.0708 62.5621C46.0239 62.0477 46 61.5266 46 61C46 51.6111 53.6111 44 63 44C63.1171 44 63.2339 44.0012 63.3505 44.0035C64.4199 40.8651 65 37.5003 65 34C65 16.8792 51.1208 3 34 3ZM63 47C55.268 47 49 53.268 49 61C49 68.732 55.268 75 63 75C70.732 75 77 68.732 77 61C77 53.268 70.732 47 63 47Z"
      />
    </svg>
  );
};

LogoDepositEth.propTypes = {
  /**
   * The width of the logo. Defaults to 100%
   */
  width: PropTypes.string,
  /**
   * The color of the logo defaults to var(--color-text-default)
   */
  color: PropTypes.string,
  /**
   * Additional className to add to the root svg
   */
  className: PropTypes.string,
  /**
   * Aria label to add to the logo component
   */
  ariaLabel: PropTypes.string,
};

export default LogoDepositEth;
