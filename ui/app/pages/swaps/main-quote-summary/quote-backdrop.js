import React from 'react';
import PropTypes from 'prop-types';

export default function QuotesBackdrop({ withTopTab }) {
  return (
    <svg
      width="311"
      height="164"
      viewBox="25.5 29.335899353027344 311 164"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d)">
        <path
          d="M25.4749 54C25.4749 49.5817 29.0566 46 33.4749 46H328.475C332.893 46 336.475 49.5817 336.475 54V185.5C336.475 189.918 332.893 193.5 328.475 193.5H33.4749C29.0566 193.5 25.4749 189.918 25.4749 185.5V54Z"
          fill="url(#paint0_linear)"
        />
        {withTopTab && (
          <path
            d="M132.68 34.3305C133.903 31.3114 136.836 29.3359 140.094 29.3359H219.858C223.116 29.3359 226.048 31.3114 227.272 34.3305L237.443 59.4217C239.575 64.6815 235.705 70.4271 230.029 70.4271H129.922C124.247 70.4271 120.376 64.6814 122.508 59.4217L132.68 34.3305Z"
            fill="url(#paint1_linear)"
          />
        )}
      </g>
      <defs>
        <filter
          id="filter0_d"
          x="-13.5251"
          y="0.335938"
          width="389"
          height="242.164"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="19.5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0117647 0 0 0 0 0.491686 0 0 0 0 0.839216 0 0 0 0.15 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear"
          x1="25.4749"
          y1="90.693"
          x2="342.234"
          y2="90.693"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#037DD6" />
          <stop offset="0.994792" stopColor="#1098FC" />
        </linearGradient>
        <linearGradient
          id="paint1_linear"
          x1="25.4749"
          y1="90.693"
          x2="342.234"
          y2="90.693"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#037DD6" />
          <stop offset="0.994792" stopColor="#1098FC" />
        </linearGradient>
      </defs>
    </svg>
  );
}

QuotesBackdrop.propTypes = {
  withTopTab: PropTypes.bool,
};
