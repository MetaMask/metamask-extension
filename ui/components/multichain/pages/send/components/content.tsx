import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from '../../../../component-library';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import { getSendAsset } from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { SendHexData } from '.';

export const SendPageContent = () => {
  const showHexDataFlag = useSelector(getSendHexDataFeatureFlagState);
  const asset = useSelector(getSendAsset);

  const showHexData =
    showHexDataFlag &&
    asset &&
    asset.type !== AssetType.token &&
    asset.type !== AssetType.NFT;

  return <Box>{showHexData ? <SendHexData /> : null}</Box>;
};
