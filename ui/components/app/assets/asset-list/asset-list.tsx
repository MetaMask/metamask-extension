import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { type SafeChain } from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import DetectedToken from '../../detected-token/detected-token';
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
  onClickAsset: (chainId: string, address: string) => void;
  showTokensLinks?: boolean;
  safeChains?: SafeChain[];
};

const TokenListContainer = React.memo(
  ({
    onClickAsset,
    safeChains,
  }: Pick<AssetListProps, 'onClickAsset' | 'safeChains'>) => {
    const { trackEvent } = useContext(MetaMetricsContext);
    const { primaryCurrencyProperties } = usePrimaryCurrencyProperties();

    const onTokenClick = useCallback(
      (chainId: string, tokenAddress: string) => {
        trace({ name: TraceName.AssetDetails });
        onClickAsset(chainId, tokenAddress);
        trackEvent({
          event: MetaMetricsEventName.TokenScreenOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
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

  // mUSD CTA visibility logic
  const { shouldShowBuyGetMusdCta } = useMusdCtaVisibility();
  const { hasMusdBalance } = useMusdBalance();
  const { isPopularNetworksFilterActive, selectedChainId } =
    useMusdNetworkFilter();
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);

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
    isPopularNetworksFilterActive,
  });

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      {buyGetCtaState.shouldShowCta && (
        <MusdBuyGetCta
          variant={buyGetCtaState.variant}
          selectedChainId={buyGetCtaState.selectedChainId}
          showNetworkIcon={buyGetCtaState.showNetworkIcon}
        />
      )}
      <TokenListContainer onClickAsset={onClickAsset} safeChains={safeChains} />
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
    </>
  );
};

export default AssetList;
