import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  createNewVaultAndRestore,
  resetOAuthLoginState,
  setFirstTimeFlowType,
  unMarkPasswordForgotten,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import CreateNewVault from '../../components/app/create-new-vault';
import Box from '../../components/ui/box';
import { Text, Button } from '../../components/component-library';
import { TextVariant, TextColor } from '../../helpers/constants/design-system';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getIsSocialLoginFlow } from '../../selectors';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import ResetAppButton from '../../components/app/reset-app/reset-app';

class RestoreVaultPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    createNewVaultAndRestore: PropTypes.func.isRequired,
    leaveImportSeedScreenState: PropTypes.func,
    setFirstTimeFlowType: PropTypes.func,
    resetOAuthLoginState: PropTypes.func,
    history: PropTypes.object,
    isLoading: PropTypes.bool,
    isSocialLoginFlow: PropTypes.bool,
  };

  handleImport = async (password, seedPhrase) => {
    const {
      createNewVaultAndRestore: propsCreateNewVaultAndRestore,
      setFirstTimeFlowType: propsSetFirstTimeFlowType,
      resetOAuthLoginState: propsResetOAuthLoginState,
      leaveImportSeedScreenState,
      history,
      isSocialLoginFlow: propsIsSocialLoginFlow,
    } = this.props;

    leaveImportSeedScreenState();

    if (propsIsSocialLoginFlow) {
      // reset oauth and onboarding state
      await propsResetOAuthLoginState();
    }

    // update the first time flow type to restore
    await propsSetFirstTimeFlowType(FirstTimeFlowType.restore);

    // import the seed phrase and create a new vault
    await propsCreateNewVaultAndRestore(password, seedPhrase);
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Retention,
      event: MetaMetricsEventName.WalletRestored,
    });
    history.push(DEFAULT_ROUTE);
  };

  render() {
    const { t } = this.context;
    const { isLoading, isSocialLoginFlow } = this.props;

    return (
      <Box className="first-view-main-wrapper">
        <Box className="first-view-main">
          <Box className="import-account">
            <a
              className="import-account__back-button"
              onClick={(e) => {
                e.preventDefault();
                this.props.leaveImportSeedScreenState();
                this.props.history.push(DEFAULT_ROUTE);
              }}
              href="#"
            >
              {`< ${t('back')}`}
            </a>
            <Text variant={TextVariant.displayMd} color={TextColor.textDefault}>
              {t('resetWallet')}
            </Text>
            <Text color={TextColor.textDefault}>
              {isSocialLoginFlow
                ? t('resetWalletSubHeaderSocial')
                : t('resetWalletSubHeader')}
            </Text>
            <Text color={TextColor.textDefault} marginTop={4} marginBottom={4}>
              {isSocialLoginFlow
                ? t('resetWalletUsingSRPSocial', [
                    <Button
                      type="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ZENDESK_URLS.RESET_IMPORT_AN_ACCOUNT}
                      key="import-an-account"
                      className="import-account__link"
                    >
                      {t('resetWalletUsingSRPSocialAccounts')}
                    </Button>,
                    <Button
                      type="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ZENDESK_URLS.RESET_ADD_MISSING_ACCOUNT}
                      key="add-missing-account"
                      className="import-account__link"
                    >
                      {t('resetWalletUsingSRPSocialCustomAccounts')}
                    </Button>,
                    <Button
                      type="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ZENDESK_URLS.RESET_DISPLAY_TOKENS}
                      key="display-tokens"
                      className="import-account__link"
                    >
                      {t('resetWalletUsingSRPSocialCustomTokens')}
                    </Button>,
                  ])
                : t('resetWalletUsingSRP', [
                    <Button
                      type="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ZENDESK_URLS.ADD_MISSING_ACCOUNTS}
                      key="import-account-secretphase"
                      className="import-account__link"
                    >
                      {t('reAddAccounts')}
                    </Button>,
                    <Button
                      type="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ZENDESK_URLS.IMPORT_ACCOUNTS}
                      key="import-account-reimport-accounts"
                      className="import-account__link"
                    >
                      {t('reAdded')}
                    </Button>,
                    <Button
                      type="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ZENDESK_URLS.ADD_CUSTOM_TOKENS}
                      key="import-account-readd-tokens"
                      className="import-account__link"
                    >
                      {t('reAdded')}
                    </Button>,
                  ])}
            </Text>
            <Text color={TextColor.textDefault} margin={0} marginBottom={4}>
              {isSocialLoginFlow
                ? t('resetWalletWarningSocial')
                : t('resetWalletWarning')}
            </Text>
            <CreateNewVault
              disabled={isLoading}
              onSubmit={this.handleImport}
              submitText={t('restore')}
            />
            {/** TODO: Remove this button once we have a proper way to reset the app */}
            <ResetAppButton />
          </Box>
        </Box>
      </Box>
    );
  }
}

export default connect(
  (state) => {
    return {
      isLoading: state.appState.isLoading,
      isSocialLoginFlow: getIsSocialLoginFlow(state),
    };
  },
  (dispatch) => ({
    leaveImportSeedScreenState: () => {
      dispatch(unMarkPasswordForgotten());
    },
    createNewVaultAndRestore: (pw, seed) =>
      dispatch(createNewVaultAndRestore(pw, seed)),
    setFirstTimeFlowType: (type) => dispatch(setFirstTimeFlowType(type)),
    resetOAuthLoginState: () => dispatch(resetOAuthLoginState()),
  }),
)(RestoreVaultPage);
