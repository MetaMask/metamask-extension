import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../../../../shared/constants/metametrics';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { selectEnabledNetworksAsCaipChainIds } from '../../../../selectors';
import { type SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { usePrimaryCurrencyProperties } from '../hooks';
import TokenList from '../token-list';
import { MusdBuyGetCta } from '../../musd';
import {
  useMusdCtaVisibility,
  useMusdBalance,
  useMusdNetworkFilter,
  useMusdConversionTokens,
} from '../../../../hooks/musd';
import { selectAccountGroupBalanceForEmptyState } from '../../../../selectors/assets';
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

  // mUSD CTA visibility logic
  const { shouldShowBuyGetMusdCta } = useMusdCtaVisibility();
  const { hasMusdBalance } = useMusdBalance();
  const { selectedChainId } = useMusdNetworkFilter();
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const networkFilter = useSelector(selectEnabledNetworksAsCaipChainIds);

  const hasTrackedTokenScreenViewedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedTokenScreenViewedRef.current) {
      return;
    }
    hasTrackedTokenScreenViewedRef.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.TokenScreenViewed)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          network_filter: networkFilter,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          entry_point: entryPoint,
        })
        .build(),
    );
  }, [trackEvent, createEventBuilder, networkFilter, entryPoint]);

  // Use the centralized token filter that includes min balance check
  // This is the source of truth for which tokens are eligible for mUSD conversion
  const { tokens: conversionTokens, hasConvertibleTokensByChainId } =
    useMusdConversionTokens();

  // Determine if user has convertible tokens based on the centralized filter
  // This properly checks allowlist/blocklist AND minimum fiat balance
  const hasConvertibleTokens = useMemo(() => {
    if (!hasBalance) {
      return false;
    }
    // If a specific chain is selected, check for convertible tokens on that chain
    if (selectedChainId) {
      return hasConvertibleTokensByChainId(selectedChainId);
    }
    // Otherwise, check if there are any convertible tokens at all
    return conversionTokens.length > 0;
  }, [
    hasBalance,
    selectedChainId,
    hasConvertibleTokensByChainId,
    conversionTokens,
  ]);

  // Get CTA state
  const buyGetCtaState = shouldShowBuyGetMusdCta({
    hasConvertibleTokens,
    hasMusdBalance,
    isEmptyWallet: !hasBalance,
    selectedChainId,
  });

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      {buyGetCtaState.shouldShowCta && (
        <MusdBuyGetCta
          variant={buyGetCtaState.variant}
          selectedChainId={buyGetCtaState.selectedChainId}
        />
      )}
      <TokenListContainer onClickAsset={onClickAsset} safeChains={safeChains} />
    </>
  );
};

export default AssetList;
