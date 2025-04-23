import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import DetectedToken from '../../detected-token/detected-token';
import {
  useAssetListTokenDetection,
  usePrimaryCurrencyProperties,
} from '../hooks';
import TokenList from '../token-list';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import AssetListControlBar from './asset-list-control-bar';
import AssetListFundingModals from './asset-list-funding-modals';

type AssetListProps = {
  onClickAsset: (chainId: string, address: string) => void;
  showTokensLinks?: boolean;
};

const TokenListContainer = React.memo(
  ({ onClickAsset }: Pick<AssetListProps, 'onClickAsset'>) => {
    const trackEvent = useContext(MetaMetricsContext);
    const { primaryCurrencyProperties } = usePrimaryCurrencyProperties();

    const onTokenClick = useCallback(
      (chainId: string, tokenAddress: string) => {
        trace({ name: TraceName.AssetDetails });
        onClickAsset(chainId, tokenAddress);
        trackEvent({
          event: MetaMetricsEventName.TokenScreenOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            token_symbol: primaryCurrencyProperties.suffix,
            location: 'Home',
          },
        });
      },
      [],
    );

    return <TokenList onTokenClick={onTokenClick} />;
  },
);

const AssetList = ({ onClickAsset, showTokensLinks }: AssetListProps) => {
  const { showDetectedTokens, setShowDetectedTokens } =
    useAssetListTokenDetection();
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      <TokenListContainer onClickAsset={onClickAsset} />
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
      <AssetListFundingModals />
    </>
  );
};

export default AssetList;
