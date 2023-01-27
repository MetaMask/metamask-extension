import React from 'react';
import PropTypes from 'prop-types';

const AssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  return (
    <button className="asset-breadcrumb" onClick={onBack}>
      <Icon name={ICON_NAMES.ARROW_LEFT} />
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
