import React from 'react';
import PropTypes from 'prop-types';

const LogoTrezor = ({
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
      viewBox="0 0 1482 378"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m915.31 115.89h154.82v40.74l-84.2 114.08h84.2v47.98h-154.82v-40.74l84.2-114.08h-84.2z" />
      <path d="m1437.7101 243.55c19-7.25 38.9301-26.26 38.9301-59.76 0-40.74-28.0601-67-69.71-67h-95.0601v201.9h52.51v-67.9h19.9199l37.12 67.9h60.66l-44.37-75.14zm-37.12-39.84h-36.21v-40.74h36.21c13.58 0 22.64 8.15 22.64 19.92 0 12.67-9.0601 20.82-22.64 20.82z" />
      <path d="m1184.2101 113.17c-61.5699 0-105 44.36-105 104.12s44.34 104.12 105 104.12 105.9301-44.37 105.9301-104.12-44.3701-104.12-105.9301-104.12zm0 161.16c-30.78 0-51.61-23.54-51.61-57 0-34.4 20.83-57 51.61-57s52.51 23.54 52.51 57-21.7301 56.9999-52.51 56.9999z" />
      <path d="m743.29 115.89h146.6701v47.08h-94.1601v29.87h91.44v46.18h-91.44v32.59h94.1601v47.08h-146.6701z" />
      <path d="m222.7 87.82c0-48-41.65-87.82-92.35-87.82s-92.35 39.84-92.35 87.82v28.07h-38v201.9l130.35 60.62 130.38-60.66v-201h-38zm-137.62 0c0-22.63 19.92-40.74 45.27-40.74s45.27 18.11 45.27 40.74v28.07h-90.54zm123.13 197.37-77.86 36.22-77.86-36.22v-121.32h155.72z" />
      <path d="m718.85 183.79c0-40.74-28.07-67-69.72-67h-95.0599v201.9h52.51v-67.9h19.92l37.12 67.9h60.68l-44.37-75.14c19-7.25 38.92-26.26 38.92-59.76zm-76.06 19.92h-36.21v-40.74h36.21c13.58 0 22.64 8.15 22.64 19.92 0 12.67-9.0601 20.82-22.6401 20.82z" />
      <path d="m366.66 115.89h163.87v47.98h-56.13v154.82h-52.52v-154.82h-55.22z" />
    </svg>
  );
};

LogoTrezor.propTypes = {
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

export default LogoTrezor;
