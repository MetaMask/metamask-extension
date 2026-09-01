import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '@metamask/design-system-react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../../shared/constants/bridge';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { getDefaultBridgeFromToken } from '../../../../shared/lib/bridge-utils/default-tokens';
import { transitionForward } from '../../../components/ui/transition';
import { I18nContext } from '../../../contexts/i18n';
import { showBuyTabOpenedToast } from '../../../helpers/utils/show-buy-tab-opened-toast';
import useBridging from '../../../hooks/bridge/useBridging';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getUseExternalServices } from '../../../selectors';
import { useBalanceAwareSwapDefaults } from '../hooks/useBalanceAwareSwapDefaults';
import { isNativeAsset, type Asset } from '../types/asset';
import { getUsdAmountRange } from '../utils/get-usd-amount-range';
import {
  useAssetPageSecurityTrustCtaGate,
  useAssetPageSecurityTrustCtaGateReady,
} from './security-trust';

/** Fiat holding above this makes Swap the filled primary CTA instead of Buy. */
const SWAP_PRIMARY_FIAT_THRESHOLD = 100;

const STICKY_PRIMARY_BUTTON_CLASS_NAME =
  'flex-1 bg-success-default text-success-inverse hover:bg-success-default-hover active:bg-success-default-pressed';

const STICKY_SECONDARY_BUTTON_CLASS_NAME =
  'flex-1 border border-success-default bg-transparent text-success-default hover:bg-success-muted-hover active:bg-success-muted-pressed';

/**
 * Whether the Token Detail Page fiat balance is high enough that Swap should
 * be the primary (filled) sticky CTA.
 *
 * @param fiatBalance - Fiat amount as stored on `asset.balance.fiat`.
 * @returns True when the parsed amount is a finite number greater than 100.
 */
export function shouldPreferStickySwapCta(fiatBalance?: string): boolean {
  if (!fiatBalance) {
    return false;
  }

  const parsedBalance = Number(fiatBalance.replace(/[$,]/gu, '').trim());
  return (
    Number.isFinite(parsedBalance) &&
    parsedBalance > SWAP_PRIMARY_FIAT_THRESHOLD
  );
}

type AssetStickyActionsProps = {
  asset: Asset;
  /**
   * CAIP-19 asset to pre-select when buying a native asset. Tokens derive it
   * from their contract address instead.
   */
  buyAssetId?: CaipAssetType;
  /** Disables Swap while a stock token's market is closed */
  isMarketClosed?: boolean;
  /** Native assets cannot swap from accounts that cannot sign */
  isSigningEnabled?: boolean;
};

/**
 * Swap and Buy calls to action, pinned to the bottom of the asset page so they
 * stay reachable while the rest of the page scrolls.
 *
 * @param props - The component props.
 * @param props.asset - The native or token asset being displayed.
 * @param props.buyAssetId - CAIP-19 asset to pre-select when buying a native asset.
 * @param props.isMarketClosed - Whether the asset's stock market is closed.
 * @param props.isSigningEnabled - Whether the selected account can sign.
 */
