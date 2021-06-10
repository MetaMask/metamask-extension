import React from 'react';
import PropTypes from 'prop-types';

const AssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  return (
    <button className="asset-breadcrumb" onClick={onBack}>
      <i
        className="fas fa-chevron-left asset-breadcrumb__chevron"
        data-testid="asset__back"
      />
      <span>{accountName}</span>
      &nbsp;/&nbsp;
      <span className="asset-breadcrumb__asset">{assetName}</span>
    </button>
  );
};

AssetBreadcrumb.propTypes = {
  accountName: PropTypes.string.isRequired,
  assetName: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default AssetBreadcrumb;
