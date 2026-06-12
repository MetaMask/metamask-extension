/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { SECOND } from '../../../../shared/constants/time';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { PRIVACY_POLICY_LINK } from '../../../../shared/lib/ui-utils';
import {
  BorderRadius,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  PERPS_ROUTE,
  REVEAL_SEED_ROUTE,
  REVIEW_PERMISSIONS,
  SETTINGS_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../../helpers/constants/routes';
import { getURLHost } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentNetwork, getOriginOfCurrentTab } from '../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  hidePermittedNetworkToast,
  toggleDefaultView,
} from '../../../store/actions';
import { Icon, IconName, IconSize } from '../../component-library';
import { Toast, ToastContainer } from '../../multichain';
import { SurveyToast } from '../../ui/survey-toast';
import { StorageWriteErrorType } from '../../../../shared/constants/app-state';
import { MerklClaimToast, MusdConversionToast } from '../musd';
import { PerpsWithdrawToast } from '../perps/perps-withdraw-toast';
import { getDappActiveNetwork } from '../../../selectors/dapp';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { getShortDateFormatterV2 } from '../../../pages/asset/util';
import {
  getIsShieldSubscriptionEndingSoon,
  getIsShieldSubscriptionPaused,
  getSubscriptionPaymentData,
} from '../../../../shared/lib/shield';
import {
  isCardPaymentMethod,
  isCryptoPaymentMethod,
} from '../../../pages/shield/transaction-shield/types';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../../shared/constants/subscriptions';
import {
  selectShowPrivacyPolicyToast,
  selectShowShieldPausedToast,
  selectShowShieldEndingToast,
  selectShowStorageErrorToast,
  selectStorageWriteErrorType,
  selectShowInfuraSwitchToast,
  selectShowSidePanelMigrationToast,
} from './selectors';
import {
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
  setShowInfuraSwitchToast,
  setShieldPausedToastLastClickedOrClosed,
  setShieldEndingToastLastClickedOrClosed,
  dismissSidePanelMigrationToast,
} from './utils';

export function ToastMaster() {
  const location = useLocation();

  // Check if storage error toast should be shown (needed for conditional rendering on other screens)
  // The selector includes all conditions: flag is true, onboarding complete, and unlocked
  const shouldShowStorageErrorToast = useSelector(selectShowStorageErrorToast);

  // Get current pathname from React Router
  const currentPathname = location?.pathname ?? DEFAULT_ROUTE;
  const onHomeScreen = currentPathname === DEFAULT_ROUTE;
  const onPerpsScreen = currentPathname.startsWith(PERPS_ROUTE);
  const onSettingsScreen = currentPathname.startsWith(SETTINGS_ROUTE);

  // Storage error toast should show on ALL screens
  const storageErrorToast = <StorageErrorToast />;

  if (onHomeScreen) {
    return (
      <ToastContainer>
        {storageErrorToast}
        <SurveyToast />
        <PrivacyPolicyToast />
        <PermittedNetworkToast />
        <InfuraSwitchToast />
        <MerklClaimToast />
        <MusdConversionToast />
        <PerpsWithdrawToast />
        <ShieldPausedToast />
        <ShieldEndingToast />
        <SidePanelMigrationToast />
      </ToastContainer>
    );
  }

  if (onPerpsScreen) {
    return (
      <ToastContainer>
        {storageErrorToast}
        <PerpsWithdrawToast />
      </ToastContainer>
    );
  }

  if (onSettingsScreen) {
    return <ToastContainer>{storageErrorToast}</ToastContainer>;
  }

  // On other screens, only render ToastContainer if storage error toast should show
  // ToastContainer provides essential CSS styling (position: fixed, z-index, etc.)
  if (shouldShowStorageErrorToast) {
    return <ToastContainer>{storageErrorToast}</ToastContainer>;
  }

  return null;
}

function PrivacyPolicyToast() {
  const t = useI18nContext();

  const { showPrivacyPolicyToast, newPrivacyPolicyToastShownDate } =
    useSelector(selectShowPrivacyPolicyToast);

  // If the privacy policy toast is shown, and there is no date set, set it
  if (showPrivacyPolicyToast && !newPrivacyPolicyToastShownDate) {
    setNewPrivacyPolicyToastShownDate(Date.now());
  }

  return (
    showPrivacyPolicyToast && (
      <Toast
        key="privacy-policy-toast"
        startAdornment={
          <Icon name={IconName.Info} color={IconColor.iconDefault} />
        }
        text={t('newPrivacyPolicyTitle')}
        actionText={t('newPrivacyPolicyActionButton')}
        onActionClick={() => {
          global.platform.openTab({
            url: PRIVACY_POLICY_LINK,
          });
          setNewPrivacyPolicyToastClickedOrClosed();
        }}
        onClose={setNewPrivacyPolicyToastClickedOrClosed}
      />
    )
  );
}

function PermittedNetworkToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const isPermittedNetworkToastOpen = useSelector(
    (state) => state.appState.showPermittedNetworkToastOpen,
  );

  const currentNetwork = useSelector(getCurrentNetwork);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const dappActiveNetwork = useSelector(getDappActiveNetwork);
  const safeEncodedHost = encodeURIComponent(activeTabOrigin);
  const navigate = useNavigate();

  // Use dapp's active network if available, otherwise fall back to global network
  const displayNetwork = dappActiveNetwork || currentNetwork;

  // Get the correct image URL - dapp network structure is different
  const getNetworkImageUrl = () => {
    if (dappActiveNetwork) {
      // For dapp networks, check rpcPrefs.imageUrl first, then fallback to CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      return (
        dappActiveNetwork.rpcPrefs?.imageUrl ||
        (dappActiveNetwork.chainId &&
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[dappActiveNetwork.chainId])
      );
    }
    // For global network, use existing logic
    return currentNetwork?.rpcPrefs?.imageUrl || '';
  };

  return (
    isPermittedNetworkToastOpen && (
      <Toast
        key="switched-permitted-network-toast"
        startAdornment={
          <AvatarNetwork
            size={AvatarNetworkSize.Md}
            className="border-transparent"
            src={getNetworkImageUrl()}
            name={displayNetwork?.name || displayNetwork?.nickname}
          />
        }
        text={t('permittedChainToastUpdate', [
          getURLHost(activeTabOrigin),
          displayNetwork?.name || displayNetwork?.nickname,
        ])}
        actionText={t('editPermissions')}
        onActionClick={() => {
          dispatch(hidePermittedNetworkToast());
          navigate(`${REVIEW_PERMISSIONS}?origin=${safeEncodedHost}`);
        }}
        onClose={() => dispatch(hidePermittedNetworkToast())}
      />
    )
  );
}

function InfuraSwitchToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showInfuraSwitchToast = useSelector(selectShowInfuraSwitchToast);
  const autoHideDelay = 5 * SECOND;

  return (
    showInfuraSwitchToast && (
      <Toast
        key="infura-switch-toast"
        dataTestId="infura-switch-toast"
        text={t('updatedToMetaMaskDefault')}
        startAdornment={
          <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />
        }
        onClose={() => dispatch(setShowInfuraSwitchToast(false))}
        autoHideTime={autoHideDelay}
        onAutoHideToast={() => dispatch(setShowInfuraSwitchToast(false))}
      />
    )
  );
}

function ShieldPausedToast() {
  const t = useI18nContext();
  const navigate = useNavigate();

  const showShieldPausedToast = useSelector(selectShowShieldPausedToast);
  const { captureShieldErrorStateClickedEvent } = useSubscriptionMetrics();
  const { subscriptions } = useUserSubscriptions();

  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );

  const isPaused = getIsShieldSubscriptionPaused(shieldSubscription);

  const isCardPayment =
    shieldSubscription &&
    isCardPaymentMethod(shieldSubscription?.paymentMethod);
  const isCryptoPaymentWithError =
    shieldSubscription &&
    isCryptoPaymentMethod(shieldSubscription.paymentMethod) &&
    Boolean(shieldSubscription.paymentMethod.crypto.error);

  // default text to unexpected error case
  let descriptionText = 'shieldPaymentPausedDescriptionUnexpectedError';
  let actionText = 'shieldPaymentPausedActionUnexpectedError';
  if (isCardPayment) {
    descriptionText = 'shieldPaymentPausedDescriptionCardPayment';
    actionText = 'shieldPaymentPausedActionCardPayment';
  }
  if (isCryptoPaymentWithError) {
    descriptionText = 'shieldPaymentPausedDescriptionCryptoPayment';
    actionText = 'shieldPaymentPausedActionCryptoPayment';
  }

  const trackShieldErrorStateClickedEvent = (actionClicked) => {
    const { cryptoPaymentChain, cryptoPaymentCurrency } =
      getSubscriptionPaymentData(shieldSubscription);
    // capture error state clicked event
    captureShieldErrorStateClickedEvent({
      subscriptionStatus: shieldSubscription.status,
      paymentType: shieldSubscription.paymentMethod.type,
      billingInterval: shieldSubscription.interval,
      cryptoPaymentChain,
      cryptoPaymentCurrency,
      errorCause: 'payment_error',
      actionClicked,
      location: ShieldErrorStateLocationEnum.Homepage,
      view: ShieldErrorStateViewEnum.Toast,
    });
  };

  const handleActionClick = async () => {
    // capture error state clicked event
    trackShieldErrorStateClickedEvent(ShieldErrorStateActionClickedEnum.Cta);
    setShieldPausedToastLastClickedOrClosed(Date.now());
    navigate(TRANSACTION_SHIELD_ROUTE);
  };

  const handleToastClose = () => {
    // capture error state clicked event
    trackShieldErrorStateClickedEvent(
      ShieldErrorStateActionClickedEnum.Dismiss,
    );
    setShieldPausedToastLastClickedOrClosed(Date.now());
  };

  return (
    Boolean(isPaused) &&
    showShieldPausedToast && (
      <Toast
        key="shield-payment-declined-toast"
        text={t('shieldPaymentPaused')}
        description={t(descriptionText)}
        actionText={t(actionText)}
        onActionClick={handleActionClick}
        startAdornment={
          <Icon
            name={IconName.CircleX}
            color={IconColor.errorDefault}
            size={IconSize.Lg}
          />
        }
        onClose={handleToastClose}
      />
    )
  );
}

