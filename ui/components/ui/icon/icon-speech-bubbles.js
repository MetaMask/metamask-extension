import React from 'react';
import PropTypes from 'prop-types';

const IconSpeechBubbles = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path d="m357 221c0-63-66-114-146-114-81 0-146 51-146 114 0 25 10 47 27 66-10 22-25 39-25 39-2 1-3 4-2 6 2 3 3 3 6 3 25 0 46-8 61-18 23 12 50 18 79 18 80 0 146-50 146-114z m86 157c16-18 26-41 26-66 0-47-38-88-91-105 1 5 2 10 2 14 0 76-76 137-169 137-8 0-15 0-22-1 21 41 73 70 134 70 29 0 56-7 78-18 16 9 37 18 63 18 2 0 4-1 5-3 0-2 0-5-2-7 0 0-15-17-24-39z" />
  </svg>
);

IconSpeechBubbles.propTypes = {
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

export default IconSpeechBubbles;
