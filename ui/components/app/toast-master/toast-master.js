/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import React, { memo, useEffect, useState } from 'react';
import { useToaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { SECOND } from '../../../../shared/constants/time';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
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
import { ToastContainer } from '../../multichain';
import { SurveyToast } from '../../ui/survey-toast';
import { toast } from '../../ui/toast/toast';
import { StorageWriteErrorType } from '../../../../shared/constants/app-state';
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
  selectNewPrivacyPolicyToastShownDate,
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

const PRIVACY_POLICY_TOAST_ID = 'privacy-policy-toast';
const PERMITTED_NETWORK_TOAST_ID = 'permitted-network-toast';
const INFURA_SWITCH_TOAST_ID = 'infura-switch-toast';
const SHIELD_PAUSED_TOAST_ID = 'shield-payment-declined-toast';
const SHIELD_ENDING_TOAST_ID = 'shield-coverage-ending-toast';
const STORAGE_ERROR_TOAST_ID = 'storage-error-toast';
const SIDE_PANEL_MIGRATION_TOAST_ID = 'side-panel-migration-toast';

// Memoized to prevent re-renders when ToastMaster re-renders due to location changes.
const MemoizedSurveyToast = memo(SurveyToast);
const MemoizedPrivacyPolicyToast = memo(PrivacyPolicyToast);
const MemoizedPermittedNetworkToast = memo(PermittedNetworkToast);
const MemoizedInfuraSwitchToast = memo(InfuraSwitchToast);
const MemoizedPerpsWithdrawToast = memo(PerpsWithdrawToast);
const MemoizedShieldPausedToast = memo(ShieldPausedToast);
const MemoizedShieldEndingToast = memo(ShieldEndingToast);
const MemoizedSidePanelMigrationToast = memo(SidePanelMigrationToast);
const MemoizedStorageErrorToast = memo(StorageErrorToast);

export function ToastMaster() {
  const location = useLocation();

  const shouldShowStorageErrorToast = useSelector(selectShowStorageErrorToast);

  const currentPathname = location?.pathname ?? DEFAULT_ROUTE;
  const onHomeScreen = currentPathname === DEFAULT_ROUTE;
  const onPerpsScreen = currentPathname.startsWith(PERPS_ROUTE);
  const onSettingsScreen = currentPathname.startsWith(SETTINGS_ROUTE);

  if (onHomeScreen) {
    return (
      <>
        <ToastContainer>
          <MemoizedSurveyToast />
        </ToastContainer>
        <MemoizedStorageErrorToast />
        <MemoizedPrivacyPolicyToast />
        <MemoizedPermittedNetworkToast />
        <MemoizedInfuraSwitchToast />
        <MemoizedPerpsWithdrawToast />
        <MemoizedShieldPausedToast />
        <MemoizedShieldEndingToast />
        <MemoizedSidePanelMigrationToast />
      </>
    );
  }

  if (onPerpsScreen) {
    return (
      <>
        <MemoizedStorageErrorToast />
        <MemoizedPerpsWithdrawToast />
      </>
    );
  }

  if (onSettingsScreen) {
    return <MemoizedStorageErrorToast />;
  }

  if (shouldShowStorageErrorToast) {
    return <MemoizedStorageErrorToast />;
  }

  return null;
}

function PrivacyPolicyToast() {
  const { toasts } = useToaster();
  const t = useI18nContext();

  const showPrivacyPolicyToast = useSelector(selectShowPrivacyPolicyToast);
  const newPrivacyPolicyToastShownDate = useSelector(
    selectNewPrivacyPolicyToastShownDate,
  );

  useEffect(() => {
    if (showPrivacyPolicyToast && !newPrivacyPolicyToastShownDate) {
      setNewPrivacyPolicyToastShownDate(Date.now());
    }
  }, [showPrivacyPolicyToast, newPrivacyPolicyToastShownDate]);

  useEffect(() => {
    if (!showPrivacyPolicyToast) {
      toast.dismiss(PRIVACY_POLICY_TOAST_ID);
      return undefined;
    }

    const handleDismiss = () => {
      setNewPrivacyPolicyToastClickedOrClosed();
    };

    toast.success(
      {
        title: t('newPrivacyPolicyTitle'),
        actionText: t('newPrivacyPolicyActionButton'),
        dataTestId: PRIVACY_POLICY_TOAST_ID,
        id: PRIVACY_POLICY_TOAST_ID,
      },
      {
        duration: Infinity,
        icon: <Icon name={IconName.Info} color={IconColor.iconDefault} />,
      },
    );

    return () => {
      toast.dismiss(PRIVACY_POLICY_TOAST_ID);
    };
  }, [showPrivacyPolicyToast, t]);


  useEffect(() => {
    const activeToast = toasts.find((item) => item.id === PRIVACY_POLICY_TOAST_ID);
    if (showPrivacyPolicyToast && activeToast?.dismissed) {
      setNewPrivacyPolicyToastClickedOrClosed();
    }
  }, [toasts, showPrivacyPolicyToast]);

  return null;
}

function PermittedNetworkToast() {
  const { toasts } = useToaster();
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

  const displayNetwork = dappActiveNetwork || currentNetwork;

  const getNetworkImageUrl = () => {
    if (dappActiveNetwork) {
      return (
        dappActiveNetwork.rpcPrefs?.imageUrl ||
        (dappActiveNetwork.chainId &&
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[dappActiveNetwork.chainId])
      );
    }
    return currentNetwork?.rpcPrefs?.imageUrl || '';
  };

  const networkImageUrl = getNetworkImageUrl();
  const networkName = displayNetwork?.name || displayNetwork?.nickname;

  useEffect(() => {
    if (!isPermittedNetworkToastOpen) {
      toast.dismiss(PERMITTED_NETWORK_TOAST_ID);
      return undefined;
    }

    const handleDismiss = () => {
      dispatch(hidePermittedNetworkToast());
    };

    toast.success(
      {
        actionText: t('editPermissions'),
        dataTestId: PERMITTED_NETWORK_TOAST_ID,
        id: PERMITTED_NETWORK_TOAST_ID,
      },
      {
        duration: Infinity,
        icon: (,
      },
    );

    return () => {
      toast.dismiss(PERMITTED_NETWORK_TOAST_ID);
    };
  }, [
    activeTabOrigin,
    dispatch,
    isPermittedNetworkToastOpen,
    navigate,
    networkImageUrl,
    networkName,
    safeEncodedHost,
    t,
  ]);


  useEffect(() => {
    const activeToast = toasts.find((item) => item.id === PERMITTED_NETWORK_TOAST_ID);
    if (isPermittedNetworkToastOpen && activeToast?.dismissed) {
      dispatch(hidePermittedNetworkToast());
    }
  }, [toasts, isPermittedNetworkToastOpen, dispatch]);

  return null;
}

function InfuraSwitchToast() {
  const { toasts } = useToaster();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showInfuraSwitchToast = useSelector(selectShowInfuraSwitchToast);
  const autoHideDelay = 5 * SECOND;

  useEffect(() => {
    if (!showInfuraSwitchToast) {
      toast.dismiss(INFURA_SWITCH_TOAST_ID);
      return undefined;
    }

    const handleDismiss = () => {
      dispatch(setShowInfuraSwitchToast(false));
    };

    toast.success(
      {
        title: t('updatedToMetaMaskDefault'),
        dataTestId: INFURA_SWITCH_TOAST_ID,
        id: INFURA_SWITCH_TOAST_ID,
      },
      {
        duration: autoHideDelay,
        icon: <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />,
      },
    );

    const timeoutId = setTimeout(handleDismiss, autoHideDelay);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss(INFURA_SWITCH_TOAST_ID);
    };
  }, [autoHideDelay, dispatch, showInfuraSwitchToast, t]);


  useEffect(() => {
    const activeToast = toasts.find((item) => item.id === INFURA_SWITCH_TOAST_ID);
    if (showInfuraSwitchToast && activeToast?.dismissed) {
      dispatch(setShowInfuraSwitchToast(false));
    }
  }, [toasts, showInfuraSwitchToast, dispatch]);

  return null;
}

function ShieldPausedToast() {
  const { toasts } = useToaster();
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

  const shouldShow = Boolean(isPaused) && showShieldPausedToast;

  const trackShieldErrorStateClickedEvent = (actionClicked) => {
    if (!shieldSubscription) {
      return;
    }
    const { cryptoPaymentChain, cryptoPaymentCurrency } =
      getSubscriptionPaymentData(shieldSubscription);
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

  useEffect(() => {
    if (!shouldShow) {
      toast.dismiss(SHIELD_PAUSED_TOAST_ID);
      return undefined;
    }

    toast.error(
      {
        title: t('shieldPaymentPaused'),
        description: t(descriptionText),
        actionText: t(actionText),
        dataTestId: SHIELD_PAUSED_TOAST_ID,
        id: SHIELD_PAUSED_TOAST_ID,
      },
      {
        duration: Infinity,
        icon: (,
      },
    );

    return () => {
      toast.dismiss(SHIELD_PAUSED_TOAST_ID);
    };
  }, [
    actionText,
    captureShieldErrorStateClickedEvent,
    descriptionText,
    navigate,
    shouldShow,
    shieldSubscription,
    t,
  ]);

  useEffect(() => {
    const activeToast = toasts.find(
      (item) => item.id === SHIELD_PAUSED_TOAST_ID,
    );
    if (shouldShow && activeToast?.dismissed) {
      trackShieldErrorStateClickedEvent(
        ShieldErrorStateActionClickedEnum.Dismiss,
      );
      setShieldPausedToastLastClickedOrClosed(Date.now());
    }
  }, [toasts, shouldShow, shieldSubscription]);

  return null;
}

function ShieldEndingToast() {
  const { toasts } = useToaster();
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

  const shouldShow = isSubscriptionEndingSoon && showShieldEndingToast;
  const endingDescription = shieldSubscription
    ? t('shieldCoverageEndingDescription', [
        getShortDateFormatterV2().format(
          new Date(shieldSubscription.currentPeriodEnd),
        ),
      ])
    : undefined;

  useEffect(() => {
    if (!shouldShow) {
      toast.dismiss(SHIELD_ENDING_TOAST_ID);
      return undefined;
    }

    const handleDismiss = () => {
      setShieldEndingToastLastClickedOrClosed(Date.now());
    };

    toast.success(
      {
        title: t('shieldCoverageEnding'),
        description: endingDescription,
        actionText: t('shieldCoverageEndingAction'),
        dataTestId: SHIELD_ENDING_TOAST_ID,
        id: SHIELD_ENDING_TOAST_ID,
      },
      {
        duration: Infinity,
        icon: (,
      },
    );

    return () => {
      toast.dismiss(SHIELD_ENDING_TOAST_ID);
    };
  }, [endingDescription, navigate, shouldShow, t]);


  useEffect(() => {
    const activeToast = toasts.find((item) => item.id === SHIELD_ENDING_TOAST_ID);
    if (shouldShow && activeToast?.dismissed) {
      setShieldEndingToastLastClickedOrClosed(Date.now());
    }
  }, [toasts, shouldShow]);

  return null;
}

function StorageErrorToast() {
  const { toasts } = useToaster();
  const t = useI18nContext();
  const navigate = useNavigate();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const showStorageErrorToast = useSelector(selectShowStorageErrorToast);
  const storageWriteErrorType = useSelector(selectStorageWriteErrorType);

  const shouldShow = showStorageErrorToast && !isDismissed;

  const isNoSpaceError =
    storageWriteErrorType === StorageWriteErrorType.FileErrorNoSpace;
  const description = isNoSpaceError
    ? t('storageErrorDescriptionNoSpace')
    : t('storageErrorDescriptionDefault');

  useEffect(() => {
    if (shouldShow && !hasTrackedView) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.StorageErrorToastViewed)
          .addCategory(MetaMetricsEventCategory.Error)
          .build(),
      );
      setHasTrackedView(true);
    }
  }, [shouldShow, hasTrackedView, trackEvent, createEventBuilder]);

  useEffect(() => {
    if (!shouldShow) {
      toast.dismiss(STORAGE_ERROR_TOAST_ID);
      return undefined;
    }

    const handleRevealSrpClick = () => {
      trackEvent(
        createEventBuilder(
          MetaMetricsEventName.StorageErrorToastBackupSrpButtonPressed,
        )
          .addCategory(MetaMetricsEventCategory.Error)
          .build(),
      );
      setIsDismissed(true);
      navigate(REVEAL_SEED_ROUTE, { state: { skipQuiz: true } });
    };

    toast.error(
      {
        title: t('storageErrorTitle'),
        description: description,
        actionText: isNoSpaceError ? undefined : t('storageErrorAction'),
        onActionClick: isNoSpaceError ? undefined : handleRevealSrpClick,
        dataTestId: STORAGE_ERROR_TOAST_ID,
        id: STORAGE_ERROR_TOAST_ID,
      },
      {
        duration: Infinity,
        icon: (,
      },
    );

    return () => {
      toast.dismiss(STORAGE_ERROR_TOAST_ID);
    };
  }, [
    createEventBuilder,
    description,
    isNoSpaceError,
    navigate,
    shouldShow,
    t,
    trackEvent,
  ]);


  useEffect(() => {
    const activeToast = toasts.find((item) => item.id === STORAGE_ERROR_TOAST_ID);
    if (shouldShow && activeToast?.dismissed) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.StorageErrorToastDismissed)
          .addCategory(MetaMetricsEventCategory.Error)
          .build(),
      );
      setIsDismissed(true);
    }
  }, [toasts, shouldShow, trackEvent, createEventBuilder]);

  return null;
}

