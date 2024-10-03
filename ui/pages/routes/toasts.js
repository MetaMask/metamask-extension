import { SurveyToast } from '../../components/ui/survey-toast';

export function renderToasts() {
  const { t } = this.context;
  const {
    account,
    activeTabOrigin,
    addPermittedAccount,
    showSurveyToast,
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
  } = this.props;

  const showAutoNetworkSwitchToast = getShowAutoNetworkSwitchTest();
  const isPrivacyToastRecent = this.getIsPrivacyToastRecent();
  const isPrivacyToastNotShown = !newPrivacyPolicyToastShownDate;
  const isEvmAccount = isEvmAccountType(account?.type);
  const autoHideToastDelay = 5 * SECOND;
  const safeEncodedHost = encodeURIComponent(activeTabOrigin);

  const onAutoHideToast = () => {
    setHideNftEnablementToast(false);
  };
  if (!this.onHomeScreen()) {
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
          text={this.context.t('accountIsntConnectedToastText', [
            account?.metadata?.name,
            getURLHost(activeTabOrigin),
          ])}
          actionText={this.context.t('connectAccount')}
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
          text={this.context.t('switchedNetworkToastMessage', [
            switchedNetworkDetails.nickname,
            getURLHost(switchedNetworkDetails.origin),
          ])}
          actionText={this.context.t('switchedNetworkToastDecline')}
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
          text={this.context.t('nftAutoDetectionEnabled')}
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
          text={this.context.t('permittedChainToastUpdate', [
            getURLHost(activeTabOrigin),
            currentNetwork?.nickname,
          ])}
          actionText={this.context.t('editPermissions')}
          onActionClick={() => {
            this.props.hidePermittedNetworkToast();
            this.props.history.push(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
          }}
          onClose={() => this.props.hidePermittedNetworkToast()}
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

export function getIsPrivacyToastRecent() {
  const { newPrivacyPolicyToastShownDate } = this.props;

  const currentDate = new Date();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const newPrivacyPolicyToastShownDateObj = new Date(
    newPrivacyPolicyToastShownDate,
  );
  const toastWasShownLessThanADayAgo =
    currentDate - newPrivacyPolicyToastShownDateObj < oneDayInMilliseconds;

  return toastWasShownLessThanADayAgo;
}
