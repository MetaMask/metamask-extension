import React, { useCallback, useContext, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toHex } from '@metamask/controller-utils';
import {
  isCaipChainId,
  CaipChainId,
  isCaipAssetType,
  parseCaipAssetType,
} from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';

import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  ButtonBase,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ChainId } from '../../../../shared/constants/network';
import { transitionForward } from '../../ui/transition';

import { I18nContext } from '../../../contexts/i18n';

import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  AddressListQueryParams,
  AddressListSource,
} from '../../../pages/multichain-accounts/multichain-account-address-list-page';
import {
  getUseExternalServices,
  getNetworkConfigurationIdByChainId,
  getSwapsDefaultToken,
} from '../../../selectors';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import Tooltip from '../../ui/tooltip';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Tag,
  TagProps,
} from '../../component-library';
import IconButton from '../../ui/icon-button';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import useBridging from '../../../hooks/bridge/useBridging';
import { ReceiveModal } from '../../multichain/receive-modal';
import { Toast, ToastContainer } from '../../multichain/toast';
import { setActiveNetworkWithError } from '../../../store/actions';
import {
  getMultichainNativeCurrency,
  getMultichainNetwork,
} from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getCurrentChainId } from '../../../../shared/lib/selectors/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../../shared/constants/bridge';
import { trace, TraceName } from '../../../../shared/lib/trace';
import { navigateToSendRoute } from '../../../pages/confirmations/utils/send';
import { useOnClickOutside } from '../perps/hooks/useClickOutside';
import { useBatchSell } from '../../../hooks/batch-sell/useBatchSell';
import { useHandleSendNonEvm } from './hooks/useHandleSendNonEvm';

type MoreButtonsGroupProps<TagElem extends React.ElementType = 'div'> = {
  classPrefix?: string;
  onClick: () => void;
  modalIsOpen: boolean;
  actions: {
    label: string;
    onClick: () => void;
    testId?: string;
    iconName: IconName;
    tagProps?: TagProps<TagElem>;
  }[];
};

const MoreButtonsGroup = ({
  actions,
  classPrefix,
  onClick,
  modalIsOpen,
}: MoreButtonsGroupProps) => {
  const t = useContext(I18nContext);

  return (
    <>
      <IconButton
        className={`${classPrefix}-overview__button`}
        data-testid={`${classPrefix}-overview-more`}
        Icon={
          <Icon
            name={IconName.MoreHorizontal}
            color={IconColor.iconAlternative}
            size={IconSize.Md}
          />
        }
        label={t('moreCapital')}
        width={BlockSize.Full}
        onClick={onClick}
      />
      {modalIsOpen && (
        <Box className="flex flex-col absolute right-0 top-full z-10 mt-4 min-w-[120px] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg">
          {actions.map((action) => (
            <ButtonBase
              key={action.label}
              className="text-left rounded-none px-4 py-3 bg-transparent min-w-0 flex w-full items-center h-auto hover:bg-hover active:bg-pressed"
              onClick={action.onClick}
              data-testid={action.testId}
            >
              <Icon
                name={action.iconName}
                color={IconColor.iconAlternative}
                size={IconSize.Md}
              />
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
                textAlign={TextAlign.Left}
                className="pl-4 pr-2 flex-1"
              >
                {action.label}
              </Text>
              {action.tagProps && <Tag {...action.tagProps} />}
            </ButtonBase>
          ))}
        </Box>
      )}
    </>
  );
};

const TabOpenedToast = ({ onClose }: { onClose: () => void }) => {
  const t = useContext(I18nContext);

  return (
    <ToastContainer>
      <Toast
        startAdornment={
          <Icon name={IconName.Export} color={IconColor.iconDefault} />
        }
        text={t('buyTabOpenedToastText')}
        description={t('buyTabOpenedToastDescription')}
        onClose={onClose}
        autoHideTime={3000}
        onAutoHideToast={onClose}
      />
    </ToastContainer>
  );
};

type CoinButtonsProps = {
  account: InternalAccount;
  chainId: `0x${string}` | CaipChainId | number;
  trackingLocation: string;
  isSwapsChain: boolean;
  isSigningEnabled: boolean;
  isBuyableChain: boolean;
  classPrefix?: string;
  /** When true, disables the send button for non-EVM chains (used on asset page) */
  disableSendForNonEvm?: boolean;
};

