import React, {
  useCallback,
  useContext,
  useState,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  useEffect,
  ///: END:ONLY_INCLUDE_IF
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IF
} from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { toHex } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IF
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  isCaipChainId,
  ///: END:ONLY_INCLUDE_IF
  CaipChainId,
} from '@metamask/utils';

///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { SnapId } from '@metamask/snaps-sdk';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { ChainId } from '../../../../shared/constants/network';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import { I18nContext } from '../../../contexts/i18n';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  CONFIRMATION_V_NEXT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  PREPARE_SWAP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  SEND_ROUTE,
} from '../../../helpers/constants/routes';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  SwapsEthToken,
  getCurrentKeyring,
  ///: END:ONLY_INCLUDE_IF
  getUseExternalServices,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  getMemoizedUnapprovedTemplatedConfirmations,
  ///: END:ONLY_INCLUDE_IF
  getNetworkConfigurationIdByChainId,
} from '../../../selectors';
import Tooltip from '../../ui/tooltip';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
///: END:ONLY_INCLUDE_IF
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  MetaMetricsSwapsEventSource,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { startNewDraftTransaction } from '../../../ducks/send';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, Icon, IconName, IconSize } from '../../component-library';
import IconButton from '../../ui/icon-button';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import useBridging from '../../../hooks/bridge/useBridging';
///: END:ONLY_INCLUDE_IF
import { ReceiveModal } from '../../multichain/receive-modal';
import {
  setSwitchedNetworkDetails,
  setActiveNetworkWithError,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  sendMultichainTransaction,
  setDefaultHomeActiveTabName,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { isMultichainWalletSnap } from '../../../../shared/lib/accounts/snaps';
///: END:ONLY_INCLUDE_IF
import {
  getMultichainIsEvm,
  getMultichainNativeCurrency,
} from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';

type CoinButtonsProps = {
  account: InternalAccount;
  chainId: `0x${string}` | CaipChainId | number;
  trackingLocation: string;
  isSwapsChain: boolean;
  isSigningEnabled: boolean;
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  isBridgeChain: boolean;
  isBuyableChain: boolean;
  defaultSwapsToken?: SwapsEthToken;
  ///: END:ONLY_INCLUDE_IF
  classPrefix?: string;
  iconButtonClassName?: string;
};

const CoinButtons = ({
  account,
  chainId,
  trackingLocation,
  isSwapsChain,
  isSigningEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  isBridgeChain,
  isBuyableChain,
  defaultSwapsToken,
  ///: END:ONLY_INCLUDE_IF
  classPrefix = 'coin',
  iconButtonClassName = '',
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const currentActivityTabName = useSelector(
    // @ts-expect-error TODO: fix state type
    (state) => state.metamask.defaultHomeActiveTabName,
  );
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  ///: END:ONLY_INCLUDE_IF

  // Initially, those events were using a "ETH" as `token_symbol`, so we keep this behavior
  // for EVM, no matter the currently selected native token (e.g. SepoliaETH if you are on Sepolia
  // network).
  const isEvm = useMultichainSelector(getMultichainIsEvm, account);
  const multichainNativeToken = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );
  const nativeToken = isEvm ? 'ETH' : multichainNativeToken;

  const isExternalServicesEnabled = useSelector(getUseExternalServices);

  const buttonTooltips = {
    buyButton: [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      { condition: !isBuyableChain, message: '' },
      ///: END:ONLY_INCLUDE_IF
    ],
    sendButton: [
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    swapButton: [
      { condition: !isSwapsChain, message: 'currentlyUnavailable' },
      { condition: !isSigningEnabled, message: 'methodNotSupported' },
    ],
    bridgeButton: [
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      { condition: !isBridgeChain, message: 'currentlyUnavailable' },
      ///: END:ONLY_INCLUDE_IF
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
        <Tooltip title={t(tooltipInfo.message)} position="bottom">
          {contents}
        </Tooltip>
      );
    }
    return contents;
  };

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const getChainId = (): CaipChainId | ChainId => {
    if (isCaipChainId(chainId)) {
      return chainId as CaipChainId;
    }
    // Otherwise we assume that's an EVM chain ID, so use the usual 0x prefix
    return toHex(chainId) as ChainId;
  };
  ///: END:ONLY_INCLUDE_IF

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

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);

  const portfolioEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };

  const stakingEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };

  const handleMmiStakingOnClick = useCallback(() => {
    stakingEvent();
    global.platform.openTab({
      url: `${mmiPortfolioUrl}/stake`,
    });
  }, [mmiPortfolioUrl]);

  const handleMmiPortfolioOnClick = useCallback(() => {
    portfolioEvent();
    global.platform.openTab({
      url: mmiPortfolioUrl,
    });
  }, [mmiPortfolioUrl]);

  const renderInstitutionalButtons = () => {
    return (
      <>
        <IconButton
          className={`${classPrefix}-overview__button`}
          iconButtonClassName={iconButtonClassName}
          Icon={
            <Icon
              name={IconName.Stake}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          label={t('stake')}
          onClick={handleMmiStakingOnClick}
        />
        {mmiPortfolioEnabled && (
          <IconButton
            className={`${classPrefix}-overview__button`}
            iconButtonClassName={iconButtonClassName}
            Icon={
              <Icon
                name={IconName.Diagram}
                color={IconColor.primaryInverse}
                size={IconSize.Sm}
              />
            }
            label={t('portfolio')}
            onClick={handleMmiPortfolioOnClick}
          />
        )}
      </>
    );
  };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const { openBuyCryptoInPdapp } = useRamps();

  const { openBridgeExperience } = useBridging();
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );

  useEffect(() => {
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => {
        return (
          approval.type === 'snap_dialog' &&
          account.metadata.snap &&
          account.metadata.snap.id === approval.origin &&
          isMultichainWalletSnap(account.metadata.snap.id as SnapId)
        );
      },
    );

    if (templatedSnapApproval) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, history, account]);
  ///: END:ONLY_INCLUDE_IF

  const setCorrectChain = useCallback(async () => {
    if (currentChainId !== chainId) {
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

    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    if (!isEvmAccountType(account.type)) {
      // Non-EVM (Snap) Send flow
      if (!account.metadata.snap) {
        throw new Error('Non-EVM needs to be Snap accounts');
      }

      // TODO: Remove this once we want to enable all non-EVM Snaps
      if (!isMultichainWalletSnap(account.metadata.snap.id as SnapId)) {
        throw new Error(
          `Non-EVM Snap is not whitelisted: ${account.metadata.snap.id}`,
        );
      }

      try {
        // FIXME: We switch the tab before starting the send flow (we
        // faced some inconsistencies when changing it after).
        await dispatch(setDefaultHomeActiveTabName('activity'));
        await sendMultichainTransaction(account.metadata.snap.id, {
          account: account.id,
          scope: chainId as CaipChainId,
        });
      } catch {
        // Restore the previous tab in case of any error (see FIXME comment above).
        await dispatch(setDefaultHomeActiveTabName(currentActivityTabName));
      }

      // Early return, not to let the non-EVM flow slip into the native send flow.
      return;
    }
    ///: END:ONLY_INCLUDE_IF

    // Native Send flow
    await setCorrectChain();
    await dispatch(startNewDraftTransaction({ type: AssetType.native }));
    history.push(SEND_ROUTE);
  }, [chainId, account, setCorrectChain]);

  const handleSwapOnClick = useCallback(async () => {
    await setCorrectChain();
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    global.platform.openTab({
      url: `${mmiPortfolioUrl}/swap`,
    });
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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
    ///: END:ONLY_INCLUDE_IF
  }, [
    setCorrectChain,
    isSwapsChain,
    chainId,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    usingHardwareWallet,
    defaultSwapsToken,
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiPortfolioUrl,
    ///: END:ONLY_INCLUDE_IF
  ]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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

  const handleBridgeOnClick = useCallback(() => {
    if (!defaultSwapsToken) {
      return;
    }
    openBridgeExperience(
      'Home',
      defaultSwapsToken,
      location.pathname.includes('asset') ? '&token=native' : '',
    );
  }, [defaultSwapsToken, location, openBridgeExperience]);
  ///: END:ONLY_INCLUDE_IF

  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceEvenly}>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <IconButton
          className={`${classPrefix}-overview__button`}
          iconButtonClassName={iconButtonClassName}
          Icon={
            <Icon
              name={IconName.PlusMinus}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          disabled={!isBuyableChain}
          data-testid={`${classPrefix}-overview-buy`}
          label={t('buyAndSell')}
          onClick={handleBuyAndSellOnClick}
          tooltipRender={(contents: React.ReactElement) =>
            generateTooltip('buyButton', contents)
          }
        />
        ///: END:ONLY_INCLUDE_IF
      }

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        renderInstitutionalButtons()
        ///: END:ONLY_INCLUDE_IF
      }
      <IconButton
        className={`${classPrefix}-overview__button`}
        iconButtonClassName={iconButtonClassName}
        disabled={
          !isSwapsChain || !isSigningEnabled || !isExternalServicesEnabled
        }
        Icon={
          <Icon
            name={IconName.SwapHorizontal}
            color={IconColor.primaryInverse}
            size={IconSize.Sm}
          />
        }
        onClick={handleSwapOnClick}
        label={t('swap')}
        data-testid="token-overview-button-swap"
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('swapButton', contents)
        }
      />
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <IconButton
          className={`${classPrefix}-overview__button`}
          iconButtonClassName={iconButtonClassName}
          disabled={!isBridgeChain || !isSigningEnabled}
          data-testid={`${classPrefix}-overview-bridge`}
          Icon={
            <Icon
              name={IconName.Bridge}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          label={t('bridge')}
          onClick={handleBridgeOnClick}
          tooltipRender={(contents: React.ReactElement) =>
            generateTooltip('bridgeButton', contents)
          }
        />
        ///: END:ONLY_INCLUDE_IF
      }
      <IconButton
        className={`${classPrefix}-overview__button`}
        iconButtonClassName={iconButtonClassName}
        data-testid={`${classPrefix}-overview-send`}
        Icon={
          <Icon
            name={IconName.Arrow2UpRight}
            color={IconColor.primaryInverse}
            size={IconSize.Sm}
          />
        }
        disabled={!isSigningEnabled}
        label={t('send')}
        onClick={handleSendOnClick}
        tooltipRender={(contents: React.ReactElement) =>
          generateTooltip('sendButton', contents)
        }
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
            iconButtonClassName={iconButtonClassName}
            data-testid={`${classPrefix}-overview-receive`}
            Icon={
              <Icon
                name={IconName.ScanBarcode}
                color={IconColor.primaryInverse}
                size={IconSize.Sm}
              />
            }
            label={t('receive')}
            onClick={() => {
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
          />
        </>
      }
    </Box>
  );
};

export default CoinButtons;
