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
import { NetworkPillSelector } from '../../../multichain/network-pill-selector/network-pill-selector';
import { TokenTable } from '../token-table/token-table';
import { TabControls } from '../../../ui/tabs';
import AssetListControlBar from './asset-list-control-bar';

export type AssetListVariant = 'list' | 'table';

export type AssetListProps = {
  onClickAsset: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  showTokensLinks?: boolean;
  safeChains?: SafeChain[];
  entryPoint?: ScreenViewedEntryPoint;
  variant?: AssetListVariant;
};

const TokenListContainer = React.memo(
  ({
    onClickAsset,
    safeChains,
    variant,
  }: Pick<AssetListProps, 'onClickAsset' | 'safeChains'> & {
    variant: AssetListVariant;
  }) => {
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

    if (variant === 'table') {
      return (
        <>
          <NetworkPillSelector />
          <div className="my-1 border-b border-1 border-border-muted" />
          <TokenTable onTokenClick={onTokenClick} safeChains={safeChains} />
        </>
      );
    }

    return <TokenList onTokenClick={onTokenClick} safeChains={safeChains} />;
  },
);

const AssetList = ({
  onClickAsset,
  showTokensLinks,
  safeChains,
  entryPoint,
  variant = 'list',
}: AssetListProps) => {
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  useScreenViewedEvent(MetaMetricsEventName.TokenScreenViewed, entryPoint);

  return (
    <>
      <TabControls>
        <AssetListControlBar
          showTokensLinks={shouldShowTokensLinks}
          data-testid="parent-selector-tokens-tab"
        />
      </TabControls>
      <TokenListContainer
        onClickAsset={onClickAsset}
        safeChains={safeChains}
        variant={variant}
      />
    </>
  );
};

export default AssetList;
