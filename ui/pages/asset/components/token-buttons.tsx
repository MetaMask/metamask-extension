import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { isEvmAccountType } from '@metamask/keyring-api';
import { CaipAssetType } from '@metamask/utils';
///: END:ONLY_INCLUDE_IF
import { isEqual } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  PREPARE_SWAP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import { startNewDraftTransaction } from '../../../ducks/send';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
///: END:ONLY_INCLUDE_IF
import {
  getIsSwapsChain,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getIsBridgeChain,
  getCurrentKeyring,
  ///: END:ONLY_INCLUDE_IF
  getNetworkConfigurationIdByChainId,
  getSelectedInternalAccount,
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useBridging from '../../../hooks/bridge/useBridging';
///: END:ONLY_INCLUDE_IF

import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import {
  showModal,
  setSwitchedNetworkDetails,
  setActiveNetworkWithError,
} from '../../../store/actions';
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
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainIsEvm,
  getMultichainNetwork,
} from '../../../selectors/multichain';

///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { useHandleSendNonEvm } from '../../../components/app/wallet-overview/hooks/useHandleSendNonEvm';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
///: END:ONLY_INCLUDE_IF

import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import type { Asset } from './asset-page';

const TokenButtons = ({
  token,
}: {
  token: Asset & { type: AssetType.token };
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is wrong maybe?
  const usingHardwareWallet = isHardwareKeyring(keyring.type);
  ///: END:ONLY_INCLUDE_IF
  const isEvm = useMultichainSelector(getMultichainIsEvm);

  const account = useSelector(getSelectedInternalAccount, isEqual);

  const { chainId: multichainChainId } =
    useMultichainSelector(getMultichainNetwork);

  const currentChainId = useSelector(getCurrentChainId);
  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;
  const isSwapsChain = useSelector((state) =>
    getIsSwapsChain(state, isEvm ? currentChainId : multichainChainId),
  );
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const { openBuyCryptoInPdapp } = useRamps();
  const { openBridgeExperience } = useBridging();
  ///: END:ONLY_INCLUDE_IF

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

  const setCorrectChain = useCallback(async () => {
    // If we aren't presently on the chain of the asset, change to it
    if (
      currentChainId !== token.chainId &&
      multichainChainId !== token.chainId
    ) {
      try {
        const networkConfigurationId = networks[token.chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
        await dispatch(
          setSwitchedNetworkDetails({
            networkClientId: networkConfigurationId,
          }),
        );
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${token.chainId}, Current chainId: ${currentChainId}.
        ${err}`);
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
        chain_id: currentChainId,
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
          token_symbol: token.symbol,
          location: MetaMetricsSwapsEventSource.TokenView,
          text: 'Send',
          chain_id: token.chainId,
        },
      },
      { excludeMetaMetricsId: false },
    );

    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    if (!isEvmAccountType(account.type)) {
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
      history.push(SEND_ROUTE);

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

  const handleBridgeOnClick = useCallback(
    async (isSwap: boolean) => {
      await setCorrectChain();
      openBridgeExperience(
        MetaMetricsSwapsEventSource.TokenView,
        {
          ...token,
          iconUrl: token.image,
          balance: token?.balance?.value,
          string: token?.balance?.display,
          name: token.name ?? '',
        },
        undefined,
        isSwap,
      );
    },
    [token, setCorrectChain, openBridgeExperience],
  );

  const handleSwapOnClick = useCallback(async () => {
    ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
    if (multichainChainId === MultichainNetworks.SOLANA) {
      handleBridgeOnClick(true);
      return;
    }
    ///: END:ONLY_INCLUDE_IF

    await setCorrectChain();

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    trackEvent({
      event: MetaMetricsEventName.NavSwapButtonClicked,
      category: MetaMetricsEventCategory.Swaps,
      properties: {
        token_symbol: token.symbol,
        location: MetaMetricsSwapsEventSource.TokenView,
        text: 'Swap',
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
    ///: END:ONLY_INCLUDE_IF
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
  ]);

  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceEvenly}>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <IconButton
          className="token-overview__button"
          Icon={
            <Icon
              name={IconName.PlusMinus}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          label={t('buyAndSell')}
          data-testid="token-overview-buy"
          onClick={handleBuyAndSellOnClick}
          disabled={token.isERC721 || !isBuyableChain}
          tooltipRender={null}
        />
        ///: END:ONLY_INCLUDE_IF
      }

      <IconButton
        className="token-overview__button"
        onClick={handleSendOnClick}
        Icon={
          <Icon
            name={IconName.Arrow2UpRight}
            color={IconColor.primaryInverse}
            size={IconSize.Sm}
          />
        }
        label={t('send')}
        data-testid="eth-overview-send"
        disabled={token.isERC721}
        tooltipRender={null}
      />
      {isSwapsChain && (
        <IconButton
          className="token-overview__button"
          Icon={
            <Icon
              name={IconName.SwapHorizontal}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          onClick={handleSwapOnClick}
          label={t('swap')}
          tooltipRender={null}
        />
      )}

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        isBridgeChain && (
          <IconButton
            className="token-overview__button"
            data-testid="token-overview-bridge"
            Icon={
              <Icon
                name={IconName.Bridge}
                color={IconColor.primaryInverse}
                size={IconSize.Sm}
              />
            }
            label={t('bridge')}
            onClick={() => handleBridgeOnClick(false)}
            tooltipRender={null}
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

export default TokenButtons;
