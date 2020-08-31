import React from 'react'
import PropTypes from 'prop-types'

export default function QuotesBackdrop ({
  withTopTab,
}) {
  return (
    <svg width="311" height="199" viewBox="25.5 29.335899353027344 311 199"fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d)">
        <path d="M25.5 57.5046C25.5 53.0864 29.0817 49.5046 33.5 49.5046H328.5C332.918 49.5046 336.5 53.0864 336.5 57.5046V221.005C336.5 225.423 332.918 229.005 328.5 229.005H33.5C29.0817 229.005 25.5 225.423 25.5 221.005V57.5046Z" fill="url(#paint0_linear)" />
        {withTopTab && <path d="M121.705 34.8352C122.929 31.816 125.861 29.8406 129.119 29.8406H230.883C234.141 29.8406 237.073 31.816 238.297 34.8352L251.468 62.9263C253.601 68.1861 249.73 73.9317 244.054 73.9317H115.948C110.272 73.9317 106.401 68.1861 108.534 62.9263L121.705 34.8352Z" fill="url(#paint1_linear)" />}
      </g>
      <defs>
        <filter id="filter0_d" x="-13.5" y="0.840576" width="389" height="277.164" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="19.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0117647 0 0 0 0 0.491686 0 0 0 0 0.839216 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <linearGradient id="paint0_linear" x1="25.5" y1="94.1976" x2="342.259" y2="94.1976" gradientUnits="userSpaceOnUse">
          <stop stopColor="#037DD6" />
          <stop offset="0.994792" stopColor="#1098FC" />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="25.5" y1="94.1976" x2="342.259" y2="94.1976" gradientUnits="userSpaceOnUse">
          <stop stopColor="#037DD6" />
          <stop offset="0.994792" stopColor="#1098FC" />
        </linearGradient>
      </defs>
    </svg>

  )
}

QuotesBackdrop.propTypes = {
  withTopTab: PropTypes.bool,
}
