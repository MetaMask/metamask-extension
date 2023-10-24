import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarNetworkSize,
  Icon,
  IconName,
  IconSize,
  AvatarToken,
} from '../../../component-library';

// A component that lets the user pick from a list of assets.
// Work in progress.
export default function AssetPicker({ asset /** onAssetPicked */ }) {
  return (
    <div className="asset-picker">
      <AvatarToken src={asset.image} size={AvatarNetworkSize.Xs} />
      <span className="asset-picker__symbol">{asset.symbol}</span>
      <Icon name={IconName.ArrowDown} size={IconSize.Xs} />
    </div>
  );
}

AssetPicker.propTypes = {
  asset: PropTypes.object,
};
