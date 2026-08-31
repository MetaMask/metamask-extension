import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  IconName as IconNameDs,
} from '@metamask/design-system-react';
import { I18nContext } from '../../../contexts/i18n';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { getUseExternalServices } from '../../../selectors';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getMultichainAccountAddressListReceivePagePath } from '../../multichain-accounts/multichain-account-address-list-page';
import useBridging from '../../../hooks/bridge/useBridging';

import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { showModal } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { BlockSize, IconColor } from '../../../helpers/constants/design-system';
import IconButton from '../../../components/ui/icon-button/icon-button';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { MoreButtonsGroup } from '../../../components/app/wallet-overview/coin-buttons';
import { PerpsTradeButtons } from '../../../components/app/perps/perps-trade-buttons';
import { ReceiveModal } from '../../../components/multichain/receive-modal';
import { transitionForward } from '../../../components/ui/transition';
import { useOnClickOutside } from '../../../hooks/useClickOutside';
import { trace, TraceName } from '../../../../shared/lib/trace';
import { Asset } from '../types/asset';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { navigateToSendRoute } from '../../confirmations/utils/send';
import { isEvmChainId, toAssetId } from '../../../../shared/lib/asset-utils';
import { useAssetActivation } from '../hooks/useAssetActivation';
import {
  useAssetPageSecurityTrustCtaGate,
  useAssetPageSecurityTrustCtaGateReady,
} from './security-trust';
import { AssetActivationErrorToast } from './asset-activation-error-toast';

