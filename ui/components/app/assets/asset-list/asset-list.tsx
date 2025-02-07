import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import DetectedToken from '../../detected-token/detected-token';
import useAssetListTokenDetection from '../hooks/useAssetListTokenDetection';
import usePrimaryCurrencyProperties from '../hooks/usePrimaryCurrencyProperties';
import AssetListControlBar from './asset-list-control-bar';
import NativeToken from './native-token';
import AssetListFundingModals from './asset-list-funding-modals';

export type TokenWithBalance = {
  address: string;
  symbol: string;
  string?: string;
  image: string;
  secondary?: string;
  tokenFiatAmount?: string;
  isNative?: boolean;
};

export type AssetListProps = {
  onClickAsset: (chainId: string, address: string) => void;
  showTokensLinks?: boolean;
};

const AssetList = ({ onClickAsset, showTokensLinks }: AssetListProps) => {
  const { showDetectedTokens, setShowDetectedTokens } =
    useAssetListTokenDetection();
  const trackEvent = useContext(MetaMetricsContext);

  const { primaryCurrencyProperties } = usePrimaryCurrencyProperties();

  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      <TokenList
        // nativeToken is still needed to avoid breaking flask build's support for bitcoin
        // TODO: refactor this to no longer be needed for non-evm chains
        nativeToken={!isEvm && <NativeToken onClickAsset={onClickAsset} />}
        onTokenClick={(chainId: string, tokenAddress: string) => {
          onClickAsset(chainId, tokenAddress);
          trackEvent({
            event: MetaMetricsEventName.TokenScreenOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              token_symbol: primaryCurrencyProperties.suffix,
              location: 'Home',
            },
          });
        }}
      />
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
      <AssetListFundingModals />
    </>
  );
};

export default AssetList;
