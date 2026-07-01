import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, BoxJustifyContent } from '@metamask/design-system-react';
import { I18nContext } from '../../../contexts/i18n';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { getUseExternalServices } from '../../../selectors';
import useBridging from '../../../hooks/bridge/useBridging';

import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { forceUpdateMetamaskState, showModal } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { IconColor } from '../../../helpers/constants/design-system';
import IconButton from '../../../components/ui/icon-button/icon-button';
import Tooltip from '../../../components/ui/tooltip/tooltip';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';

import { Asset } from '../types/asset';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { navigateToSendRoute } from '../../confirmations/utils/send';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { useAssetActivation } from '../hooks/useAssetActivation';
import { StellarClassicTrustlineErrorToast } from './stellar-classic-trustline-error-toast';

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
  const { trackEvent } = useContext(MetaMetricsContext);
  const navigate = useNavigate();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const isEvm = isEvmChainId(token.chainId);
  const hasNonZeroTokenBalance = Boolean(
    token.balance?.value && token.balance.value !== '0',
  );
  const shouldShowSendButton = hasNonZeroTokenBalance;

  const currentChainId = token.chainId;

  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const { openBuyCryptoInPdapp } = useRamps();
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

  const handleBuyAndSellOnClick = useCallback(() => {
    openBuyCryptoInPdapp();
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'Token Overview',
        text: 'Buy',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: currentChainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: token.symbol,
      },
    });
  }, [currentChainId, token.symbol, trackEvent, openBuyCryptoInPdapp]);

  const handleSendOnClick = useCallback(async () => {
    trackEvent(
      {
        event: MetaMetricsEventName.SendStarted,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
          location: MetaMetricsSwapsEventSource.TokenView,
          text: 'Send',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
        },
      },
      { excludeMetaMetricsId: false },
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
  }, [trackEvent, navigate, token]);

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(MetaMetricsSwapsEventSource.TokenView, token);
  }, [token, openBridgeExperience]);

  const {
    deactivateAsset,
    canDeactivate,
    dismissTrustlineRemoveErrorToast,
    isDeactivating,
    trustlineRemoveErrorMessage,
  } = useAssetActivation({
    assetId: token.address as CaipAssetType,
    hasNonZeroBalance: hasNonZeroTokenBalance,
    balanceDisplay: token.balance?.display ?? token.balance?.value,
    symbol: token.symbol,
  });
  return (
    <>
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
          disabled={token.isERC721 || !isBuyableChain}
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
            data-testid="token-overview-stellar-remove-trustline"
            label={t('stellarClassicDeactivateOnStellar') as string}
            disabled={isDeactivating}
          />
        ) : null}
      </Box>
      <StellarClassicTrustlineErrorToast
        message={trustlineRemoveErrorMessage}
        onClose={dismissTrustlineRemoveErrorToast}
        dataTestId="stellar-classic-trustline-remove-error-toast"
      />
    </>
  );
};

export default TokenButtons;
