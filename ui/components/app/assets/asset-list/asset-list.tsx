import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { type SafeChain } from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import DetectedToken from '../../detected-token/detected-token';
import { usePrimaryCurrencyProperties } from '../hooks';
import TokenList from '../token-list';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import AssetListControlBar from './asset-list-control-bar';
import AssetListFundingModals from './asset-list-funding-modals';

export type AssetListProps = {
  onClickAsset: (chainId: string, address: string) => void;
  showTokensLinks?: boolean;
  safeChains?: SafeChain[];
};

const TokenListContainer = React.memo(
  ({
    onClickAsset,
    safeChains,
  }: Pick<AssetListProps, 'onClickAsset' | 'safeChains'>) => {
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

    return <TokenList onTokenClick={onTokenClick} safeChains={safeChains} />;
  },
);

const AssetList = ({
  onClickAsset,
  showTokensLinks,
  safeChains,
}: AssetListProps) => {
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      <TokenListContainer onClickAsset={onClickAsset} safeChains={safeChains} />
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
      <AssetListFundingModals />
    </>
  );
};

export default AssetList;
