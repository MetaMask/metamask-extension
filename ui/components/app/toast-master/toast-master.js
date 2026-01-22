/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import classnames from 'classnames';
import { getAllScopesFromCaip25CaveatValue } from '@metamask/chain-agnostic-permission';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { MILLISECOND, SECOND } from '../../../../shared/constants/time';
import {
  PRIVACY_POLICY_LINK,
  SURVEY_LINK,
} from '../../../../shared/lib/ui-utils';
import {
  BorderColor,
  BorderRadius,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  REVEAL_SEED_ROUTE,
  REVIEW_PERMISSIONS,
  SETTINGS_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../../helpers/constants/routes';
import { getURLHost } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePrevious } from '../../../hooks/usePrevious';
import {
  getCurrentNetwork,
  getIsMultichainAccountsState2Enabled,
  getMetaMaskHdKeyrings,
  getOriginOfCurrentTab,
  getPermissions,
  getSelectedAccount,
  getUseNftDetection,
} from '../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  addPermittedAccount,
  hidePermittedNetworkToast,
} from '../../../store/actions';
import {
  AvatarNetwork,
  Icon,
  IconName,
  IconSize,
} from '../../component-library';
import { PreferredAvatar } from '../preferred-avatar';
import { Toast, ToastContainer } from '../../multichain';
import { SurveyToast } from '../../ui/survey-toast';
import {
  PasswordChangeToastType,
  ClaimSubmitToastType,
} from '../../../../shared/constants/app-state';
import { getDappActiveNetwork } from '../../../selectors/dapp';
import {
  getAccountGroupWithInternalAccounts,
  getIconSeedAddressByAccountGroupId,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { hasChainIdSupport } from '../../../../shared/lib/multichain/scope-utils';
import { getCaip25CaveatValueFromPermissions } from '../../../pages/permissions-connect/connect-page/utils';
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
} from '../../../pages/settings/transaction-shield-tab/types';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../../shared/constants/subscriptions';
import {
  selectNftDetectionEnablementToast,
  selectShowConnectAccountToast,
  selectShowPrivacyPolicyToast,
  selectShowSurveyToast,
  selectNewSrpAdded,
  selectPasswordChangeToast,
  selectShowCopyAddressToast,
  selectShowConnectAccountGroupToast,
  selectClaimSubmitToast,
  selectShowShieldPausedToast,
  selectShowShieldEndingToast,
  selectShowStorageErrorToast,
  selectShowInfuraSwitchToast,
} from './selectors';
import {
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
  setShowNftDetectionEnablementToast,
  setSurveyLinkLastClickedOrClosed,
  setShowNewSrpAddedToast,
  setShowPasswordChangeToast,
  setShowCopyAddressToast,
  setShowClaimSubmitToast,
  setShowInfuraSwitchToast,
  setShieldPausedToastLastClickedOrClosed,
  setShieldEndingToastLastClickedOrClosed,
} from './utils';

export function ToastMaster() {
  const location = useLocation();
  const isMultichainAccountsFeatureState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // Check if storage error toast should be shown (needed for conditional rendering on other screens)
  // The selector includes all conditions: flag is true, onboarding complete, and unlocked
  const shouldShowStorageErrorToast = useSelector(selectShowStorageErrorToast);

  // Get current pathname from React Router
  const currentPathname = location?.pathname ?? DEFAULT_ROUTE;
  const onHomeScreen = currentPathname === DEFAULT_ROUTE;
  const onSettingsScreen = currentPathname.startsWith(SETTINGS_ROUTE);

  // Storage error toast should show on ALL screens
  const storageErrorToast = <StorageErrorToast />;

  if (onHomeScreen) {
    return (
      <ToastContainer>
        {storageErrorToast}
        <SurveyToast />
        {isMultichainAccountsFeatureState2Enabled ? (
          <ConnectAccountGroupToast />
        ) : (
          <ConnectAccountToast />
        )}
        <SurveyToastMayDelete />
        <PrivacyPolicyToast />
        <NftEnablementToast />
        <PermittedNetworkToast />
        <NewSrpAddedToast />
        <InfuraSwitchToast />
        <CopyAddressToast />
        <ShieldPausedToast />
        <ShieldEndingToast />
      </ToastContainer>
    );
  }

  if (onSettingsScreen) {
    return (
      <ToastContainer>
        {storageErrorToast}
        <PasswordChangeToast />
        <ClaimSubmitToast />
      </ToastContainer>
    );
  }

  // On other screens, only render ToastContainer if storage error toast should show
  // ToastContainer provides essential CSS styling (position: fixed, z-index, etc.)
  if (shouldShowStorageErrorToast) {
    return <ToastContainer>{storageErrorToast}</ToastContainer>;
  }

  return null;
}

function ConnectAccountToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const [hideConnectAccountToast, setHideConnectAccountToast] = useState(false);
  const account = useSelector(getSelectedAccount);

  // If the account has changed, allow the connect account toast again
  const prevAccountAddress = usePrevious(account?.address);
  if (account?.address !== prevAccountAddress && hideConnectAccountToast) {
    setHideConnectAccountToast(false);
  }

  const showConnectAccountToast = useSelector((state) =>
    selectShowConnectAccountToast(state, account),
  );

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);

  return (
    Boolean(!hideConnectAccountToast && showConnectAccountToast) && (
      <Toast
        dataTestId="connect-account-toast"
        key="connect-account-toast"
        startAdornment={
          <PreferredAvatar address={account.address} className="self-center" />
        }
        text={t('accountIsntConnectedToastText', [
          account?.metadata?.name,
          getURLHost(activeTabOrigin),
        ])}
        actionText={t('connectAccount')}
        onActionClick={() => {
          // Connect this account
          dispatch(addPermittedAccount(activeTabOrigin, account.address));
          // Use setTimeout to prevent React re-render from
          // hiding the tooltip
          setTimeout(() => {
            // Trigger a mouseenter on the header's connection icon
            // to display the informative connection tooltip
            document
              .querySelector(
                '[data-testid="connection-menu"] [data-tooltipped]',
              )
              ?.dispatchEvent(new CustomEvent('mouseenter', {}));
          }, 250 * MILLISECOND);
        }}
        onClose={() => setHideConnectAccountToast(true)}
      />
    )
  );
}

function ConnectAccountGroupToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const [hideConnectAccountToast, setHideConnectAccountToast] = useState(false);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const selectedAccountGroupInternalAccounts = useSelector((state) =>
    getAccountGroupWithInternalAccounts(state, selectedAccountGroup),
  )?.find((accountGroup) => accountGroup.id === selectedAccountGroup);

  // If the account has changed, allow the connect account toast again
  const prevAccountGroup = usePrevious(selectedAccountGroup);
  if (selectedAccountGroup !== prevAccountGroup && hideConnectAccountToast) {
    setHideConnectAccountToast(false);
  }

  const showConnectAccountToast = useSelector((state) =>
    selectedAccountGroupInternalAccounts
      ? selectShowConnectAccountGroupToast(
          state,
          selectedAccountGroupInternalAccounts,
        )
      : false,
  );

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const existingPermissions = useSelector((state) =>
    getPermissions(state, activeTabOrigin),
  );
  const existingCaip25CaveatValue = existingPermissions
    ? getCaip25CaveatValueFromPermissions(existingPermissions)
    : null;
  const existingChainIds = useMemo(
    () =>
      existingCaip25CaveatValue
        ? getAllScopesFromCaip25CaveatValue(existingCaip25CaveatValue)
        : [],
    [existingCaip25CaveatValue],
  );

  const addressesToPermit = useMemo(() => {
    if (!selectedAccountGroupInternalAccounts?.accounts) {
      return [];
    }
    return selectedAccountGroupInternalAccounts.accounts
      .filter((account) => hasChainIdSupport(account.scopes, existingChainIds))
      .map((account) => account.address);
  }, [existingChainIds, selectedAccountGroupInternalAccounts?.accounts]);

  const seedAddress = useSelector((state) =>
    getIconSeedAddressByAccountGroupId(
      state,
      selectedAccountGroupInternalAccounts?.id,
    ),
  );

  // Early return if selectedAccountGroupInternalAccounts is undefined
  if (!selectedAccountGroupInternalAccounts || !seedAddress) {
    return null;
  }

  return (
    Boolean(!hideConnectAccountToast && showConnectAccountToast) && (
      <Toast
        dataTestId="connect-account-toast"
        key="connect-account-toast"
        startAdornment={
          <PreferredAvatar address={seedAddress} className="self-center" />
        }
        text={t('accountIsntConnectedToastText', [
          selectedAccountGroupInternalAccounts.metadata?.name,
          getURLHost(activeTabOrigin),
        ])}
        actionText={t('connectAccount')}
        onActionClick={() => {
          // Connect this account
          addressesToPermit.forEach((address) => {
            dispatch(addPermittedAccount(activeTabOrigin, address));
          });
          // Use setTimeout to prevent React re-render from
          // hiding the tooltip
          setTimeout(() => {
            // Trigger a mouseenter on the header's connection icon
            // to display the informative connection tooltip
            document
              .querySelector(
                '[data-testid="connection-menu"] [data-tooltipped]',
              )
              ?.dispatchEvent(new CustomEvent('mouseenter', {}));
          }, 250 * MILLISECOND);
        }}
        onClose={() => setHideConnectAccountToast(true)}
      />
    )
  );
}

