import React from 'react';
import PropTypes from 'prop-types';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../../components/component-library/icon/deprecated';

const AssetBreadcrumb = ({ accountName, assetName, onBack }) => {
  return (
    <button className="asset-breadcrumb" onClick={onBack}>
      <Icon
        name={ICON_NAMES.ARROW_LEFT}
        data-testid="asset__back"
        marginInlineEnd={3}
        size={ICON_SIZES.XS}
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
