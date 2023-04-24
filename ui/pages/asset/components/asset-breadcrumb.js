import React from 'react';
import PropTypes from 'prop-types';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';

const AssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  return (
    <button className="asset-breadcrumb" onClick={onBack}>
      <Icon
        name={IconName.ArrowLeft}
        data-testid="asset__back"
        marginInlineEnd={3}
        size={IconSize.Xs}
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
