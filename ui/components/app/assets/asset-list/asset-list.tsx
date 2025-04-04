import React from 'react';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { getMultichainIsEvm } from '../../../../selectors/multichain';

import DetectedToken from '../../detected-token/detected-token';
import { useAssetListTokenDetection } from '../hooks';

import AssetListControlBar from './asset-list-control-bar';
import AssetListFundingModals from './asset-list-funding-modals';

type AssetListProps = {
  showTokensLinks?: boolean;
};

const AssetList = ({ showTokensLinks }: AssetListProps) => {
  const { showDetectedTokens, setShowDetectedTokens } =
    useAssetListTokenDetection();
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      <TokenList />
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
      <AssetListFundingModals />
    </>
  );
};

export default React.memo(AssetList);