function ShieldEndingToast() {
  const t = useI18nContext();
  const navigate = useNavigate();

  const showShieldEndingToast = useSelector(selectShowShieldEndingToast);

  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const isSubscriptionEndingSoon =
    getIsShieldSubscriptionEndingSoon(subscriptions);

  return (
    isSubscriptionEndingSoon &&
    showShieldEndingToast && (
      <Toast
        key="shield-coverage-ending-toast"
        text={t('shieldCoverageEnding')}
        description={t('shieldCoverageEndingDescription', [
          getShortDateFormatterV2().format(
            new Date(shieldSubscription.currentPeriodEnd),
          ),
        ])}
        actionText={t('shieldCoverageEndingAction')}
        onActionClick={async () => {
          setShieldEndingToastLastClickedOrClosed(Date.now());
          navigate(TRANSACTION_SHIELD_ROUTE);
        }}
        startAdornment={
          <Icon
            name={IconName.Clock}
            color={IconColor.warningDefault}
            size={IconSize.Lg}
          />
        }
        onClose={() => setShieldEndingToastLastClickedOrClosed(Date.now())}
      />
    )
  );
}

function StorageErrorToast() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Selector includes all conditions: flag is true, onboarding complete, and unlocked
  const showStorageErrorToast = useSelector(selectShowStorageErrorToast);
  const storageWriteErrorType = useSelector(selectStorageWriteErrorType);

  // Only show toast if selector returns true and user hasn't dismissed it
  const shouldShow = showStorageErrorToast && !isDismissed;

  // Show disk space-specific message when error is due to no space
  const isNoSpaceError =
    storageWriteErrorType === StorageWriteErrorType.FileErrorNoSpace;
  const description = isNoSpaceError
    ? t('storageErrorDescriptionNoSpace')
    : t('storageErrorDescriptionDefault');

  // Track "Viewed" event when toast becomes visible
  useEffect(() => {
    if (shouldShow && !hasTrackedView) {
      trackEvent({
        event: MetaMetricsEventName.StorageErrorToastViewed,
        category: MetaMetricsEventCategory.Error,
      });
      setHasTrackedView(true);
    }
  }, [shouldShow, hasTrackedView, trackEvent]);

  const handleRevealSrpClick = () => {
    trackEvent({
      event: MetaMetricsEventName.StorageErrorToastBackupSrpButtonPressed,
      category: MetaMetricsEventCategory.Error,
    });
    setIsDismissed(true);
    navigate(REVEAL_SEED_ROUTE, { state: { skipQuiz: true } });
  };

  const handleClose = () => {
    trackEvent({
      event: MetaMetricsEventName.StorageErrorToastDismissed,
      category: MetaMetricsEventCategory.Error,
    });
    setIsDismissed(true);
  };

  // Only show action button for default errors (not for no-space errors)
  const actionProps = isNoSpaceError
    ? {}
    : {
        actionText: t('storageErrorAction'),
        onActionClick: handleRevealSrpClick,
      };

  return (
    shouldShow && (
      <Toast
        key="storage-error-toast"
        dataTestId="storage-error-toast"
        startAdornment={
          <Icon
            name={IconName.Danger}
            color={IconColor.errorDefault}
            size={IconSize.Lg}
          />
        }
        text={t('storageErrorTitle')}
        description={description}
        {...actionProps}
        borderRadius={BorderRadius.LG}
        textVariant={TextVariant.bodyMd}
        onClose={handleClose}
      />
    )
  );
}

function SidePanelMigrationToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showSidePanelMigrationToast = useSelector(
    selectShowSidePanelMigrationToast,
  );

  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  const handleSwitchBackToPopup = async () => {
    try {
      await dispatch(toggleDefaultView());
    } finally {
      dismissSidePanelMigrationToast();
    }
  };

  return (
    showSidePanelMigrationToast &&
    isSidePanel && (
      <Toast
        key="side-panel-migration-toast"
        dataTestId="side-panel-migration-toast"
        startAdornment={
          <Icon name={IconName.Info} color={IconColor.iconDefault} />
        }
        text={t('sidePanelMigrationToast', [
          <button
            key="side-panel-migration-switch-back"
            type="button"
            onClick={handleSwitchBackToPopup}
            className="inline h-auto min-h-0 cursor-pointer bg-transparent p-0 align-baseline text-inherit underline underline-offset-[0.25em]"
          >
            {t('switchBackToPopup')}
          </button>,
        ])}
        borderRadius={BorderRadius.LG}
        textVariant={TextVariant.bodyMd}
        onClose={() => dismissSidePanelMigrationToast()}
      />
    )
  );
}
