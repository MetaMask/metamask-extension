import React from 'react';
import PropTypes from 'prop-types';

const IconBlockExplorer = ({
  size = 24,
  color = 'currentColor',
  ariaLabel,
  className,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    fill={color}
    className={className}
    aria-label={ariaLabel}
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
  >
    <path d="m328 482l-128 0c-115 0-168-52-168-169l0-128c0-115 53-168 168-168l43 0c5 0 10 2 14 6 3 3 5 8 5 13 0 5-2 10-5 14-4 3-9 5-14 5l-43 0c-96 0-130 34-130 130l0 128c0 96 34 131 130 131l128 0c96 0 130-35 130-131l0-42c0-5 3-10 6-14 4-3 9-5 14-5 5 0 10 2 13 5 4 4 6 9 6 14l0 42c0 117-52 169-169 169z m-42-235c-5 0-10-2-14-5-3-4-5-9-5-14 0-5 2-10 5-13l159-160-56 0c-5 0-10-2-13-5-4-4-6-9-6-14 0-5 2-10 6-13 3-4 8-6 13-6l103 0c2 0 5 0 7 1 2 1 5 3 6 5 2 1 4 3 5 6 0 2 1 5 1 7l0 103c0 5-2 10-6 13-3 4-8 6-13 6-5 0-10-2-14-6-3-3-6-8-6-13l0-56-159 159c-3 3-8 5-13 5z" />
  </svg>
);

IconBlockExplorer.propTypes = {
  /**
   * The size of the icon in pixels. Should follow 8px grid 16, 24, 32, etc
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
   * The onClick handler
   */
  onClick: PropTypes.func,
  /**
   * The aria-label of the icon for accessibility purposes
   */
  ariaLabel: PropTypes.string,
};

export default IconBlockExplorer;
