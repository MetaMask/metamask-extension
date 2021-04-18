import React from 'react';
import PropTypes from 'prop-types';

export default function Sign({ className, size, color }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 33C25.8366 33 33 25.8366 33 17C33 8.16344 25.8366 1 17 1C8.16344 1 1 8.16344 1 17C1 25.8366 8.16344 33 17 33Z"
        stroke={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.2073 9.65858C21.2854 9.58047 21.4121 9.58047 21.4902 9.65858L23.8722 12.0406C23.9503 12.1187 23.9503 12.2453 23.8722 12.3234L22.3941 13.8015L19.7293 11.1367L21.2073 9.65858ZM18.5979 12.268L10.7361 20.1299C10.7086 20.1573 10.6898 20.1921 10.6818 20.2301L10.0466 23.2473C10.0168 23.3886 10.1421 23.5139 10.2835 23.4842L13.3007 22.849C13.3386 22.841 13.3734 22.8221 13.4009 22.7947L21.2627 14.9328L18.5979 12.268ZM22.6215 8.52721C21.9186 7.82426 20.7789 7.82427 20.076 8.52721L9.60469 18.9985C9.35778 19.2454 9.18802 19.5588 9.11609 19.9005L8.48089 22.9176C8.21306 24.1898 9.34091 25.3177 10.6131 25.0498L13.6303 24.4146C13.972 24.3427 14.2853 24.173 14.5323 23.9261L25.0035 13.4548C25.7065 12.7518 25.7065 11.6121 25.0035 10.9092L22.6215 8.52721Z"
        fill={color}
      />
    </svg>
  );
}

Sign.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};
