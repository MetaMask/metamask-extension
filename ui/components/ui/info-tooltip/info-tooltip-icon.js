import React from 'react';
import PropTypes from 'prop-types';

export default function InfoTooltipIcon({
  fillColor = 'var(--color-icon-default)',
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke={fillColor}
        strokeWidth="1.5"
      />
      <path
        d="M8 7.25V11"
        stroke={fillColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5" r="0.75" fill={fillColor} />
    </svg>
  );
}

InfoTooltipIcon.propTypes = {
  fillColor: PropTypes.string,
};
