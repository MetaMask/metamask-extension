/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
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
} from '../../../helpers/constants/routes';
import { getURLHost } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePrevious } from '../../../hooks/usePrevious';
import {
  getCurrentNetwork,
  getOriginOfCurrentTab,
  getSelectedAccount,
  getSwitchedNetworkDetails,
  getUseNftDetection,
} from '../../../selectors';
import {
  addPermittedAccount,
  clearSwitchedNetworkDetails,
  hidePermittedNetworkToast,
} from '../../../store/actions';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  Icon,
  IconName,
} from '../../component-library';
import { Toast, ToastContainer } from '../../multichain';
import { SurveyToast } from '../../ui/survey-toast';
import {
  selectNftDetectionEnablementToast,
  selectShowConnectAccountToast,
  selectShowPrivacyPolicyToast,
  selectShowSurveyToast,
  selectSwitchedNetworkNeverShowMessage,
} from './selectors';
import {
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
  setShowNftDetectionEnablementToast,
  setSurveyLinkLastClickedOrClosed,
  setSwitchedNetworkNeverShowMessage,
} from './utils';

export function ToastMaster() {
  const location = useLocation();

  const onHomeScreen = location.pathname === DEFAULT_ROUTE;

  return (
    onHomeScreen && (
      <ToastContainer>
        <SurveyToast />
        <ConnectAccountToast />
        <SurveyToastMayDelete />
        <PrivacyPolicyToast />
        <SwitchedNetworkToast />
        <NftEnablementToast />
        <PermittedNetworkToast />
      </ToastContainer>
    )
  );
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
          <AvatarAccount
            address={account.address}
            size={AvatarAccountSize.Md}
            borderColor={BorderColor.transparent}
          />
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

function SwitchedNetworkToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const switchedNetworkDetails = useSelector(getSwitchedNetworkDetails);
  const switchedNetworkNeverShowMessage = useSelector(
    selectSwitchedNetworkNeverShowMessage,
  );

  const isShown = switchedNetworkDetails && !switchedNetworkNeverShowMessage;

  return (
    isShown && (
      <Toast
        key="switched-network-toast"
        startAdornment={
          <AvatarNetwork
            size={AvatarAccountSize.Md}
            borderColor={BorderColor.transparent}
            src={switchedNetworkDetails?.imageUrl || ''}
            name={switchedNetworkDetails?.nickname}
          />
        }
        text={t('switchedNetworkToastMessage', [
          switchedNetworkDetails.nickname,
          getURLHost(switchedNetworkDetails.origin),
        ])}
        actionText={t('switchedNetworkToastDecline')}
        onActionClick={setSwitchedNetworkNeverShowMessage}
        onClose={() => dispatch(clearSwitchedNetworkDetails())}
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
