import React from 'react';
import PropTypes from 'prop-types';

const LogoDcent = ({
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
      viewBox="0 0 88 25"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M37.1,12.4c0-1.4-0.5-2.7-1.6-3.5c-1.2-0.9-2.6-1.4-4.1-1.4h-5.5V10h5.5c0.8,0,1.5,0.2,2.1,0.7 c0.5,0.5,0.9,1.1,0.8,1.9c0,0.7-0.3,1.4-0.8,1.8c-0.6,0.5-1.3,0.7-2.1,0.7h-2.7v-3.7h-2.8v6.2h5.5c1.5,0.1,3-0.5,4.1-1.5 C36.5,15.1,37.1,13.8,37.1,12.4z" />
      <path d="M40.5,12.4c0,1.4,0.6,2.7,1.6,3.6c1.1,1,2.6,1.5,4.1,1.5H51v-2.4h-4.8c-0.8,0-1.5-0.2-2.1-0.7 c-0.5-0.4-0.8-1.1-0.8-1.8c0-0.7,0.3-1.4,0.8-1.9c0.6-0.5,1.3-0.7,2.1-0.7H51V7.5h-4.8c-1.5-0.1-2.9,0.4-4.1,1.4 C41,9.7,40.5,11,40.5,12.4z" />
      <path d="M75.9,7.5h-2.8v5.9L67,7.9c-0.3-0.3-0.7-0.4-1.1-0.4c-0.3,0-0.7,0.1-0.9,0.3c-0.2,0.2-0.3,0.5-0.3,0.9v8.8 h2.8v-5.9l6.1,5.5c0.3,0.3,0.8,0.5,1.2,0.5c0.7,0,1.1-0.4,1.1-1.3L75.9,7.5L75.9,7.5z" />
      <path d="M88,7.5H77V10h4.1v7.5h2.8V10H88L88,7.5z" />
      <path d="M60.4,10l2.3-2.5h-10v10h9.5V15h-6.7v-1.4h6.7v-2.3h-6.7V10L60.4,10z" />
      <path d="M39.9,9.7h-1.3l-1-2.6h3.3L39.9,9.7z" />
      <path d="M11.3,4.7l1.9-1.1V1.1L11.3,0V4.7z" />
      <path d="M4.4,15.9V8.7l6.2-3.6V0L0.3,6C0.1,6.1,0,6.3,0,6.5v11.9L4.4,15.9z" />
      <path d="M17.2,16.4L10.9,20l-6.2-3.6L0.3,19l10.3,5.9c0.2,0.1,0.4,0.1,0.6,0l10.3-6h0L17.2,16.4z" />
      <path d="M21.6,6l-4.1-2.4v2.6l-4.4,2.5l4.4,2.5v4.6l4.4,2.5V6.5C21.9,6.3,21.8,6.1,21.6,6z" />
      <path d="M8.8,11.2v5l4.3-2.5v-5L8.8,11.2z" />
    </svg>
  );
};

LogoDcent.propTypes = {
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

export default LogoDcent;
