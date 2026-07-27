import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, BoxJustifyContent } from '@metamask/design-system-react';
import { I18nContext } from '../../../contexts/i18n';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { getUseExternalServices } from '../../../selectors';
import useBridging from '../../../hooks/bridge/useBridging';

import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { showModal } from '../../../store/actions';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { IconColor } from '../../../helpers/constants/design-system';
import IconButton from '../../../components/ui/icon-button/icon-button';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { Asset } from '../types/asset';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { navigateToSendRoute } from '../../confirmations/utils/send';
import { isEvmChainId, toAssetId } from '../../../../shared/lib/asset-utils';

const TokenButtons = ({
  token,
  disableSendForNonEvm = false,
  isMarketClosed = false,
}: {
  token: Asset & { type: AssetType.token };
  /** When true, disables the send button for non-EVM chains (used on asset page) */
  disableSendForNonEvm?: boolean;
  /** When true, disables the swap button because the stock market is closed */
  isMarketClosed?: boolean;
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const navigate = useNavigate();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const isEvm = isEvmChainId(token.chainId);
  const shouldShowSendButton = Boolean(
    token.balance?.value && token.balance.value !== '0',
  );

  const currentChainId = token.chainId;

  const { goToBuy } = useRampsNavigation();
  const { openBridgeExperience } = useBridging();

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
  }, [
    currentChainId,
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

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(MetaMetricsSwapsEventSource.TokenView, token);
  }, [token, openBridgeExperience]);

  return (
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        disabled={token.isERC721}
      />

      {shouldShowSendButton ? (
        <IconButton
          className="token-overview__button"
          onClick={handleSendOnClick}
          Icon={
            <Icon
              name={IconName.Send}
              color={IconColor.iconAlternative}
              size={IconSize.Md}
            />
          }
          label={t('send')}
          data-testid="eth-overview-send"
          disabled={
            token.isERC721 ||
            (disableSendForNonEvm && !isEvm && !isExternalServicesEnabled)
          }
        />
      ) : null}

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
        disabled={!isExternalServicesEnabled || isMarketClosed}
      />
    </Box>
  );
};

export default TokenButtons;
