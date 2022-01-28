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

  handleImport = (password, seedPhrase) => {
    const {
      // eslint-disable-next-line no-shadow
      createNewVaultAndRestore,
      leaveImportSeedScreenState,
      history,
      // eslint-disable-next-line no-shadow
      initializeThreeBox,
    } = this.props;

    leaveImportSeedScreenState();
    createNewVaultAndRestore(password, seedPhrase).then(() => {
      this.context.metricsEvent({
        eventOpts: {
          category: 'Retention',
          action: 'userEntersSeedPhrase',
          name: 'onboardingRestoredVault',
        },
      });
      initializeThreeBox();
      history.push(DEFAULT_ROUTE);
    });
  };

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
              {this.context.t('restoreAccountWithSeed')}
            </div>
            <div className="import-account__selector-label">
              {this.context.t('secretPhrase')}
            </div>
            <div className="import-account__selector-typography">
              {this.context.t('secretPhraseWarning')}
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
