import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarNetworkSize,
  Icon,
  IconName,
  IconSize,
  AvatarToken,
  Text,
  Box,
} from '../../../component-library';

// A component that lets the user pick from a list of assets.
// Work in progress.
export default function AssetPicker({ asset /** onAssetPicked */ }) {
  return (
    <Box className="asset-picker">
      <AvatarToken src={asset.image} size={AvatarNetworkSize.Xs} />
      <Text className="asset-picker__symbol">{asset.symbol}</Text>
      <Icon name={IconName.ArrowDown} size={IconSize.Xs} />
    </Box>
  );
}

AssetPicker.propTypes = {
  asset: PropTypes.object,
};
