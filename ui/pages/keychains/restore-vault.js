import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  createNewVaultAndRestore,
  unMarkPasswordForgotten,
  initializeThreeBox,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import CreateNewVault from '../../components/app/create-new-vault';

class RestoreVaultPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    createNewVaultAndRestore: PropTypes.func.isRequired,
    leaveImportSeedScreenState: PropTypes.func,
    history: PropTypes.object,
    isLoading: PropTypes.bool,
    initializeThreeBox: PropTypes.func,
  };

  handleImport = async (password, seedPhrase) => {
    const {
      // eslint-disable-next-line no-shadow
      createNewVaultAndRestore,
      leaveImportSeedScreenState,
      history,
      // eslint-disable-next-line no-shadow
      initializeThreeBox,
    } = this.props;

    leaveImportSeedScreenState();
    await createNewVaultAndRestore(password, seedPhrase);
    this.context.metricsEvent({
      eventOpts: {
        category: 'Retention',
        action: 'userEntersSeedPhrase',
        name: 'onboardingRestoredVault',
      },
    });
    initializeThreeBox();
    history.push(DEFAULT_ROUTE);
  };
  // forgotPassWordTitle = (title) => {
  //   const titleArray = title.split(' ');
  //   return titleArray.join(' ');
  // };

  render() {
    const { t } = this.context;
    const { isLoading } = this.props;

    return (
      <div className="first-view-main-wrapper">
        <div className="first-view-main">
          <div className="import-account">
            <a
              className="import-account__back-button"
              onClick={(e) => {
                e.preventDefault();
                this.props.leaveImportSeedScreenState();
                this.props.history.goBack();
              }}
              href="#"
            >
              {`< ${t('back')}`}
            </a>
            <div className="import-account__title">
              {t('forgotPassword')
                .split(' ')
                .map((word, index) =>
                  index === 0
                    ? word
                    : word.charAt(0).toLowerCase() + word.slice(1),
                )
                .join(' ')}
            </div>
            <div className="import-account__selector-label">
              {t('forgotPasswordSubHeader')}
            </div>
            <div className="import-account__selector-typography">
              {t('secretPhraseWarning')}
            </div>
            <div className="import-account__selector-typography">
              {t('secretPhrase', [
                <Button
                  type="inline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://metamask.zendesk.com/hc/en-us/articles/360015489271-How-to-add-missing-accounts-after-restoring-with-Secret-Recovery-Phrase"
                  key="import-account-secretphase"
                >
                  {t('reAddAccounts')}
                </Button>,
              ])}
            </div>
            <div className="import-account__selector-typography">
              {t('reImportAccountsAndTokens', [
                <Button
                  type="inline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://metamask.zendesk.com/hc/en-us/articles/360015489331-How-to-import-an-Account"
                  key="import-account-reimport-accounts"
                >
                  {t('reImportAccounts')}
                </Button>,
                <Button
                  type="inline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://metamask.zendesk.com/hc/en-us/articles/360015489031-How-to-add-unlisted-tokens-custom-tokens-in-MetaMask"
                  key="import-account-readd-tokens"
                >
                  {t('reAddTokens')}
                </Button>,
              ])}
            </div>
            <CreateNewVault
              disabled={isLoading}
              onSubmit={this.handleImport}
              submitText={t('restore')}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ appState: { isLoading } }) => ({ isLoading }),
  (dispatch) => ({
    leaveImportSeedScreenState: () => {
      dispatch(unMarkPasswordForgotten());
    },
    createNewVaultAndRestore: (pw, seed) =>
      dispatch(createNewVaultAndRestore(pw, seed)),
    initializeThreeBox: () => dispatch(initializeThreeBox()),
  }),
)(RestoreVaultPage);
