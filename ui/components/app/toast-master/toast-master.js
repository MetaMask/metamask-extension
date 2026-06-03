/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  toast,
} from '@metamask/design-system-react';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { PRIVACY_POLICY_LINK } from '../../../../shared/lib/ui-utils';
import { IconColor } from '../../../helpers/constants/design-system';
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
      <div className="toasts-container">
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
      </div>
    );
  }

  if (onPerpsScreen) {
    return (
      <div className="toasts-container">
        {storageErrorToast}
        <PerpsWithdrawToast />
      </div>
    );
  }

  if (onSettingsScreen) {
    return <div className="toasts-container">{storageErrorToast}</div>;
  }

  // On other screens, only render ToastContainer if storage error toast should show
  // ToastContainer provides essential CSS styling (position: fixed, z-index, etc.)
  if (shouldShowStorageErrorToast) {
    return <div className="toasts-container">{storageErrorToast}</div>;
  }

  return null;
}

function PrivacyPolicyToast() {
  const t = useI18nContext();

  const { showPrivacyPolicyToast, newPrivacyPolicyToastShownDate } =
    useSelector(selectShowPrivacyPolicyToast);

  useEffect(() => {
    if (!showPrivacyPolicyToast) {
      return undefined;
    }

    if (!newPrivacyPolicyToastShownDate) {
      setNewPrivacyPolicyToastShownDate(Date.now());
      return undefined;
    }

    toast({
      severity: 'default',
      title: t('newPrivacyPolicyTitle'),
      actionButtonLabel: t('newPrivacyPolicyActionButton'),
      actionButtonOnClick: () => {
        global.platform.openTab({
          url: PRIVACY_POLICY_LINK,
        });
        setNewPrivacyPolicyToastClickedOrClosed();
      },
      onClose: setNewPrivacyPolicyToastClickedOrClosed,
      startAccessory: (
        <Icon name={IconName.Info} color={IconColor.iconDefault} />
      ),
    });

    return () => {
      toast.dismiss();
    };
  }, [newPrivacyPolicyToastShownDate, showPrivacyPolicyToast, t]);

  return null;
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
  const getNetworkImageUrl = useCallback(() => {
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
  }, [currentNetwork?.rpcPrefs?.imageUrl, dappActiveNetwork]);

  useEffect(() => {
    if (!isPermittedNetworkToastOpen) {
      return undefined;
    }

    toast({
      severity: 'default',
      title: t('permittedChainToastUpdate', [
        getURLHost(activeTabOrigin),
        displayNetwork?.name || displayNetwork?.nickname,
      ]),
      actionButtonLabel: t('editPermissions'),
      actionButtonOnClick: () => {
        dispatch(hidePermittedNetworkToast());
        navigate(`${REVIEW_PERMISSIONS}?origin=${safeEncodedHost}`);
      },
      onClose: () => dispatch(hidePermittedNetworkToast()),
      startAccessory: (
        <AvatarNetwork
          size={AvatarNetworkSize.Md}
          className="border-transparent"
          src={getNetworkImageUrl()}
          name={displayNetwork?.name || displayNetwork?.nickname}
        />
      ),
    });

    return () => {
      toast.dismiss();
    };
  }, [
    activeTabOrigin,
    dispatch,
    displayNetwork?.name,
    displayNetwork?.nickname,
    isPermittedNetworkToastOpen,
    navigate,
    safeEncodedHost,
    getNetworkImageUrl,
    t,
  ]);

  return null;
}

function InfuraSwitchToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showInfuraSwitchToast = useSelector(selectShowInfuraSwitchToast);

  useEffect(() => {
    if (!showInfuraSwitchToast) {
      return undefined;
    }

    toast({
      severity: 'success',
      title: t('updatedToMetaMaskDefault'),
      startAccessory: (
        <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />
      ),
      onClose: () => dispatch(setShowInfuraSwitchToast(false)),
      'data-testid': 'infura-switch-toast',
    });

    return () => {
      toast.dismiss();
    };
  }, [dispatch, showInfuraSwitchToast, t]);

  return null;
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

  useEffect(() => {
    if (!isPaused || !showShieldPausedToast) {
      return undefined;
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

    toast({
      severity: 'danger',
      title: t('shieldPaymentPaused'),
      description: t(descriptionText),
      actionButtonLabel: t(actionText),
      actionButtonOnClick: handleActionClick,
      startAccessory: (
        <Icon
          name={IconName.CircleX}
          color={IconColor.errorDefault}
          size={IconSize.Lg}
        />
      ),
      onClose: handleToastClose,
    });

    return () => {
      toast.dismiss();
    };
  }, [
    actionText,
    captureShieldErrorStateClickedEvent,
    descriptionText,
    isPaused,
    navigate,
    shieldSubscription,
    showShieldPausedToast,
    t,
  ]);

  return null;
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
  const currentPeriodEnd = shieldSubscription?.currentPeriodEnd;

  useEffect(() => {
    if (
      !isSubscriptionEndingSoon ||
      !showShieldEndingToast ||
      !currentPeriodEnd
    ) {
      return undefined;
    }

    toast({
      severity: 'default',
      title: t('shieldCoverageEnding'),
      description: t('shieldCoverageEndingDescription', [
        getShortDateFormatterV2().format(new Date(currentPeriodEnd)),
      ]),
      actionButtonLabel: t('shieldCoverageEndingAction'),
      actionButtonOnClick: async () => {
        setShieldEndingToastLastClickedOrClosed(Date.now());
        navigate(TRANSACTION_SHIELD_ROUTE);
      },
      startAccessory: (
        <Icon
          name={IconName.Clock}
          color={IconColor.warningDefault}
          size={IconSize.Lg}
        />
      ),
      onClose: () => setShieldEndingToastLastClickedOrClosed(Date.now()),
    });

    return () => {
      toast.dismiss();
    };
  }, [
    isSubscriptionEndingSoon,
    navigate,
    currentPeriodEnd,
    showShieldEndingToast,
    t,
  ]);

  return null;
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

  useEffect(() => {
    if (!shouldShow || isDismissed) {
      return undefined;
    }

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

    toast({
      severity: 'danger',
      'data-testid': 'storage-error-toast',
      startAccessory: (
        <Icon
          name={IconName.Danger}
          color={IconColor.errorDefault}
          size={IconSize.Lg}
        />
      ),
      title: t('storageErrorTitle'),
      description,
      onClose: handleClose,
      actionButtonLabel: isNoSpaceError ? undefined : t('storageErrorAction'),
      actionButtonOnClick: isNoSpaceError ? undefined : handleRevealSrpClick,
    });

    return () => {
      toast.dismiss();
    };
  }, [
    description,
    navigate,
    isDismissed,
    isNoSpaceError,
    shouldShow,
    trackEvent,
    t,
  ]);

  return null;
}

function SidePanelMigrationToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showSidePanelMigrationToast = useSelector(
    selectShowSidePanelMigrationToast,
  );

  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  useEffect(() => {
    if (!showSidePanelMigrationToast || !isSidePanel) {
      return undefined;
    }

    toast({
      severity: 'default',
      'data-testid': 'side-panel-migration-toast',
      startAccessory: (
        <Icon name={IconName.Info} color={IconColor.iconDefault} />
      ),
      title: t('sidePanelMigrationToast', [
        <button
          key="side-panel-migration-switch-back"
          type="button"
          onClick={async () => {
            try {
              await dispatch(toggleDefaultView());
            } finally {
              dismissSidePanelMigrationToast();
            }
          }}
          className="inline h-auto min-h-0 cursor-pointer bg-transparent p-0 align-baseline text-inherit underline underline-offset-[0.25em]"
        >
          {t('switchBackToPopup')}
        </button>,
      ]),
      onClose: () => dismissSidePanelMigrationToast(),
    });

    return () => {
      toast.dismiss();
    };
  }, [dispatch, isSidePanel, showSidePanelMigrationToast, t]);

  return null;
}
