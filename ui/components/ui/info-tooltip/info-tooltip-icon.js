import React from 'react';
import PropTypes from 'prop-types';

export default function InfoTooltipIcon({
  fillColor = 'var(--color-icon-default)',
}) {
  return (
    <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 0C2.2 0 0 2.2 0 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.2-.7-.6.3-.8.7-.8zm.7 6H4.3V4.3h1.5V8z"
        fill={fillColor}
      />
    </svg>
  );
}

InfoTooltipIcon.propTypes = {
  fillColor: PropTypes.string,
};
