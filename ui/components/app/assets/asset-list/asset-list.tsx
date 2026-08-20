import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../../../../shared/constants/metametrics';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useScreenViewedEvent } from '../../../../hooks/useScreenViewedEvent';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { type SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { usePrimaryCurrencyProperties } from '../hooks';
import TokenList from '../token-list';
import AssetListControlBar from './asset-list-control-bar';

export type AssetListProps = {
  onClickAsset: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  showTokensLinks?: boolean;
  safeChains?: SafeChain[];
  entryPoint?: ScreenViewedEntryPoint;
};

const TokenListContainer = React.memo(
  ({
    onClickAsset,
    safeChains,
  }: Pick<AssetListProps, 'onClickAsset' | 'safeChains'>) => {
    const { trackEvent, createEventBuilder } = useAnalytics();
    const { primaryCurrencyProperties } = usePrimaryCurrencyProperties();

    const onTokenClick = useCallback(
      (chainId: string, tokenAddress: string, assetId?: CaipAssetType) => {
        trace({ name: TraceName.AssetDetails });
        onClickAsset(chainId, tokenAddress, assetId);
        trackEvent(
          createEventBuilder(MetaMetricsEventName.TokenScreenViewed)
            .addCategory(MetaMetricsEventCategory.Navigation)
            .addProperties({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol: primaryCurrencyProperties.suffix,
              location: 'Home',
            })
            .build(),
        );
      },
      [
        createEventBuilder,
        onClickAsset,
        primaryCurrencyProperties.suffix,
        trackEvent,
      ],
    );

    return <TokenList onTokenClick={onTokenClick} safeChains={safeChains} />;
  },
);

const AssetList = ({
  onClickAsset,
  showTokensLinks,
  safeChains,
  entryPoint,
}: AssetListProps) => {
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  useScreenViewedEvent(MetaMetricsEventName.TokenScreenViewed, entryPoint);

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      <TokenListContainer onClickAsset={onClickAsset} safeChains={safeChains} />
    </>
  );
};

export default AssetList;
