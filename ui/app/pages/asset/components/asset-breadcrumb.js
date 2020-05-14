import React from 'react'
import PropTypes from 'prop-types'

const AssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  return (
    <div className="asset-breadcrumb">
      <button className="fas fa-chevron-left asset-breadcrumb__chevron" data-testid="asset__back" onClick={onBack} />
      <span>
        {accountName}
      </span>
      &nbsp;/&nbsp;
      <span className="asset-breadcrumb__asset">
        { assetName }
      </span>
    </div>
  )
}

AssetBreadcrumb.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default AssetBreadcrumb