const TokenButtons = ({
  token,
  disableSendForNonEvm = false,
  isMarketClosed = false,
  perpsMarketSymbol,
}: {
  token: Asset & { type: AssetType.token };
  /** When true, disables the send button for non-EVM chains (used on asset page) */
  disableSendForNonEvm?: boolean;
  /** When true, disables the swap button because the stock market is closed */
  isMarketClosed?: boolean;
  /**
   * When set (token with a matching Perps market), the row shows
   * Long / Short / Send / More and Buy / Swap move into the More menu,
   * matching the mobile Token Details actions.
   */
  perpsMarketSymbol?: string;
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const navigate = useNavigate();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const gateCtaAction = useAssetPageSecurityTrustCtaGate();
  const isCtaGateReady = useAssetPageSecurityTrustCtaGateReady();
  const isEvm = isEvmChainId(token.chainId);
  const shouldShowSendButton = Boolean(
    token.balance?.value && token.balance.value !== '0',
  );

  const currentChainId = token.chainId;

  const { goToBuy } = useRampsNavigation();
  const { openBridgeExperience } = useBridging();

  const containerRef = useRef<HTMLDivElement>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [isMoreOptionsDropdownOpen, setIsMoreOptionsDropdownOpen] =
    useState(false);

  const handleMoreOptionsButtonClick = useCallback(() => {
    setIsMoreOptionsDropdownOpen((prev) => !prev);
  }, []);

  useOnClickOutside({
    containerRef,
    onClickOutside: () => setIsMoreOptionsDropdownOpen(false),
    active: isMoreOptionsDropdownOpen,
  });

  useEffect(() => {
    if (token.isERC721) {
      dispatch(
        showModal({
          name: 'CONVERT_TOKEN_TO_NFT',
          tokenAddress: token.address,
        }),
      );
    }
  }, [token.isERC721, token.address, dispatch]);

  const handleBuyAndSellOnClick = useCallback(async () => {
    const runBuy = async () => {
      const opened = await goToBuy({
        assetId: toAssetId(token.address, token.chainId),
        chainId: token.chainId,
      });
      // The ramps gate can block the buy and show its own modal; don't report a
      // buy click in that case.
      if (!opened) {
        return;
      }
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NavBuyButtonClicked)
          .addCategory(MetaMetricsEventCategory.Navigation)
          .addProperties({
            location: 'Token Overview',
            text: 'Buy',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: currentChainId,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_symbol: token.symbol,
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
    currentChainId,
    gateCtaAction,
    token.address,
    token.chainId,
    token.symbol,
    trackEvent,
    createEventBuilder,
    goToBuy,
  ]);

  const handleSendOnClick = useCallback(async () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SendStarted)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
          location: MetaMetricsSwapsEventSource.TokenView,
          text: 'Send',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
        })
        .build({ excludeMetaMetricsId: false }),
    );

    try {
      navigateToSendRoute(navigate, {
        address: token.address,
        chainId: token.chainId,
      });

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (!err.message.includes(INVALID_ASSET_TYPE)) {
        throw err;
      }
    }
  }, [trackEvent, createEventBuilder, navigate, token]);

  const handleSwapOnClick = useCallback(() => {
    const runSwap = () => {
      openBridgeExperience(MetaMetricsSwapsEventSource.TokenView, token);
    };

    if (gateCtaAction) {
      gateCtaAction(runSwap, 'swap');
      return;
    }

    runSwap();
  }, [gateCtaAction, openBridgeExperience, token]);

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavReceiveButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          text: 'Receive',
          location: 'asset-page',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
        })
        .build(),
    );

    if (selectedAccountGroup) {
      // Navigate to the multichain address list page with receive source
      transitionForward(() =>
        navigate(
          getMultichainAccountAddressListReceivePagePath(selectedAccountGroup),
        ),
      );
    } else {
      // Show the traditional receive modal
      setShowReceiveModal(true);
    }
  }, [
    selectedAccountGroup,
    navigate,
    trackEvent,
    createEventBuilder,
    token.chainId,
  ]);

  const {
    deactivateAsset,
    canDeactivate,
    dismissErrorMessage,
    isDeactivating,
    errorMessage,
  } = useAssetActivation({
    assetId: token.address,
    assetSymbol: token.symbol,
  });

  const showPerpsActions = Boolean(perpsMarketSymbol) && !token.isERC721;

  const sendButton = (
    <IconButton
      className="token-overview__button"
      onClick={handleSendOnClick}
      Icon={
        <Icon
          name={IconName.Arrow2UpRight}
          color={IconColor.iconAlternative}
          size={IconSize.Md}
        />
      }
      label={t('send')}
      data-testid="eth-overview-send"
      width={showPerpsActions ? BlockSize.Full : undefined}
      disabled={
        token.isERC721 ||
        (disableSendForNonEvm && !isEvm && !isExternalServicesEnabled)
      }
    />
  );

  return (
    <>
      {showPerpsActions ? (
        // Mobile Token Details parity: Long / Short / Send (or Receive when
        // the balance is zero) / More, with the displaced actions in More.
        <Box
          ref={containerRef}
          className="flex relative w-full"
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          gap={3}
        >
          <PerpsTradeButtons
            marketSymbol={perpsMarketSymbol as string}
            classPrefix="token"
          />
          {shouldShowSendButton ? (
            sendButton
          ) : (
            <IconButton
              className="token-overview__button"
              onClick={handleReceiveOnClick}
              Icon={
                <Icon
                  name={IconName.Received}
                  color={IconColor.iconAlternative}
                  size={IconSize.Md}
                />
              }
              label={t('receive')}
              data-testid="token-overview-receive"
              width={BlockSize.Full}
            />
          )}
          <MoreButtonsGroup
            onClick={handleMoreOptionsButtonClick}
            modalIsOpen={isMoreOptionsDropdownOpen}
            classPrefix="token"
            actions={[
              {
                label: t('buy'),
                onClick: handleBuyAndSellOnClick,
                testId: 'token-overview-more-buy',
                iconName: IconNameDs.Money,
                enabled: isCtaGateReady,
              },
              {
                label: t('swap'),
                onClick: handleSwapOnClick,
                testId: 'token-overview-more-swap',
                iconName: IconNameDs.SwapVertical,
                enabled:
                  isExternalServicesEnabled && !isMarketClosed && isCtaGateReady,
              },
              {
                // Receive is in the row when there is no balance to send.
                label: t('receive'),
                onClick: handleReceiveOnClick,
                testId: 'token-overview-more-receive',
                iconName: IconNameDs.Received,
                enabled: shouldShowSendButton,
              },
              {
                label: t('assetDeactivate') as string,
                onClick: deactivateAsset,
                testId: 'token-overview-more-deactivate-asset',
                iconName: IconNameDs.Trash,
                enabled: canDeactivate && !isDeactivating,
              },
            ]}
          />
        </Box>
      ) : (
        <Box className="flex" gap={3} justifyContent={BoxJustifyContent.Evenly}>
          <IconButton
            className="token-overview__button"
            Icon={
              <Icon
                name={IconName.Dollar}
                color={IconColor.iconAlternative}
                size={IconSize.Md}
              />
            }
            label={t('buy')}
            data-testid="token-overview-buy"
            onClick={handleBuyAndSellOnClick}
            disabled={token.isERC721 || !isCtaGateReady}
          />

          {shouldShowSendButton ? sendButton : null}

          <IconButton
            className="token-overview__button"
            Icon={
              <Icon
                name={IconName.SwapVertical}
                color={IconColor.iconAlternative}
                size={IconSize.Md}
              />
            }
            onClick={handleSwapOnClick}
            data-testid="token-overview-swap"
            label={t('swap')}
            disabled={
              !isExternalServicesEnabled || isMarketClosed || !isCtaGateReady
            }
          />

          {canDeactivate ? (
            <IconButton
              className="token-overview__button"
              Icon={
                <Icon
                  name={IconName.Trash}
                  color={IconColor.iconAlternative}
                  size={IconSize.Md}
                />
              }
              onClick={deactivateAsset}
              data-testid="token-overview-deactivate-asset"
              label={t('assetDeactivate') as string}
              disabled={isDeactivating}
            />
          ) : null}
        </Box>
      )}
      {showReceiveModal && selectedAccount ? (
        <ReceiveModal
          address={selectedAccount.address}
          onClose={() => setShowReceiveModal(false)}
        />
      ) : null}
      <AssetActivationErrorToast
        message={errorMessage}
        onClose={dismissErrorMessage}
      />
    </>
  );
};

export default TokenButtons;
