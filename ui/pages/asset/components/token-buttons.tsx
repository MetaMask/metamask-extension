import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { isEvmAccountType } from '@metamask/keyring-api';
import { CaipAssetType } from '@metamask/utils';
///: END:ONLY_INCLUDE_IF
import { InternalAccount } from '@metamask/keyring-internal-api';
import { I18nContext } from '../../../contexts/i18n';
import { startNewDraftTransaction } from '../../../ducks/send';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import {
  getNetworkConfigurationIdByChainId,
  getSelectedMultichainNetworkConfiguration,
  getIsMultichainAccountsState2Enabled,
  getUseExternalServices,
} from '../../../selectors';
import useBridging from '../../../hooks/bridge/useBridging';

import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { showModal, setActiveNetworkWithError } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import IconButton from '../../../components/ui/icon-button/icon-button';
import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';

///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { useHandleSendNonEvm } from '../../../components/app/wallet-overview/hooks/useHandleSendNonEvm';
///: END:ONLY_INCLUDE_IF

import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { Asset } from '../types/asset';
import { navigateToSendRoute } from '../../confirmations/utils/send';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { useRedesignedSendFlow } from '../../confirmations/hooks/useRedesignedSendFlow';

const TokenButtons = ({
  token,
  account,
}: {
  token: Asset & { type: AssetType.token };
  account: InternalAccount;
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const navigate = useNavigate();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const isEvm = isEvmChainId(token.chainId);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();
  const { chainId: multichainChainId } = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const currentEvmChainId = useSelector(getCurrentChainId);

  const currentChainId = (() => {
    if (isMultichainAccountsState2Enabled) {
      return token.chainId;
    }

    return isEvm ? currentEvmChainId : multichainChainId;
  })();

  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;

  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const { openBuyCryptoInPdapp } = useRamps();
  const { openBridgeExperience } = useBridging();

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const handleSendNonEvm = useHandleSendNonEvm(token.address as CaipAssetType);
  ///: END:ONLY_INCLUDE_IF

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

  // TODO BIP 44 Refactor: Remove this code
  const setCorrectChain = useCallback(async () => {
    // If we aren't presently on the chain of the asset, change to it
    if (
      currentEvmChainId !== token.chainId &&
      multichainChainId !== token.chainId &&
      !isMultichainAccountsState2Enabled
    ) {
      try {
        const networkConfigurationId = networks[token.chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${token.chainId}, Current chainId: ${currentEvmChainId}.
        ${
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          err
        }`);
        throw err;
      }
    }
  }, [
    isMultichainAccountsState2Enabled,
    currentEvmChainId,
    multichainChainId,
    networks,
    token.chainId,
    dispatch,
  ]);

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

    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    if (!isEvmAccountType(account.type) && !isSendRedesignEnabled) {
      await handleSendNonEvm();
      // Early return, not to let the non-EVM flow slip into the native send flow.
      return;
    }
    ///: END:ONLY_INCLUDE_IF

    try {
      await setCorrectChain();
      await dispatch(
        startNewDraftTransaction({
          type: AssetType.token,
          details: token,
        }),
      );
      navigateToSendRoute(navigate, isSendRedesignEnabled, {
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
  }, [
    trackEvent,
    dispatch,
    navigate,
    token,
    setCorrectChain,
    account,
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    handleSendNonEvm,
    ///: END:ONLY_INCLUDE_IF
    isSendRedesignEnabled,
  ]);

  const handleSwapOnClick = useCallback(async () => {
    await setCorrectChain();
    // Handle clicking from the asset details page
    openBridgeExperience(MetaMetricsSwapsEventSource.TokenView, token);
  }, [token, setCorrectChain, openBridgeExperience]);

  return (
    <Box
      display={Display.Flex}
      gap={3}
      justifyContent={JustifyContent.spaceEvenly}
    >
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
        disabled={token.isERC721}
      />

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
        disabled={!isExternalServicesEnabled}
      />
    </Box>
  );
};

export default TokenButtons;
