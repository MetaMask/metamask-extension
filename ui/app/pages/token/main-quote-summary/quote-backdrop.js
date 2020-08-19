import React from 'react'
import PropTypes from 'prop-types'

export default function QuotesBackdrop ({
  withTopTab,
}) {
  return (
    <svg width="311" height="196" viewBox="25.5 29.335899353027344 311 196" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d)">
        <path d="M25.5 54.532C25.5 50.1137 29.0817 46.532 33.5 46.532H328.5C332.918 46.532 336.5 50.1137 336.5 54.532V218.032C336.5 222.45 332.918 226.032 328.5 226.032H33.5C29.0817 226.032 25.5 222.45 25.5 218.032V54.532Z" fill="url(#paint0_linear)" />
        {withTopTab && <path d="M132.705 34.8625C133.929 31.8434 136.861 29.8679 140.119 29.8679H219.883C223.141 29.8679 226.073 31.8434 227.297 34.8625L237.468 59.9536C239.601 65.2134 235.73 70.9591 230.054 70.9591H129.948C124.272 70.9591 120.401 65.2134 122.534 59.9536L132.705 34.8625Z" fill="url(#paint1_linear)" />}
      </g>
      <defs>
        <filter id="filter0_d" x="-13.5" y="0.86792" width="389" height="274.164" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="19.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0117647 0 0 0 0 0.491686 0 0 0 0 0.839216 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <linearGradient id="paint0_linear" x1="25.5" y1="91.2249" x2="342.259" y2="91.2249" gradientUnits="userSpaceOnUse">
          <stop stopColor="#037DD6" />
          <stop offset="0.994792" stopColor="#1098FC" />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="25.5" y1="91.2249" x2="342.259" y2="91.2249" gradientUnits="userSpaceOnUse">
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