function SidePanelMigrationToast() {
  const { toasts } = useToaster();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showSidePanelMigrationToast = useSelector(
    selectShowSidePanelMigrationToast,
  );

  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  const shouldShow = showSidePanelMigrationToast && isSidePanel;

  useEffect(() => {
    if (!shouldShow) {
      toast.dismiss(SIDE_PANEL_MIGRATION_TOAST_ID);
      return undefined;
    }

    const handleSwitchBackToPopup = async () => {
      try {
        await dispatch(toggleDefaultView());
      } finally {
        dismissSidePanelMigrationToast();
      }
    };

    const handleDismiss = () => {
      dismissSidePanelMigrationToast();
    };

    toast.success(
      <div data-testid={SIDE_PANEL_MIGRATION_TOAST_ID}>
        <p className="text-m-body-md">
          {t('sidePanelMigrationToast', [
            <button
              key="side-panel-migration-switch-back"
              type="button"
              onClick={handleSwitchBackToPopup}
              className="inline h-auto min-h-0 cursor-pointer bg-transparent p-0 align-baseline text-inherit underline underline-offset-[0.25em]"
            >
              {t('switchBackToPopup')}
            </button>,
          ])}
        </p>
      </div>,
      {
        id: SIDE_PANEL_MIGRATION_TOAST_ID,
        duration: Infinity,
        icon: <Icon name={IconName.Info} color={IconColor.iconDefault} />,
      },
    );

    return () => {
      toast.dismiss(SIDE_PANEL_MIGRATION_TOAST_ID);
    };
  }, [dispatch, shouldShow, t]);


  useEffect(() => {
    const activeToast = toasts.find((item) => item.id === SIDE_PANEL_MIGRATION_TOAST_ID);
    if (shouldShow && activeToast?.dismissed) {
      dismissSidePanelMigrationToast();
    }
  }, [toasts, shouldShow]);

  return null;
}
