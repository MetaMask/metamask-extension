import React from 'react';
import PropTypes from 'prop-types';
import { Icon, ICON_NAMES } from '../../../components/component-library';

const AssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  return (
    <button className="asset-breadcrumb" onClick={onBack}>
      <Icon
        name={ICON_NAMES.ARROW_LEFT}
        data-testid="asset__back"
        padding="0 10 0 2"
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
