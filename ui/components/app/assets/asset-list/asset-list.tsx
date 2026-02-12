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
///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import { MusdBuyGetCta } from '../../musd-cta';
import {
  useMusdCtaVisibility,
  useMusdBalance,
  useMusdNetworkFilter,
} from '../../../../hooks/musd';
import { selectAccountGroupBalanceForEmptyState } from '../../../../selectors/assets';
import { selectMusdCtaTokens } from '../../../../selectors/musd';
import { isTokenInWildcardList } from '../../../../hooks/musd/useMusdCtaVisibility';
///: END:ONLY_INCLUDE_IF
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

  ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
  // mUSD CTA visibility logic
  const { shouldShowBuyGetMusdCta } = useMusdCtaVisibility();
  const { hasMusdBalance } = useMusdBalance();
  const { isPopularNetworksFilterActive, selectedChainId } =
    useMusdNetworkFilter();
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const ctaTokens = useSelector(selectMusdCtaTokens);

  // Determine if user has convertible tokens
  // This is a simplified check - in production, would check actual token balances
  const hasConvertibleTokens = useMemo(() => {
    // If user has balance, they might have convertible tokens
    // The actual check would need to look at their token list
    // For now, we check if they have any balance and the CTA tokens are configured
    if (!hasBalance || !ctaTokens) {
      return false;
    }
    // Check if any common stablecoins are in the CTA list
    const commonStablecoins = ['USDC', 'USDT', 'DAI'];
    return commonStablecoins.some((symbol) =>
      isTokenInWildcardList(symbol, ctaTokens, selectedChainId ?? undefined),
    );
  }, [hasBalance, ctaTokens, selectedChainId]);

  // Get CTA state
  const buyGetCtaState = shouldShowBuyGetMusdCta({
    hasConvertibleTokens,
    hasMusdBalance,
    isEmptyWallet: !hasBalance,
    selectedChainId,
    isPopularNetworksFilterActive,
  });
  ///: END:ONLY_INCLUDE_IF
  console.log('[MUSD CTA Debug] buyGetCtaState', buyGetCtaState);
  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      {
        ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
        buyGetCtaState.shouldShowCta && (
          <MusdBuyGetCta
            variant={buyGetCtaState.variant}
            selectedChainId={buyGetCtaState.selectedChainId}
            showNetworkIcon={buyGetCtaState.showNetworkIcon}
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
      <TokenListContainer onClickAsset={onClickAsset} safeChains={safeChains} />
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
    </>
  );
};

export default AssetList;
