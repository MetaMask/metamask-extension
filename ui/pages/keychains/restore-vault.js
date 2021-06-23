import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  createNewVaultAndRestore,
  unMarkPasswordForgotten,
  initializeThreeBox,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import TextField from '../../components/ui/text-field';
import Button from '../../components/ui/button';

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

  state = {
    seedPhrase: '',
    showSeedPhrase: false,
    password: '',
    confirmPassword: '',
    seedPhraseError: null,
    passwordError: null,
    confirmPasswordError: null,
  };

  parseSeedPhrase = (seedPhrase) =>
    (seedPhrase || '').trim().toLowerCase().match(/\w+/gu)?.join(' ') || '';

  handleSeedPhraseChange(seedPhrase) {
    let seedPhraseError = null;

    const wordCount = this.parseSeedPhrase(seedPhrase).split(/\s/u).length;
    if (
      seedPhrase &&
      (wordCount % 3 !== 0 || wordCount < 12 || wordCount > 24)
    ) {
      seedPhraseError = this.context.t('seedPhraseReq');
    }

    this.setState({ seedPhrase, seedPhraseError });
  }

  handlePasswordChange(password) {
    const { confirmPassword } = this.state;
    let confirmPasswordError = null;
    let passwordError = null;

    if (password && password.length < 8) {
      passwordError = this.context.t('passwordNotLongEnough');
    }

    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordError = this.context.t('passwordsDontMatch');
    }

    this.setState({ password, passwordError, confirmPasswordError });
  }

  handleConfirmPasswordChange(confirmPassword) {
    const { password } = this.state;
    let confirmPasswordError = null;

    if (password !== confirmPassword) {
      confirmPasswordError = this.context.t('passwordsDontMatch');
    }

    this.setState({ confirmPassword, confirmPasswordError });
  }

  onClick = () => {
    const { password, seedPhrase } = this.state;
    const {
      // eslint-disable-next-line no-shadow
      createNewVaultAndRestore,
      leaveImportSeedScreenState,
      history,
      // eslint-disable-next-line no-shadow
      initializeThreeBox,
    } = this.props;

    leaveImportSeedScreenState();
    createNewVaultAndRestore(password, this.parseSeedPhrase(seedPhrase)).then(
      () => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Retention',
            action: 'userEntersSeedPhrase',
            name: 'onboardingRestoredVault',
          },
        });
        initializeThreeBox();
        history.push(DEFAULT_ROUTE);
      },
    );
  };

  hasError() {
    const { passwordError, confirmPasswordError, seedPhraseError } = this.state;
    return passwordError || confirmPasswordError || seedPhraseError;
  }

  toggleShowSeedPhrase = () => {
    this.setState(({ showSeedPhrase }) => ({
      showSeedPhrase: !showSeedPhrase,
    }));
  };

  render() {
    const {
      seedPhrase,
      showSeedPhrase,
      password,
      confirmPassword,
      seedPhraseError,
      passwordError,
      confirmPasswordError,
    } = this.state;
    const { t } = this.context;
    const { isLoading } = this.props;
    const disabled =
      !seedPhrase ||
      !password ||
      !confirmPassword ||
      isLoading ||
      this.hasError();

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
            <div className="import-account__input-wrapper">
              <label className="import-account__input-label">
                {this.context.t('walletSeedRestore')}
              </label>
              {showSeedPhrase ? (
                <textarea
                  className="import-account__secret-phrase"
                  onChange={(e) => this.handleSeedPhraseChange(e.target.value)}
                  value={seedPhrase}
                  autoFocus
                  placeholder={this.context.t('separateEachWord')}
                />
              ) : (
                <TextField
                  className="import-account__textarea import-account__seedphrase"
                  type="password"
                  onChange={(e) => this.handleSeedPhraseChange(e.target.value)}
                  value={seedPhrase}
                  autoFocus
                  placeholder={t('seedPhrasePlaceholderPaste')}
                />
              )}
              <span className="error">{seedPhraseError}</span>
              <div
                className="import-account__checkbox-container"
                onClick={this.toggleShowSeedPhrase}
              >
                <div
                  className="import-account__checkbox"
                  tabIndex="0"
                  id="seed-checkbox"
                  role="checkbox"
                  onKeyPress={this.toggleShowSeedPhrase}
                  aria-checked={showSeedPhrase}
                  aria-labelledby="ftf-chk1-label"
                >
                  {showSeedPhrase ? <i className="fa fa-check fa-2x" /> : null}
                </div>
                <label
                  htmlFor="seed-checkbox"
                  id="ftf-chk1-label"
                  className="import-account__checkbox-label"
                >
                  {t('showSeedPhrase')}
                </label>
              </div>
            </div>
            <TextField
              id="password"
              label={t('newPassword')}
              type="password"
              className="first-time-flow__input"
              value={this.state.password}
              onChange={(event) =>
                this.handlePasswordChange(event.target.value)
              }
              error={passwordError}
              autoComplete="new-password"
              margin="normal"
              largeLabel
            />
            <TextField
              id="confirm-password"
              label={t('confirmPassword')}
              type="password"
              className="first-time-flow__input"
              value={this.state.confirmPassword}
              onChange={(event) =>
                this.handleConfirmPasswordChange(event.target.value)
              }
              error={confirmPasswordError}
              autoComplete="confirm-password"
              margin="normal"
              largeLabel
            />
            <Button
              type="first-time"
              className="first-time-flow__button"
              onClick={() => !disabled && this.onClick()}
              disabled={disabled}
            >
              {this.context.t('restore')}
            </Button>
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