const CoinButtons = ({
  account,
  chainId,
  trackingLocation,
  isSwapsChain,
  isSigningEnabled,
  isBuyableChain,
  classPrefix = 'coin',
  disableSendForNonEvm = false,
}: CoinButtonsProps) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const { trackEvent } = useContext(MetaMetricsContext);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTabOpenedToast, setShowTabOpenedToast] = useState(false);

  const { address: selectedAddress } = account;
  const navigate = useNavigate();
  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;
  const currentChainId = useSelector(getCurrentChainId);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);

  const defaultSwapsToken = useSelector((state) =>
    getSwapsDefaultToken(state, chainId.toString()),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMoreOptionsDropdownOpen, setIsMoreOptionsDropdownOpen] =
    useState(false);

  // Pre-conditions
  if (isSwapsChain && defaultSwapsToken === undefined) {
    throw new Error('defaultSwapsToken is required');
  }

  const handleSendNonEvm = useHandleSendNonEvm();

  const location = useLocation();

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
  const normalizedChainId = isCaipChainId(chainId) ? chainId : toHex(chainId);
  const isEvmAsset = isEvmChainId(normalizedChainId);

  const buttonTooltips = {
    buyButton: [{ condition: !isBuyableChain, message: '' }],
    sendButton: [
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
      {
        condition:
          disableSendForNonEvm && !isEvmAsset && !isExternalServicesEnabled,
        message: 'currentlyUnavailable',
      },
    ],
    swapButton: [
      {
        condition: !isExternalServicesEnabled,
        message: 'currentlyUnavailable',
      },
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    bridgeButton: [
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
  ): { snap_id?: string } => {
    // Some accounts might be Snap accounts, in this case we add some extra properties
    // to the metrics:
    const snapId = internalAccount.metadata.snap?.id;
    if (snapId) {
      return {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: snapId,
      };
    }

    // If the account is not a Snap account or that we could not get the Snap ID for
    // some reason, we don't add any extra property.
    return {};
  };

  const { openBuyCryptoInPdapp } = useRamps();

  const { openBridgeExperience } = useBridging();

  const { openBatchSellExperience } = useBatchSell();

  const handleMoreOptionsButtonClick = useCallback(() => {
    setIsMoreOptionsDropdownOpen((prev) => !prev);
  }, []);

  const setCorrectChain = useCallback(async () => {
    if (currentChainId !== chainId && multichainChainId !== chainId) {
      try {
        const networkConfigurationId = networks[chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${chainId}, Current chainId: ${currentChainId}.
        ${
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          err
        }`);
        throw err;
      }
    }
  }, [currentChainId, multichainChainId, chainId, networks, dispatch]);

  const handleSendOnClick = useCallback(async () => {
    trackEvent(
      {
        event: MetaMetricsEventName.SendStarted,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: account.type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: nativeToken,
          location: 'Home',
          text: 'Send',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
          ...getSnapAccountMetaMetricsPropertiesIfAny(account),
        },
      },
      { excludeMetaMetricsId: false },
    );

    // Native Send flow
    await setCorrectChain();
    const params =
      trackingLocation === 'home' ? undefined : { chainId: chainId.toString() };
    transitionForward(() => navigateToSendRoute(navigate, params));
  }, [chainId, account, setCorrectChain, handleSendNonEvm, trackingLocation]);

  const handleBuyAndSellOnClick = useCallback(() => {
    setShowTabOpenedToast(true);
    openBuyCryptoInPdapp(getChainId());
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: account.type,
        location: 'Home',
        text: 'Buy',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: defaultSwapsToken,
        ...getSnapAccountMetaMetricsPropertiesIfAny(account),
      },
    });
  }, [chainId, defaultSwapsToken]);

  const handleSwapOnClick = useCallback(async () => {
    // Determine the chainId to use in the Swap experience using the url
    const urlSuffix = location.pathname.split('/').filter(Boolean).at(-1);
    const hexChainOrAssetId = urlSuffix
      ? decodeURIComponent(urlSuffix)
      : undefined;
    const chainIdToUse = isCaipAssetType(hexChainOrAssetId)
      ? parseCaipAssetType(hexChainOrAssetId).chainId
      : hexChainOrAssetId;

    // Handle clicking from the wallet or native asset overview page
    transitionForward(() =>
      openBridgeExperience(
        MetaMetricsSwapsEventSource.MainView,
        chainIdToUse && ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainIdToUse)
          ? getNativeAssetForChainId(chainIdToUse)
          : undefined,
      ),
    );
  }, [location, openBridgeExperience]);

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent({
      event: MetaMetricsEventName.NavReceiveButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        text: 'Receive',
        location: trackingLocation,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
      },
    });

    if (selectedAccountGroup) {
      // Navigate to the multichain address list page with receive source
      transitionForward(() =>
        navigate(
          `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}?accountGroupId=${encodeURIComponent(selectedAccountGroup)}&${AddressListQueryParams.Source}=${AddressListSource.Receive}`,
        ),
      );
    } else {
      // Show the traditional receive modal
      setShowReceiveModal(true);
    }
  }, [selectedAccountGroup, navigate, trackEvent, trackingLocation, chainId]);

  const handleBatchSellOnClick = useCallback(() => {
    trace({ name: TraceName.BatchSellModal });
    trackEvent({
      event: MetaMetricsEventName.NavBatchSellButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        text: 'Batch Sell',
        location: trackingLocation,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
      },
    });

    transitionForward(() => openBatchSellExperience());
  }, [trackEvent, trackingLocation, chainId, openBatchSellExperience]);

  useOnClickOutside({
    containerRef,
    onClickOutside: () => setIsMoreOptionsDropdownOpen(false),
    active: isMoreOptionsDropdownOpen,
  });

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      gap={3}
      className="relative"
      ref={containerRef}
    >
      <IconButton
        className={`${classPrefix}-overview__button`}
        Icon={
          <Icon
            name={IconName.Dollar}
            color={IconColor.iconAlternative}
            size={IconSize.Md}
          />
        }
        disabled={!isBuyableChain}
        data-testid={`${classPrefix}-overview-buy`}
        label={t('buy')}
        onClick={handleBuyAndSellOnClick}
        width={BlockSize.Full}
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('buyButton', contents)
        }
      />
      <IconButton
        className={`${classPrefix}-overview__button`}
        disabled={!isSigningEnabled || !isExternalServicesEnabled}
        Icon={
          <Icon
            name={IconName.SwapVertical}
            color={IconColor.iconAlternative}
            size={IconSize.Md}
          />
        }
        onClick={handleSwapOnClick}
        label={t('swap')}
        data-testid={`${classPrefix}-overview-swap`}
        width={BlockSize.Full}
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('swapButton', contents)
        }
      />
      <IconButton
        className={`${classPrefix}-overview__button`}
        data-testid={`${classPrefix}-overview-send`}
        Icon={
          <Icon
            name={IconName.Send}
            color={IconColor.iconAlternative}
            size={IconSize.Md}
          />
        }
        disabled={
          !isSigningEnabled ||
          (disableSendForNonEvm && !isEvmAsset && !isExternalServicesEnabled)
        }
        label={t('send')}
        onClick={handleSendOnClick}
        width={BlockSize.Full}
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('sendButton', contents)
        }
      />
      {showReceiveModal && (
        <ReceiveModal
          address={selectedAddress}
          onClose={() => setShowReceiveModal(false)}
        />
      )}

      <MoreButtonsGroup
        onClick={handleMoreOptionsButtonClick}
        modalIsOpen={isMoreOptionsDropdownOpen}
        classPrefix={classPrefix}
        actions={[
          {
            label: t('batchSell'),
            onClick: handleBatchSellOnClick,
            testId: `${classPrefix}-overview-batchSell`,
            iconName: IconName.Received,
            tagProps: {
              label: t('perpsFilterNew'),
              labelProps: {
                color: IconColor.primaryDefault,
              },
              backgroundColor: BackgroundColor.primaryMuted,
            },
          },
          {
            label: t('receive'),
            onClick: handleReceiveOnClick,
            testId: `${classPrefix}-overview-receive`,
            iconName: IconName.Received,
          },
        ]}
      />

      {showTabOpenedToast && (
        <TabOpenedToast onClose={() => setShowTabOpenedToast(false)} />
      )}
    </Box>
  );
};

export default CoinButtons;
