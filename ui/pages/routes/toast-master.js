/* eslint-disable react/prop-types -- TODO: upgrade to TypeScript */

import { isEvmAccountType } from '@metamask/keyring-api';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
import { getAlertEnabledness } from '../../ducks/metamask/metamask';
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
import {
  getPermittedAccountsForCurrentTab,
  getSelectedAccount,
} from '../../selectors';
import { getShowAutoNetworkSwitchTest } from './isolated';
import {
  getShowPrivacyPolicyToast,
  getShowSurveyToast,
  setNewPrivacyPolicyToastClickedOrClosed,
  setNewPrivacyPolicyToastShownDate,
} from './toast-master-selectors';

// Allow comparison with a previous value, in order to detect changes
// (This pattern only works if ToastMaster is a singleton)
let prevAccountAddress;

export function ToastMaster({ props, context }) {
  const { t } = context;
  const {
    activeTabOrigin,
    addPermittedAccount,
    clearSwitchedNetworkDetails,
    setSurveyLinkLastClickedOrClosed,
    setSwitchedNetworkNeverShowMessage,
    switchedNetworkDetails,
    useNftDetection,
    showNftEnablementToast,
    setHideNftEnablementToast,
    isPermittedNetworkToastOpen,
    currentNetwork,
  } = props;

  const showAutoNetworkSwitchToast = getShowAutoNetworkSwitchTest(props);
  console.log('switchedNetworkDetails', switchedNetworkDetails);
  console.log('showAutoNetworkSwitchToast', showAutoNetworkSwitchToast);

  const { showPrivacyPolicyToast, newPrivacyPolicyToastShownDate } =
    useSelector(getShowPrivacyPolicyToast);

  const autoHideToastDelay = 5 * SECOND;
  const safeEncodedHost = encodeURIComponent(activeTabOrigin);

  const showSurveyToast = useSelector(getShowSurveyToast);

  const [hideConnectAccountToast, setHideConnectAccountToast] = useState(false);
  const account = useSelector(getSelectedAccount);

  // If the account has changed, allow the connect account toast again
  if (account.address !== prevAccountAddress) {
    prevAccountAddress = account.address;
    setHideConnectAccountToast(false);
  }

  const showConnectAccountToast = useSelector((state) =>
    getShowConnectAccountToast(state, account),
  );

  const onAutoHideToast = () => {
    setHideNftEnablementToast(false);
  };
  if (!onHomeScreen(props)) {
    return null;
  }

  // If the privacy policy toast is shown, and there is no date set, set it
  if (showPrivacyPolicyToast && !newPrivacyPolicyToastShownDate) {
    setNewPrivacyPolicyToastShownDate(Date.now());
  }

  return (
    <ToastContainer>
      <SurveyToast />
      {!hideConnectAccountToast && showConnectAccountToast && (
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
          onClose={() => setHideConnectAccountToast(true)}
        />
      )}
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
      {showPrivacyPolicyToast && (
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

function onHomeScreen(props) {
  const { location } = props;
  return location.pathname === DEFAULT_ROUTE;
}

// If there is more than one connected account to activeTabOrigin,
// *BUT* the current account is not one of them, show the banner
function getShowConnectAccountToast(state, account) {
  const allowShowAccountSetting = getAlertEnabledness(state).unconnectedAccount;
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);
  const isEvmAccount = isEvmAccountType(account?.type);

  return (
    allowShowAccountSetting &&
    account &&
    state.activeTab?.origin &&
    isEvmAccount &&
    connectedAccounts.length > 0 &&
    !connectedAccounts.some((address) => address === account.address)
  );
}
