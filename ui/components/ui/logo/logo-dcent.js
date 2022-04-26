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
      <g>
        <path d="M87.193 26.231a4.465 4.465 0 0 0-1.593-3.547 6.127 6.127 0 0 0-4.1-1.364h-5.51v2.461h5.515a3.062 3.062 0 0 1 2.077.721 2.358 2.358 0 0 1 .837 1.856 2.292 2.292 0 0 1-.83 1.828 3.134 3.134 0 0 1-2.081.689h-2.708v-3.723h-2.806v6.176h5.515a5.891 5.891 0 0 0 4.081-1.455 4.73 4.73 0 0 0 1.603-3.642z" class="prefix__cls-1" transform="translate(25.89 7.494) translate(-75.99 -21.32)"/>
        <path d="M117.53 26.237a4.712 4.712 0 0 0 1.61 3.638 5.891 5.891 0 0 0 4.081 1.455h4.84v-2.446h-4.84a3.1 3.1 0 0 1-2.07-.7 2.293 2.293 0 0 1-.83-1.821 2.363 2.363 0 0 1 .83-1.856 3.034 3.034 0 0 1 2.074-.721h4.84v-2.456h-4.84a6.143 6.143 0 0 0-4.106 1.364 4.453 4.453 0 0 0-1.589 3.543z" class="prefix__cls-1" transform="translate(25.89 7.494) translate(-102.928 -21.326)"/>
        <path d="M197.61 21.33h-2.81v5.884l-6.071-5.459a1.445 1.445 0 0 0-1.118-.411 1.171 1.171 0 0 0-.9.341 1.22 1.22 0 0 0-.313.868v8.781h2.805v-5.87l6.071 5.459a1.633 1.633 0 0 0 1.241.485c.738 0 1.1-.425 1.1-1.294v-8.784z" class="prefix__cls-1" transform="translate(25.89 7.494) translate(-147.589 -21.326)"/>
        <path d="M88.002 7.498h-11.05v2.461h4.123v7.544h2.805v-7.544h4.12z" class="prefix__cls-1"/>
      </g>
      <path d="M60.367 9.959l2.311-2.461h-10.02v10h9.533v-2.45h-6.728v-1.388h6.728v-2.348h-6.728v-1.353z" class="prefix__cls-1"/>
      <path d="M39.852 9.701h-1.3l-.981-2.643h3.259z" class="prefix__cls-1"/>
      <g>
        <path d="M11.263 4.721l1.86-1.076v-2.569l-1.86-1.076z" class="prefix__cls-1"/>
        <path d="M4.4 15.906v-7.227l6.23-3.593v-5.086l-10.314 5.955a.632.632 0 0 0-.316.545v11.948z" class="prefix__cls-1"/>
        <path d="M17.817 46.69l-6.229 3.6-6.193-3.579-4.405 2.545 10.282 5.937a.635.635 0 0 0 .633 0l10.314-5.955h.007z" class="prefix__cls-1" transform="translate(-.642 -30.278)"/>
        <path d="M45.732 12.589l-4.088-2.359v2.57l-4.394 2.534 4.394 2.534v4.626l4.4 2.541v-11.9a.647.647 0 0 0-.312-.546z" class="prefix__cls-1" transform="translate(13.094 3.596) translate(-37.25 -10.23)"/>
        <path d="M8.763 11.198v5.037l4.274-2.468v-5.039z" class="prefix__cls-1"/>
      </g>
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
