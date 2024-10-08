/* eslint-disable @babel/no-invalid-this -- TODO remove */

import { isEvmAccountType } from '@metamask/keyring-api';
import React from 'react';
import { MILLISECOND, SECOND } from '../../../shared/constants/time';
import { PRIVACY_POLICY_LINK, SURVEY_LINK } from '../../../shared/lib/ui-utils';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  Icon,
  IconName,
} from '../../components/component-library';
import { Toast, ToastContainer } from '../../components/multichain';
import { SurveyToast } from '../../components/ui/survey-toast';
import {
  BorderColor,
  BorderRadius,
  IconColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  REVIEW_PERMISSIONS,
} from '../../helpers/constants/routes';
import { getURLHost } from '../../helpers/utils/util';
import { getShowAutoNetworkSwitchTest } from './isolated';
import { useSelector } from 'react-redux';
import {
  SURVEY_DATE,
  SURVEY_END_TIME,
  SURVEY_START_TIME,
} from '../../helpers/constants/survey';

export function ToastMaster({ props, context }) {
  const { t } = context;
  const {
    account,
    activeTabOrigin,
    addPermittedAccount,
    showConnectAccountToast,
    showPrivacyPolicyToast,
    newPrivacyPolicyToastShownDate,
    clearSwitchedNetworkDetails,
    setSurveyLinkLastClickedOrClosed,
    setNewPrivacyPolicyToastClickedOrClosed,
    setSwitchedNetworkNeverShowMessage,
    switchedNetworkDetails,
    useNftDetection,
    showNftEnablementToast,
    setHideNftEnablementToast,
    isPermittedNetworkToastOpen,
    currentNetwork,
  } = props;

  const showAutoNetworkSwitchToast = getShowAutoNetworkSwitchTest(props);
  const isPrivacyToastRecent = getIsPrivacyToastRecent(
    props.newPrivacyPolicyToastShownDate,
  );
  const isPrivacyToastNotShown = !newPrivacyPolicyToastShownDate;
  const isEvmAccount = isEvmAccountType(account?.type);
  const autoHideToastDelay = 5 * SECOND;
  const safeEncodedHost = encodeURIComponent(activeTabOrigin);

  const showSurveyToast = useSelector(getShowSurveyToast);

  const onAutoHideToast = () => {
    setHideNftEnablementToast(false);
  };
  if (!onHomeScreen(props)) {
    return null;
  }

  return (
    <ToastContainer>
      <SurveyToast />
      {showConnectAccountToast &&
      !this.state.hideConnectAccountToast &&
      isEvmAccount ? (
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
            addPermittedAccount(activeTabOrigin, account.address);
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
          onClose={() => this.setState({ hideConnectAccountToast: true })}
        />
      ) : null}
      {showSurveyToast && (
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
      )}
      {showPrivacyPolicyToast &&
        (isPrivacyToastRecent || isPrivacyToastNotShown) && (
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
            onClose={() => {
              setNewPrivacyPolicyToastClickedOrClosed();
            }}
          />
        )}
      {showAutoNetworkSwitchToast ? (
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
          onActionClick={() => setSwitchedNetworkNeverShowMessage()}
          onClose={() => clearSwitchedNetworkDetails()}
        />
      ) : null}
      {showNftEnablementToast && useNftDetection ? (
        <Toast
          key="enabled-nft-auto-detection"
          startAdornment={
            <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />
          }
          text={t('nftAutoDetectionEnabled')}
          borderRadius={BorderRadius.LG}
          textVariant={TextVariant.bodyMd}
          autoHideTime={autoHideToastDelay}
          onAutoHideToast={onAutoHideToast}
        />
      ) : null}

      {process.env.CHAIN_PERMISSIONS && isPermittedNetworkToastOpen ? (
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
            props.hidePermittedNetworkToast();
            props.history.push(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
          }}
          onClose={() => props.hidePermittedNetworkToast()}
        />
      ) : null}
    </ToastContainer>
  );
}

export function updateNewPrivacyPolicyToastDate(props) {
  const {
    showPrivacyPolicyToast,
    newPrivacyPolicyToastShownDate,
    setNewPrivacyPolicyToastShownDate,
  } = props;

  if (showPrivacyPolicyToast && !newPrivacyPolicyToastShownDate) {
    setNewPrivacyPolicyToastShownDate(Date.now());
  }
}

export function getIsPrivacyToastRecent(newPrivacyPolicyToastShownDate) {
  const currentDate = new Date();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const newPrivacyPolicyToastShownDateObj = new Date(
    newPrivacyPolicyToastShownDate,
  );
  const toastWasShownLessThanADayAgo =
    currentDate - newPrivacyPolicyToastShownDateObj < oneDayInMilliseconds;

  return toastWasShownLessThanADayAgo;
}

function onHomeScreen(props) {
  const { location } = props;
  return location.pathname === DEFAULT_ROUTE;
}

/**
 * Determines if the survey toast should be shown based on the current time, survey start and end times, and whether the survey link was last clicked or closed.
 *
 * @param {*} state - The application state containing the necessary survey data.
 * @returns {boolean} True if the current time is between the survey start and end times and the survey link was not last clicked or closed. False otherwise.
 */
function getShowSurveyToast(state) {
  if (state.metamask.surveyLinkLastClickedOrClosed) {
    return false;
  }

  const startTime = new Date(`${SURVEY_DATE} ${SURVEY_START_TIME}`).getTime();
  const endTime = new Date(`${SURVEY_DATE} ${SURVEY_END_TIME}`).getTime();
  const now = Date.now();

  return now > startTime && now < endTime;
}
