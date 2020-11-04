import React from 'react'
import PropTypes from 'prop-types'
import SiteIcon from '../site-icon'

const OriginRow = (props) => {
  const { origin, domainMetadata } = props
  const txOriginMetadata = domainMetadata[origin]
  return (
    <div className="origin-row">
      <div className="origin-row__text">Origin:</div>
      {txOriginMetadata ? (
        <div className="origin-row-item">
          <SiteIcon
            icon={txOriginMetadata.icon}
            name={txOriginMetadata.name}
            size={24}
          />
          <div className="origin-row-item__text">{origin}</div>
        </div>
      ) : (
        <div className="origin-row-item__text">{origin}</div>
      )}
    </div>
  )
}

OriginRow.propTypes = {
  origin: PropTypes.string,
  domainMetadata: PropTypes.object,
}

export default OriginRow
