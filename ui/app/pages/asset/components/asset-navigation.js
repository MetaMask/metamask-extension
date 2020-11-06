import React from 'react'
import PropTypes from 'prop-types'

import AssetBreadcrumb from './asset-breadcrumb'

const AssetNavigation = ({ accountName, assetName, onBack, optionsButton }) => {
  return (
    <div className="asset-navigation">
      <AssetBreadcrumb
        accountName={accountName}
        assetName={assetName}
        onBack={onBack}
      />
      {optionsButton}
    </div>
  )
}

AssetNavigation.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  optionsButton: PropTypes.element,
}

AssetNavigation.defaultProps = {
  optionsButton: undefined,
}

export default AssetNavigation
