import React from 'react'
import PropTypes from 'prop-types'

const getSVG = (type, color) => {
  const svgs = {
    send: (
      <svg width="10" height="10" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.58512 0.889214C9.55855 0.890053 9.53205 0.892378 9.50574 0.896177H5.32066C5.0635 0.89254 4.82431 1.02764 4.69467 1.24975C4.56503 1.47185 4.56503 1.74655 4.69467 1.96866C4.82431 2.19077 5.0635 2.32587 5.32066 2.32223H7.87767L0.538106 9.6614C0.351825 9.84024 0.276785 10.1058 0.341929 10.3557C0.407072 10.6056 0.602219 10.8007 0.852107 10.8658C1.10199 10.931 1.36758 10.8559 1.54643 10.6697L8.88599 3.3305V5.88737C8.88235 6.14451 9.01746 6.3837 9.23958 6.51333C9.46169 6.64296 9.73641 6.64296 9.95853 6.51333C10.1806 6.3837 10.3158 6.14451 10.3121 5.88737V1.69973C10.3409 1.49194 10.2767 1.28204 10.1366 1.12589C9.99653 0.96973 9.79481 0.88316 9.58512 0.889214Z" fill={color} />
      </svg>
    ),
    recieve: (
      <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.34647 11.3611C7.36612 11.3402 7.38458 11.3181 7.40176 11.2952L10.597 8.0999C10.7961 7.90634 10.8756 7.62056 10.805 7.352C10.7344 7.08344 10.5246 6.8737 10.2561 6.80309C9.98752 6.73248 9.70175 6.81195 9.50819 7.01106L7.55594 8.96331L7.55594 1.25598C7.56162 0.977209 7.41614 0.71715 7.17562 0.576099C6.9351 0.435049 6.63711 0.435049 6.39659 0.576099C6.15607 0.717149 6.01059 0.977209 6.01627 1.25598L6.01627 8.96331L4.06402 7.01106C3.87046 6.81195 3.58469 6.73248 3.31612 6.80309C3.04756 6.8737 2.83782 7.08344 2.76721 7.352C2.69661 7.62056 2.77608 7.90634 2.97519 8.0999L6.17257 11.2973C6.30928 11.4779 6.51856 11.5891 6.74473 11.6014C6.97089 11.6137 7.191 11.5258 7.34647 11.3611Z" fill={color} />
        <rect x="0.875" y="13.25" width="12.25" height="1.75" rx="0.875" fill={color} />
      </svg>
    ),
  }

  return svgs[type]
}

const Icon = props => {
  const {
    type,
    width,
    height,
    borderWidth,
    borderRadius,
    color,
  } = props

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `${borderWidth}px solid ${color}`,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: `${borderRadius}px`,
    }}
    >
      {getSVG(type, color)}
    </div>
  )
}

Icon.propTypes = {
  type: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
  borderWidth: PropTypes.number,
  borderRadius: PropTypes.number,
}

export default Icon
