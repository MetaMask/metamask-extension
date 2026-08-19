import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '@metamask/design-system-react';
import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../../shared/constants/bridge';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { getSwapNativeTokenWithOverridesForChain } from '../../../components/app/wallet-overview/coin-buttons';
import { transitionForward } from '../../../components/ui/transition';
import { I18nContext } from '../../../contexts/i18n';
import { showBuyTabOpenedToast } from '../../../helpers/utils/show-buy-tab-opened-toast';
import useBridging from '../../../hooks/bridge/useBridging';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getUseExternalServices } from '../../../selectors';
import { isNativeAsset, type Asset } from '../types/asset';
import {
  useAssetPageSecurityTrustCtaGate,
  useAssetPageSecurityTrustCtaGateReady,
} from './security-trust';

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

  const handleBuyClick = useCallback(async () => {
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
  ]);

  const handleSwapClick = useCallback(() => {
    const runSwap = () => {
      if (isNativeAsset(asset)) {
        // Native swaps start from the chain's default bridge asset, which some
        // chains override (e.g. Arc swaps the ERC20 flavor of USDC).
        transitionForward(() =>
          openBridgeExperience(
            MetaMetricsSwapsEventSource.MainView,
            ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId)
              ? getSwapNativeTokenWithOverridesForChain(chainId)
              : undefined,
          ),
        );
        return;
      }

      openBridgeExperience(MetaMetricsSwapsEventSource.TokenView, asset);
    };

    if (gateCtaAction) {
      gateCtaAction(runSwap, 'swap');
      return;
    }

    runSwap();
  }, [asset, chainId, gateCtaAction, openBridgeExperience]);

  const isSwapDisabled =
    !isExternalServicesEnabled ||
    !isCtaGateReady ||
    isMarketClosed ||
    (isNative && !isSigningEnabled);

  return (
    <Box
      className="asset-page__sticky-actions"
      flexDirection={BoxFlexDirection.Row}
      gap={3}
      data-testid="asset-sticky-actions"
    >
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        startIconName={IconName.SwapVertical}
        className="flex-1 border border-success-default bg-transparent text-success-default hover:bg-success-muted-hover active:bg-success-muted-pressed"
        onClick={handleSwapClick}
        disabled={isSwapDisabled}
        data-testid="asset-sticky-swap"
      >
        {t('swap')}
      </Button>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        startIconName={IconName.Bank}
        className="flex-1 bg-success-default text-success-inverse hover:bg-success-default-hover active:bg-success-default-pressed"
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