function SurveyToastMayDelete() {
  const t = useI18nContext();

  const showSurveyToast = useSelector(selectShowSurveyToast);

  return (
    showSurveyToast && (
      <Toast
        key="survey-toast"
        startAdornment={
          <Icon name={IconName.Heart} color={IconColor.errorDefault} />
        }
        text={t('surveyTitle')}
        actionText={t('surveyConversion')}
        onActionClick={() => {
          global.platform.openTab({
            url: SURVEY_LINK,
          });
          setSurveyLinkLastClickedOrClosed(Date.now());
        }}
        onClose={() => {
          setSurveyLinkLastClickedOrClosed(Date.now());
        }}
      />
    )
  );
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

function NftEnablementToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showNftEnablementToast = useSelector(selectNftDetectionEnablementToast);
  const useNftDetection = useSelector(getUseNftDetection);

  const autoHideToastDelay = 5 * SECOND;

  return (
    showNftEnablementToast &&
    useNftDetection && (
      <Toast
        key="enabled-nft-auto-detection"
        startAdornment={
          <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />
        }
        text={t('nftAutoDetectionEnabled')}
        borderRadius={BorderRadius.LG}
        textVariant={TextVariant.bodyMd}
        autoHideTime={autoHideToastDelay}
        onAutoHideToast={() =>
          dispatch(setShowNftDetectionEnablementToast(false))
        }
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
            size={AvatarAccountSize.Md}
            borderColor={BorderColor.transparent}
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
          navigate(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
        }}
        onClose={() => dispatch(hidePermittedNetworkToast())}
      />
    )
  );
}

function NewSrpAddedToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showNewSrpAddedToast = useSelector(selectNewSrpAdded);
  const autoHideDelay = 5 * SECOND;

  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const latestHdKeyringNumber = hdKeyrings.length;

  // This will close the toast if the user clicks the account menu.
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dismissElement = document.querySelector(
        '[data-testid="account-menu-icon"]',
      );
      if (dismissElement && dismissElement.contains(event.target)) {
        dispatch(setShowNewSrpAddedToast(false));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch]);

  return (
    showNewSrpAddedToast && (
      <Toast
        key="new-srp-added-toast"
        text={t('importWalletSuccess', [latestHdKeyringNumber])}
        startAdornment={
          <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />
        }
        onClose={() => dispatch(setShowNewSrpAddedToast(false))}
        autoHideTime={autoHideDelay}
        onAutoHideToast={() => dispatch(setShowNewSrpAddedToast(false))}
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
        text={t('defaultSwitchedToInfura')}
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

const PasswordChangeToast = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showPasswordChangeToast = useSelector(selectPasswordChangeToast);
  const autoHideToastDelay = 5 * SECOND;

  return (
    showPasswordChangeToast !== null && (
      <Toast
        dataTestId={
          showPasswordChangeToast === PasswordChangeToastType.Success
            ? 'password-change-toast-success'
            : 'password-change-toast-error'
        }
        className={classnames({
          'toasts-container--password-change-toast--error':
            showPasswordChangeToast === PasswordChangeToastType.Errored,
        })}
        key="password-change-toast"
        text={
          showPasswordChangeToast === PasswordChangeToastType.Success
            ? t('securityChangePasswordToastSuccess')
            : t('securityChangePasswordToastError')
        }
        startAdornment={
          showPasswordChangeToast ===
          PasswordChangeToastType.Success ? undefined : (
            <Icon name={IconName.Danger} color={IconColor.iconDefault} />
          )
        }
        borderRadius={BorderRadius.LG}
        textVariant={TextVariant.bodyMd}
        autoHideTime={autoHideToastDelay}
        onAutoHideToast={() => {
          dispatch(setShowPasswordChangeToast(null));
        }}
        onClose={() => {
          dispatch(setShowPasswordChangeToast(null));
        }}
      />
    )
  );
};

function CopyAddressToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showCopyAddressToast = useSelector(selectShowCopyAddressToast);
  const autoHideToastDelay = 2 * SECOND;

  return (
    showCopyAddressToast && (
      <Toast
        key="copy-address-toast"
        text={t('addressCopied')}
        startAdornment={
          <Icon name={IconName.CopySuccess} color={IconColor.iconDefault} />
        }
        onClose={() => dispatch(setShowCopyAddressToast(false))}
        autoHideTime={autoHideToastDelay}
        onAutoHideToast={() => dispatch(setShowCopyAddressToast(false))}
        dataTestId="copy-address-toast"
      />
    )
  );
}

