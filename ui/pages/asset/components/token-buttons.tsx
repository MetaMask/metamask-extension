import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { isEvmAccountType } from '@metamask/keyring-api';
import { CaipAssetType } from '@metamask/utils';
///: END:ONLY_INCLUDE_IF
import { isEqual } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import { PREPARE_SWAP_ROUTE } from '../../../helpers/constants/routes';
import { startNewDraftTransaction } from '../../../ducks/send';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import {
  getIsSwapsChain,
  getIsBridgeChain,
  getCurrentKeyring,
  getNetworkConfigurationIdByChainId,
  getSelectedInternalAccount,
  getSelectedMultichainNetworkConfiguration,
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
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainIsEvm,
  getMultichainIsTestnet,
} from '../../../selectors/multichain';

///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { useHandleSendNonEvm } from '../../../components/app/wallet-overview/hooks/useHandleSendNonEvm';
///: END:ONLY_INCLUDE_IF

import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { Asset } from '../types/asset';
import { getIsUnifiedUIEnabled } from '../../../ducks/bridge/selectors';
import { navigateToSendRoute } from '../../confirmations/utils/send';

const TokenButtons = ({
  token,
}: {
  token: Asset & { type: AssetType.token };
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const { trackEvent } = useContext(MetaMetricsContext);
  const history = useHistory();
  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is wrong maybe?
  const usingHardwareWallet = isHardwareKeyring(keyring.type);
  const isEvm = useMultichainSelector(getMultichainIsEvm);

  const account = useSelector(getSelectedInternalAccount, isEqual);

  const { chainId: multichainChainId } = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const currentChainId = useSelector(getCurrentChainId);
  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;
  const isSwapsChain = useSelector((state) =>
    getIsSwapsChain(state, isEvm ? currentChainId : multichainChainId),
  );

  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, isEvm ? currentChainId : multichainChainId),
  );
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const { openBuyCryptoInPdapp } = useRamps();
  const { openBridgeExperience } = useBridging();

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const handleSendNonEvm = useHandleSendNonEvm(token.address as CaipAssetType);
  ///: END:ONLY_INCLUDE_IF

  const isUnifiedUIEnabled = useSelector((state) =>
    getIsUnifiedUIEnabled(state, isEvm ? currentChainId : multichainChainId),
  );

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

  const setCorrectChain = useCallback(async () => {
    // If we aren't presently on the chain of the asset, change to it
    if (
      currentChainId !== token.chainId &&
      multichainChainId !== token.chainId
    ) {
      try {
        const networkConfigurationId = networks[token.chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${token.chainId}, Current chainId: ${currentChainId}.
        ${
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          err
        }`);
        throw err;
      }
    }
  }, [currentChainId, multichainChainId, networks, token.chainId, dispatch]);

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
        event: MetaMetricsEventName.NavSendButtonClicked,
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
    if (!isEvmAccountType(account.type) && !process.env.SEND_REDESIGN_ENABLED) {
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
      navigateToSendRoute(history, { address: token.address });

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
    history,
    token,
    setCorrectChain,
    account,
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    handleSendNonEvm,
    ///: END:ONLY_INCLUDE_IF
  ]);

  const isTestnet = useSelector(getMultichainIsTestnet);

  const handleBridgeOnClick = useCallback(
    async (isSwap: boolean) => {
      await setCorrectChain();
      // Handle clicking from the asset details page
      openBridgeExperience(
        MetaMetricsSwapsEventSource.TokenView,
        token,
        isSwap,
      );
    },
    [token, setCorrectChain, openBridgeExperience],
  );

  const handleSwapOnClick = useCallback(async () => {
    if (multichainChainId === MultichainNetworks.SOLANA) {
      handleBridgeOnClick(true);
      return;
    }

    // Check if unified UI is enabled and route to bridge page for swaps
    if (isUnifiedUIEnabled) {
      handleBridgeOnClick(true); // true indicates it's a swap
      return;
    }

    await setCorrectChain();

    trackEvent({
      event: MetaMetricsEventName.NavSwapButtonClicked,
      category: MetaMetricsEventCategory.Swaps,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: token.symbol,
        location: MetaMetricsSwapsEventSource.TokenView,
        text: 'Swap',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: currentChainId,
      },
    });
    dispatch(
      setSwapsFromToken({
        ...token,
        address: token.address?.toLowerCase(),
        iconUrl: token.image,
        balance: token?.balance?.value,
        string: token?.balance?.display,
      }),
    );
    if (usingHardwareWallet) {
      global.platform.openExtensionInBrowser?.(
        PREPARE_SWAP_ROUTE,
        undefined,
        false,
      );
    } else {
      history.push(PREPARE_SWAP_ROUTE);
    }
  }, [
    currentChainId,
    trackEvent,
    dispatch,
    history,
    token,
    usingHardwareWallet,
    setCorrectChain,
    handleBridgeOnClick,
    multichainChainId,
    isUnifiedUIEnabled,
  ]);

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
            name={IconName.Money}
            color={IconColor.iconAlternative}
            size={IconSize.Md}
          />
        }
        label={t('buyAndSell')}
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
            name={IconName.SwapHorizontal}
            color={IconColor.iconAlternative}
            size={IconSize.Md}
          />
        }
        onClick={handleSwapOnClick}
        label={t('swap')}
        disabled={!isSwapsChain}
      />

      {!isUnifiedUIEnabled && !isTestnet && isBridgeChain && (
        <IconButton
          className="token-overview__button"
          data-testid="token-overview-bridge"
          Icon={
            <Icon
              name={IconName.Bridge}
              color={IconColor.iconAlternative}
              size={IconSize.Md}
            />
          }
          label={t('bridge')}
          onClick={() => handleBridgeOnClick(false)}
          disabled={!isBridgeChain}
        />
      )}
    </Box>
  );
};

export default TokenButtons;
