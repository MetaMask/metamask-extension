/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import classnames from 'classnames';
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
  REVIEW_PERMISSIONS,
  SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import { getURLHost } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePrevious } from '../../../hooks/usePrevious';
import {
  getCurrentNetwork,
  getMetaMaskHdKeyrings,
  getOriginOfCurrentTab,
  getSelectedAccount,
  getUseNftDetection,
} from '../../../selectors';
import {
  addPermittedAccount,
  hidePermittedNetworkToast,
} from '../../../store/actions';
import {
  AvatarAccountSize,
  AvatarNetwork,
  Icon,
  IconName,
} from '../../component-library';
import { PreferredAvatar } from '../preferred-avatar';
import { Toast, ToastContainer } from '../../multichain';
import { SurveyToast } from '../../ui/survey-toast';
import { PasswordChangeToastType } from '../../../../shared/constants/app-state';
import {
  selectNftDetectionEnablementToast,
  selectShowConnectAccountToast,
  selectShowPrivacyPolicyToast,
  selectShowSurveyToast,
  selectNewSrpAdded,
  selectPasswordChangeToast,
  selectShowCopyAddressToast,
} from './selectors';
import {
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
  setShowNftDetectionEnablementToast,
  setSurveyLinkLastClickedOrClosed,
  setShowNewSrpAddedToast,
  setShowPasswordChangeToast,
  setShowCopyAddressToast,
} from './utils';

export function ToastMaster() {
  const location = useLocation();

  const onHomeScreen = location.pathname === DEFAULT_ROUTE;
  const onSettingsScreen = location.pathname.startsWith(SETTINGS_ROUTE);

  if (onHomeScreen) {
    return (
      <ToastContainer>
        <SurveyToast />
        <ConnectAccountToast />
        <SurveyToastMayDelete />
        <PrivacyPolicyToast />
        <NftEnablementToast />
        <PermittedNetworkToast />
        <NewSrpAddedToast />
        <CopyAddressToast />
      </ToastContainer>
    );
  }

  if (onSettingsScreen) {
    return (
      <ToastContainer>
        <PasswordChangeToast />
      </ToastContainer>
    );
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
          <PreferredAvatar address={account.address} className="shrink-0" />
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
  const safeEncodedHost = encodeURIComponent(activeTabOrigin);
  const history = useHistory();

  return (
    isPermittedNetworkToastOpen && (
      <Toast
        key="switched-permitted-network-toast"
        startAdornment={
          <AvatarNetwork
            size={AvatarAccountSize.Md}
            borderColor={BorderColor.transparent}
            src={currentNetwork?.rpcPrefs.imageUrl || ''}
            name={currentNetwork?.nickname}
          />
        }
        text={t('permittedChainToastUpdate', [
          getURLHost(activeTabOrigin),
          currentNetwork?.nickname,
        ])}
        actionText={t('editPermissions')}
        onActionClick={() => {
          dispatch(hidePermittedNetworkToast());
          history.push(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
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
