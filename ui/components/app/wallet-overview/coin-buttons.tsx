import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { toHex } from '@metamask/controller-utils';
import { isCaipChainId, CaipChainId } from '@metamask/utils';

///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
///: END:ONLY_INCLUDE_IF
import { ChainId } from '../../../../shared/constants/network';

import { I18nContext } from '../../../contexts/i18n';
import {
  PREPARE_SWAP_ROUTE,
  SEND_ROUTE,
} from '../../../helpers/constants/routes';
import {
  SwapsEthToken,
  getCurrentKeyring,
  getUseExternalServices,
  getNetworkConfigurationIdByChainId,
  isNonEvmAccount,
} from '../../../selectors';
import Tooltip from '../../ui/tooltip';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { startNewDraftTransaction } from '../../../ducks/send';
import {
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, Icon, IconName, IconSize } from '../../component-library';
import IconButton from '../../ui/icon-button';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import useBridging from '../../../hooks/bridge/useBridging';
import {
  getIsUnifiedUIEnabled,
  type BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { ReceiveModal } from '../../multichain/receive-modal';
import {
  setSwitchedNetworkDetails,
  setActiveNetworkWithError,
} from '../../../store/actions';
import {
  getMultichainNativeCurrency,
  getMultichainNetwork,
} from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
///: END:ONLY_INCLUDE_IF
import { trace, TraceName } from '../../../../shared/lib/trace';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { useHandleSendNonEvm } from './hooks/useHandleSendNonEvm';
///: END:ONLY_INCLUDE_IF

type CoinButtonsProps = {
  account: InternalAccount;
  chainId: `0x${string}` | CaipChainId | number;
  trackingLocation: string;
  isSwapsChain: boolean;
  isSigningEnabled: boolean;
  isBridgeChain: boolean;
  isBuyableChain: boolean;
  defaultSwapsToken?: SwapsEthToken;
  classPrefix?: string;
  iconButtonClassName?: string;
};

const CoinButtons = ({
  account,
  chainId,
  trackingLocation,
  isSwapsChain,
  isSigningEnabled,
  isBridgeChain,
  isBuyableChain,
  defaultSwapsToken,
  classPrefix = 'coin',
}: CoinButtonsProps) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const trackEvent = useContext(MetaMetricsContext);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const { address: selectedAddress } = account;
  const history = useHistory();
  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;
  const currentChainId = useSelector(getCurrentChainId);
  const displayNewIconButtons = process.env.REMOVE_GNS;

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const handleSendNonEvm = useHandleSendNonEvm();
  ///: END:ONLY_INCLUDE_IF

  const location = useLocation();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  // Initially, those events were using a "ETH" as `token_symbol`, so we keep this behavior
  // for EVM, no matter the currently selected native token (e.g. SepoliaETH if you are on Sepolia
  // network).
  const { isEvmNetwork, chainId: multichainChainId } = useMultichainSelector(
    getMultichainNetwork,
    account,
  );
  const multichainNativeToken = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );
  const nativeToken = isEvmNetwork ? 'ETH' : multichainNativeToken;

  const isExternalServicesEnabled = useSelector(getUseExternalServices);

  const isNonEvmAccountWithoutExternalServices =
    !isExternalServicesEnabled && isNonEvmAccount(account);

  const buttonTooltips = {
    buyButton: [{ condition: !isBuyableChain, message: '' }],
    sendButton: [
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    swapButton: [
      { condition: !isSwapsChain, message: 'currentlyUnavailable' },
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    bridgeButton: [
      { condition: !isBridgeChain, message: 'currentlyUnavailable' },
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
  };

  const generateTooltip = (
    buttonKey: keyof typeof buttonTooltips,
    contents: React.ReactElement,
  ) => {
    const conditions = buttonTooltips[buttonKey];
    const tooltipInfo = conditions.find(({ condition }) => condition);
    if (tooltipInfo?.message) {
      return (
        <Tooltip
          title={t(tooltipInfo.message)}
          position="bottom"
          wrapperClassName="tooltip-button-wrapper"
        >
          {contents}
        </Tooltip>
      );
    }
    return contents;
  };

  const getChainId = (): CaipChainId | ChainId => {
    if (isCaipChainId(chainId)) {
      return chainId as CaipChainId;
    }
    // Otherwise we assume that's an EVM chain ID, so use the usual 0x prefix
    return toHex(chainId) as ChainId;
  };

  const getSnapAccountMetaMetricsPropertiesIfAny = (
    internalAccount: InternalAccount,
  ): { snap_id?: string } => {
    // Some accounts might be Snap accounts, in this case we add some extra properties
    // to the metrics:
    const snapId = internalAccount.metadata.snap?.id;
    if (snapId) {
      return {
        snap_id: snapId,
      };
    }

    // If the account is not a Snap account or that we could not get the Snap ID for
    // some reason, we don't add any extra property.
    return {};
  };

  const { openBuyCryptoInPdapp } = useRamps();

  const { openBridgeExperience } = useBridging();

  const isUnifiedUIEnabled = useSelector((state: BridgeAppState) =>
    getIsUnifiedUIEnabled(state, chainId),
  );

  const setCorrectChain = useCallback(async () => {
    if (currentChainId !== chainId && multichainChainId !== chainId) {
      try {
        const networkConfigurationId = networks[chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
        await dispatch(
          setSwitchedNetworkDetails({
            networkClientId: networkConfigurationId,
          }),
        );
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${chainId}, Current chainId: ${currentChainId}.
        ${err}`);
        throw err;
      }
    }
  }, [currentChainId, chainId, networks, dispatch]);

  const handleSendOnClick = useCallback(async () => {
    trackEvent(
      {
        event: MetaMetricsEventName.NavSendButtonClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          account_type: account.type,
          token_symbol: nativeToken,
          location: 'Home',
          text: 'Send',
          chain_id: chainId,
          ...getSnapAccountMetaMetricsPropertiesIfAny(account),
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

    // Native Send flow
    await setCorrectChain();
    await dispatch(startNewDraftTransaction({ type: AssetType.native }));
    history.push(SEND_ROUTE);
  }, [
    chainId,
    account,
    setCorrectChain,
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    handleSendNonEvm,
    ///: END:ONLY_INCLUDE_IF
  ]);

  const handleBuyAndSellOnClick = useCallback(() => {
    openBuyCryptoInPdapp(getChainId());
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        account_type: account.type,
        location: 'Home',
        text: 'Buy',
        chain_id: chainId,
        token_symbol: defaultSwapsToken,
        ...getSnapAccountMetaMetricsPropertiesIfAny(account),
      },
    });
  }, [chainId, defaultSwapsToken]);

  const handleBridgeOnClick = useCallback(
    async (isSwap: boolean) => {
      if (!defaultSwapsToken) {
        return;
      }
      await setCorrectChain();
      openBridgeExperience(
        MetaMetricsSwapsEventSource.MainView,
        defaultSwapsToken,
        location.pathname.includes('asset') ? '&token=native' : '',
        isSwap,
      );
    },
    [defaultSwapsToken, location, openBridgeExperience],
  );

  const handleSwapOnClick = useCallback(async () => {
    if (isUnifiedUIEnabled) {
      handleBridgeOnClick(true);
      return;
    }
    ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
    if (multichainChainId === MultichainNetworks.SOLANA) {
      handleBridgeOnClick(true);
      return;
    }
    ///: END:ONLY_INCLUDE_IF

    await setCorrectChain();

    if (isSwapsChain) {
      trackEvent({
        event: MetaMetricsEventName.NavSwapButtonClicked,
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          token_symbol: 'ETH',
          location: MetaMetricsSwapsEventSource.MainView,
          text: 'Swap',
          chain_id: chainId,
        },
      });
      dispatch(setSwapsFromToken(defaultSwapsToken));
      if (usingHardwareWallet) {
        if (global.platform.openExtensionInBrowser) {
          global.platform.openExtensionInBrowser(PREPARE_SWAP_ROUTE);
        }
      } else {
        history.push(PREPARE_SWAP_ROUTE);
      }
    }
  }, [
    setCorrectChain,
    isSwapsChain,
    chainId,
    isUnifiedUIEnabled,
    usingHardwareWallet,
    defaultSwapsToken,
  ]);

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      gap={3}
    >
      {
        <IconButton
          className={`${classPrefix}-overview__button`}
          Icon={
            displayNewIconButtons ? (
              <Icon
                name={IconName.Money}
                color={IconColor.iconAlternative}
                size={IconSize.Md}
              />
            ) : (
              <Icon
                name={IconName.PlusAndMinus}
                color={IconColor.iconDefault}
                size={IconSize.Sm}
              />
            )
          }
          disabled={!isBuyableChain}
          data-testid={`${classPrefix}-overview-buy`}
          label={t('buyAndSell')}
          onClick={handleBuyAndSellOnClick}
          width={BlockSize.Full}
          tooltipRender={(contents: React.ReactElement) =>
            generateTooltip('buyButton', contents)
          }
          round={!displayNewIconButtons}
        />
      }
      <IconButton
        className={`${classPrefix}-overview__button`}
        disabled={
          (!isSwapsChain && !isUnifiedUIEnabled) ||
          !isSigningEnabled ||
          !isExternalServicesEnabled
        }
        Icon={
          displayNewIconButtons ? (
            <Icon
              name={IconName.SwapHorizontal}
              color={IconColor.iconAlternative}
              size={IconSize.Md}
            />
          ) : (
            <Icon
              name={IconName.SwapHorizontal}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
            />
          )
        }
        onClick={handleSwapOnClick}
        label={t('swap')}
        data-testid="token-overview-button-swap"
        width={BlockSize.Full}
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('swapButton', contents)
        }
        round={!displayNewIconButtons}
      />
      {/* the bridge button is redundant if unified ui is enabled */}
      {process.env.REMOVE_GNS || isUnifiedUIEnabled ? null : (
        <IconButton
          className={`${classPrefix}-overview__button`}
          disabled={
            !isBridgeChain ||
            !isSigningEnabled ||
            isNonEvmAccountWithoutExternalServices
          }
          data-testid={`${classPrefix}-overview-bridge`}
          Icon={
            displayNewIconButtons ? (
              <Icon
                name={IconName.Bridge}
                color={IconColor.iconAlternative}
                size={IconSize.Md}
              />
            ) : (
              <Icon
                name={IconName.Bridge}
                color={IconColor.iconDefault}
                size={IconSize.Sm}
              />
            )
          }
          label={t('bridge')}
          onClick={() => handleBridgeOnClick(false)}
          width={BlockSize.Full}
          tooltipRender={(contents: React.ReactElement) =>
            generateTooltip('bridgeButton', contents)
          }
          round={!displayNewIconButtons}
        />
      )}
      <IconButton
        className={`${classPrefix}-overview__button`}
        data-testid={`${classPrefix}-overview-send`}
        Icon={
          displayNewIconButtons ? (
            <Icon
              name={IconName.Send}
              color={IconColor.iconAlternative}
              size={IconSize.Md}
            />
          ) : (
            <Icon
              name={IconName.Arrow2UpRight}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
            />
          )
        }
        disabled={!isSigningEnabled || isNonEvmAccountWithoutExternalServices}
        label={t('send')}
        onClick={handleSendOnClick}
        width={BlockSize.Full}
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('sendButton', contents)
        }
        round={!displayNewIconButtons}
      />
      {
        <>
          {showReceiveModal && (
            <ReceiveModal
              address={selectedAddress}
              onClose={() => setShowReceiveModal(false)}
            />
          )}
          <IconButton
            className={`${classPrefix}-overview__button`}
            data-testid={`${classPrefix}-overview-receive`}
            Icon={
              displayNewIconButtons ? (
                <Icon
                  name={IconName.QrCode}
                  color={IconColor.iconAlternative}
                  size={IconSize.Md}
                />
              ) : (
                <Icon
                  name={IconName.ScanBarcode}
                  color={IconColor.iconDefault}
                  size={IconSize.Sm}
                />
              )
            }
            label={t('receive')}
            width={BlockSize.Full}
            onClick={() => {
              trace({ name: TraceName.ReceiveModal });
              trackEvent({
                event: MetaMetricsEventName.NavReceiveButtonClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  text: 'Receive',
                  location: trackingLocation,
                  chain_id: chainId,
                },
              });
              setShowReceiveModal(true);
            }}
            round={!displayNewIconButtons}
          />
        </>
      }
    </Box>
  );
};

export default CoinButtons;