export const AssetStickyActions = ({
  asset,
  buyAssetId,
  isMarketClosed = false,
  isSigningEnabled = true,
}: AssetStickyActionsProps) => {
  const t = useContext(I18nContext);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const gateCtaAction = useAssetPageSecurityTrustCtaGate();
  const isCtaGateReady = useAssetPageSecurityTrustCtaGateReady();
  const { goToBuy, opensBuyInPortfolioTab } = useRampsNavigation();
  const { openBridgeExperience } = useBridging();

  const isNative = isNativeAsset(asset);
  const { chainId, symbol } = asset;

  const currentSwapToken = useMemo(() => {
    if (!isNativeAsset(asset)) {
      return asset;
    }

    if (!ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId)) {
      return null;
    }

    // Native swaps start from the chain's default bridge asset, which some
    // chains override (e.g. Arc swaps the ERC20 flavor of USDC).
    const nativeSwapToken = getSwapNativeTokenWithOverridesForChain(chainId);
    return {
      symbol: nativeSwapToken.symbol,
      address: nativeSwapToken.address,
      // `getNativeAssetForChainId` reports the chain as a decimal number, which
      // the bridge entry point does not recognize as a supported chain.
      chainId: formatChainIdToCaip(chainId),
      decimals: nativeSwapToken.decimals,
      name: nativeSwapToken.name ?? nativeSwapToken.symbol,
    };
  }, [asset, chainId]);

  const { sourceToken, destTokenAssetId } = useBalanceAwareSwapDefaults({
    currentToken: currentSwapToken,
    currentTokenBalance: asset.balance?.value ?? asset.balance?.display,
  });

  const trackStickyCtaClick = useCallback(
    (ctaType: 'buy' | 'swap') => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TokenDetailsCtaClicked)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            cta_type: ctaType,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            usd_amount_range: getUsdAmountRange(asset.balance?.fiat),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_address: currentSwapToken?.address ?? '',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: chainId,
          })
          .build(),
      );
    },
    [
      asset.balance?.fiat,
      chainId,
      createEventBuilder,
      currentSwapToken?.address,
      trackEvent,
    ],
  );

  const handleBuyClick = useCallback(async () => {
    trackStickyCtaClick('buy');

    const runBuy = async () => {
      const assetId = isNativeAsset(asset)
        ? buyAssetId
        : toAssetId(asset.address, chainId);

      const opened = await goToBuy({ assetId, chainId });
      // The ramps gate can block the buy and show its own modal; don't report a
      // buy click in that case.
      if (!opened) {
        return;
      }

      // Only the Portfolio paths open a browser tab; when goToBuy navigates
      // in-app the "tab opened" toast would be misleading.
      if (opensBuyInPortfolioTab) {
        showBuyTabOpenedToast(
          t('buyTabOpenedToastText'),
          t('buyTabOpenedToastDescription'),
        );
      }

      trackEvent(
        createEventBuilder(MetaMetricsEventName.NavBuyButtonClicked)
          .addCategory(MetaMetricsEventCategory.Navigation)
          .addProperties({
            location: 'Token Overview',
            text: 'Buy',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: chainId,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_symbol: symbol,
          })
          .build(),
      );
    };

    if (gateCtaAction) {
      gateCtaAction(runBuy, 'buy');
      return;
    }

    await runBuy();
  }, [
    asset,
    buyAssetId,
    chainId,
    createEventBuilder,
    gateCtaAction,
    goToBuy,
    opensBuyInPortfolioTab,
    symbol,
    t,
    trackEvent,
    trackStickyCtaClick,
  ]);

  const handleSwapClick = useCallback(() => {
    trackStickyCtaClick('swap');

    const runSwap = () => {
      if (isNative) {
        transitionForward(() =>
          openBridgeExperience(
            MetaMetricsSwapsEventSource.MainView,
            sourceToken,
            destTokenAssetId,
          ),
        );
        return;
      }

      openBridgeExperience(
        MetaMetricsSwapsEventSource.TokenView,
        sourceToken,
        destTokenAssetId,
      );
    };

    if (gateCtaAction) {
      gateCtaAction(runSwap, 'swap');
      return;
    }

    runSwap();
  }, [
    destTokenAssetId,
    gateCtaAction,
    isNative,
    openBridgeExperience,
    sourceToken,
    trackStickyCtaClick,
  ]);

  const isSwapDisabled =
    !isExternalServicesEnabled ||
    !isCtaGateReady ||
    isMarketClosed ||
    (isNative && !isSigningEnabled);

  const preferSwapAsPrimary = shouldPreferStickySwapCta(asset.balance?.fiat);

  return (
    <Box
      // Sticky CTA footer: pinned to the bottom of the asset page scroll
      // container, elevated above content, and padded for the device safe-area.
      // Uses `.cta-footer` so the toaster lifts above it.
      className="cta-footer sticky inset-x-0 bottom-0 z-[1] mt-auto shrink-0 border-t border-muted bg-default px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_12px_var(--color-shadow-default)]"
      flexDirection={BoxFlexDirection.Row}
      gap={3}
      data-testid="asset-sticky-actions"
    >
      <Button
        variant={
          preferSwapAsPrimary ? ButtonVariant.Primary : ButtonVariant.Secondary
        }
        size={ButtonSize.Lg}
        startIconName={IconName.SwapVertical}
        className={
          preferSwapAsPrimary
            ? STICKY_PRIMARY_BUTTON_CLASS_NAME
            : STICKY_SECONDARY_BUTTON_CLASS_NAME
        }
        onClick={handleSwapClick}
        disabled={isSwapDisabled}
        data-testid="asset-sticky-swap"
      >
        {t('swap')}
      </Button>
      <Button
        variant={
          preferSwapAsPrimary ? ButtonVariant.Secondary : ButtonVariant.Primary
        }
        size={ButtonSize.Lg}
        startIconName={IconName.Bank}
        className={
          preferSwapAsPrimary
            ? STICKY_SECONDARY_BUTTON_CLASS_NAME
            : STICKY_PRIMARY_BUTTON_CLASS_NAME
        }
        onClick={handleBuyClick}
        disabled={Boolean(asset.isERC721) || !isCtaGateReady}
        data-testid="asset-sticky-buy"
      >
        {t('buy')}
      </Button>
    </Box>
  );
};

export default AssetStickyActions;