const ClaimSubmitToast = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const showClaimSubmitToast = useSelector(selectClaimSubmitToast);
  const autoHideToastDelay = 5 * SECOND;

  const isSuccess = showClaimSubmitToast === ClaimSubmitToastType.Success;
  const isDraftSaved = showClaimSubmitToast === ClaimSubmitToastType.DraftSaved;
  const isDraftSaveFailed =
    showClaimSubmitToast === ClaimSubmitToastType.DraftSaveFailed;
  const isErrored = showClaimSubmitToast === ClaimSubmitToastType.Errored;
  const isDraftDeleted =
    showClaimSubmitToast === ClaimSubmitToastType.DraftDeleted;
  const isDraftDeleteFailed =
    showClaimSubmitToast === ClaimSubmitToastType.DraftDeleteFailed;

  const description = useMemo(() => {
    if (isSuccess) {
      return t('shieldClaimSubmitSuccessDescription');
    }
    if (isDraftSaved) {
      return t('shieldClaimDraftSavedDescription');
    }
    if (isDraftSaveFailed) {
      return t('shieldClaimDraftSaveFailedDescription');
    }
    if (isDraftDeleted) {
      return t('shieldClaimDeleteDraftDescription');
    }
    if (isDraftDeleteFailed) {
      return t('shieldClaimDraftDeleteFailedDescription');
    }
    if (isErrored) {
      return '';
    }
    return showClaimSubmitToast;
  }, [
    isSuccess,
    isDraftSaved,
    isDraftSaveFailed,
    isErrored,
    isDraftDeleted,
    isDraftDeleteFailed,
    showClaimSubmitToast,
    t,
  ]);

  const toastText = useMemo(() => {
    if (isSuccess) {
      return t('shieldClaimSubmitSuccess');
    }
    if (isDraftSaved) {
      return t('shieldClaimDraftSaved');
    }
    if (isDraftSaveFailed) {
      return t('shieldClaimDraftSaveFailed');
    }
    if (isDraftDeleted) {
      return t('shieldClaimDeletedDraft');
    }
    if (isDraftDeleteFailed) {
      return t('shieldClaimDraftDeleteFailed');
    }
    return t('shieldClaimSubmitError');
  }, [
    isSuccess,
    isDraftSaved,
    isDraftSaveFailed,
    isDraftDeleted,
    isDraftDeleteFailed,
    t,
  ]);

  const dataTestId = useMemo(() => {
    if (isSuccess) {
      return 'claim-submit-toast-success';
    }
    if (isDraftSaved) {
      return 'claim-draft-saved-toast';
    }
    if (isDraftSaveFailed) {
      return 'claim-draft-save-failed-toast';
    }
    if (isDraftDeleted) {
      return 'claim-draft-deleted-toast';
    }
    if (isDraftDeleteFailed) {
      return 'claim-draft-delete-failed-toast';
    }
    return 'claim-submit-toast-error';
  }, [
    isSuccess,
    isDraftSaved,
    isDraftSaveFailed,
    isDraftDeleted,
    isDraftDeleteFailed,
  ]);

  return (
    showClaimSubmitToast !== null && (
      <Toast
        dataTestId={dataTestId}
        key="claim-submit-toast"
        text={toastText}
        description={description}
        startAdornment={
          <Icon
            name={
              isSuccess || isDraftSaved || isDraftDeleted
                ? IconName.CheckBold
                : IconName.CircleX
            }
            color={
              isSuccess || isDraftSaved || isDraftDeleted
                ? IconColor.successDefault
                : IconColor.errorDefault
            }
          />
        }
        autoHideTime={autoHideToastDelay}
        onAutoHideToast={() => {
          dispatch(setShowClaimSubmitToast(null));
        }}
        onClose={() => {
          dispatch(setShowClaimSubmitToast(null));
        }}
      />
    )
  );
};

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
  const [isDismissed, setIsDismissed] = useState(false);

  // Selector includes all conditions: flag is true, onboarding complete, and unlocked
  const showStorageErrorToast = useSelector(selectShowStorageErrorToast);

  const handleRevealSrpClick = () => {
    setIsDismissed(true);
    navigate(REVEAL_SEED_ROUTE);
  };

  const handleClose = () => {
    setIsDismissed(true);
  };

  // Only show toast if selector returns true and user hasn't dismissed it
  const shouldShow = showStorageErrorToast && !isDismissed;

  return (
    shouldShow && (
      <Toast
        key="database-corruption-toast"
        dataTestId="storage-error-toast"
        startAdornment={
          <Icon
            name={IconName.Danger}
            color={IconColor.errorDefault}
            size={IconSize.Lg}
          />
        }
        text={t('storageErrorTitle')}
        description={t('storageErrorDescription')}
        actionText={t('storageErrorAction')}
        onActionClick={handleRevealSrpClick}
        borderRadius={BorderRadius.LG}
        textVariant={TextVariant.bodyMd}
        onClose={handleClose}
      />
    )
  );
}
