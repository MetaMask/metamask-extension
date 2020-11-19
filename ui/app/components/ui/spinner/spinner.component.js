import React from 'react'
import PropTypes from 'prop-types'

const Spinner = ({ className = '', color = '#000000' }) => {
  return (
    <div className={`spinner ${className}`}>
      <svg
        className="lds-spinner"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
        style={{ background: 'none' }}
      >
        <g transform="rotate(0 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.9166666666666666s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(30 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.8333333333333334s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(60 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.75s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(90 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.6666666666666666s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(120 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.5833333333333334s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(150 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.5s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(180 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.4166666666666667s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(210 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.3333333333333333s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(240 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.25s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(270 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.16666666666666666s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(300 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="-0.08333333333333333s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
        <g transform="rotate(330 50 50)">
          <rect x={45} y={0} rx={0} ry={0} width={10} height={30} fill={color}>
            <animate
              attributeName="opacity"
              values="1;0"
              dur="1s"
              begin="0s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      </svg>
    </div>
  )
}

Spinner.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
}

export default Spinner
