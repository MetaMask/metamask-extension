import { ethers } from 'ethers';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TextField from '../../../../components/ui/text-field';
import Button from '../../../../components/ui/button';
import {
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
} from '../../../../helpers/constants/routes';

const { isValidMnemonic } = ethers.utils;

export default class ImportWithSeedPhrase extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    setSeedPhraseBackedUp: PropTypes.func,
    initializeThreeBox: PropTypes.func,
  };

  state = {
    seedPhrase: '',
    showSeedPhrase: false,
    password: '',
    confirmPassword: '',
    seedPhraseError: '',
    passwordError: '',
    confirmPasswordError: '',
    termsChecked: false,
  };

  parseSeedPhrase = (seedPhrase) =>
    (seedPhrase || '').trim().toLowerCase().match(/\w+/gu)?.join(' ') || '';

  UNSAFE_componentWillMount() {
    this._onBeforeUnload = () =>
      this.context.metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Import Seed Phrase',
          name: 'Close window on import screen',
        },
        customVariables: {
          errorLabel: 'Seed Phrase Error',
          errorMessage: this.state.seedPhraseError,
        },
      });
    window.addEventListener('beforeunload', this._onBeforeUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this._onBeforeUnload);
  }

  handleSeedPhraseChange(seedPhrase) {
    let seedPhraseError = '';

    if (seedPhrase) {
      const parsedSeedPhrase = this.parseSeedPhrase(seedPhrase);
      const wordCount = parsedSeedPhrase.split(/\s/u).length;
      if (wordCount % 3 !== 0 || wordCount > 24 || wordCount < 12) {
        seedPhraseError = this.context.t('seedPhraseReq');
      } else if (!isValidMnemonic(parsedSeedPhrase)) {
        seedPhraseError = this.context.t('invalidSeedPhrase');
      }
    }

    this.setState({ seedPhrase, seedPhraseError });
  }

  handlePasswordChange(password) {
    const { t } = this.context;

    this.setState((state) => {
      const { confirmPassword } = state;
      let confirmPasswordError = '';
      let passwordError = '';

      if (password && password.length < 8) {
        passwordError = t('passwordNotLongEnough');
      }

      if (confirmPassword && password !== confirmPassword) {
        confirmPasswordError = t('passwordsDontMatch');
      }

      return {
        password,
        passwordError,
        confirmPasswordError,
      };
    });
  }

  handleConfirmPasswordChange(confirmPassword) {
    const { t } = this.context;

    this.setState((state) => {
      const { password } = state;
      let confirmPasswordError = '';

      if (password !== confirmPassword) {
        confirmPasswordError = t('passwordsDontMatch');
      }

      return {
        confirmPassword,
        confirmPasswordError,
      };
    });
  }

  handleImport = async (event) => {
    event.preventDefault();

    if (!this.isValid()) {
      return;
    }

    const { password, seedPhrase } = this.state;
    const {
      history,
      onSubmit,
      setSeedPhraseBackedUp,
      initializeThreeBox,
    } = this.props;

    try {
      await onSubmit(password, this.parseSeedPhrase(seedPhrase));
      this.context.metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Import Seed Phrase',
          name: 'Import Complete',
        },
      });

      setSeedPhraseBackedUp(true).then(async () => {
        initializeThreeBox();
        history.push(INITIALIZE_END_OF_FLOW_ROUTE);
      });
    } catch (error) {
      this.setState({ seedPhraseError: error.message });
    }
  };

  isValid() {
    const {
      seedPhrase,
      password,
      confirmPassword,
      passwordError,
      confirmPasswordError,
      seedPhraseError,
    } = this.state;

    if (
      !password ||
      !confirmPassword ||
      !seedPhrase ||
      password !== confirmPassword
    ) {
      return false;
    }

    if (password.length < 8) {
      return false;
    }

    return !passwordError && !confirmPasswordError && !seedPhraseError;
  }

  onTermsKeyPress = ({ key }) => {
    if (key === ' ' || key === 'Enter') {
      this.toggleTermsCheck();
    }
  };

  toggleTermsCheck = () => {
    this.context.metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Import Seed Phrase',
        name: 'Check ToS',
      },
    });
    this.setState((prevState) => ({
      termsChecked: !prevState.termsChecked,
    }));
  };

  toggleShowSeedPhrase = () => {
    this.setState(({ showSeedPhrase }) => ({
      showSeedPhrase: !showSeedPhrase,
    }));
  };

  render() {
    const { t } = this.context;
    const {
      seedPhraseError,
      showSeedPhrase,
      passwordError,
      confirmPasswordError,
      termsChecked,
    } = this.state;

    return (
      <form className="first-time-flow__form" onSubmit={this.handleImport}>
        <div className="first-time-flow__create-back">
          <a
            onClick={(e) => {
              e.preventDefault();
              this.context.metricsEvent({
                eventOpts: {
                  category: 'Onboarding',
                  action: 'Import Seed Phrase',
                  name: 'Go Back from Onboarding Import',
                },
                customVariables: {
                  errorLabel: 'Seed Phrase Error',
                  errorMessage: seedPhraseError,
                },
              });
              this.props.history.push(INITIALIZE_SELECT_ACTION_ROUTE);
            }}
            href="#"
          >
            {`< ${t('back')}`}
          </a>
        </div>
        <div className="first-time-flow__header">
          {t('importAccountSeedPhrase')}
        </div>
        <div className="first-time-flow__text-block">{t('secretPhrase')}</div>
        <div className="first-time-flow__textarea-wrapper">
          <label>{t('walletSeed')}</label>
          {showSeedPhrase ? (
            <textarea
              className="first-time-flow__textarea"
              onChange={(e) => this.handleSeedPhraseChange(e.target.value)}
              value={this.state.seedPhrase}
              placeholder={t('seedPhrasePlaceholder')}
            />
          ) : (
            <TextField
              className="first-time-flow__textarea first-time-flow__seedphrase"
              type="password"
              onChange={(e) => this.handleSeedPhraseChange(e.target.value)}
              value={this.state.seedPhrase}
              placeholder={t('seedPhrasePlaceholderPaste')}
            />
          )}
          {seedPhraseError && <span className="error">{seedPhraseError}</span>}
          <div
            className="first-time-flow__checkbox-container"
            onClick={this.toggleShowSeedPhrase}
          >
            <div
              className="first-time-flow__checkbox"
              tabIndex="0"
              role="checkbox"
              onKeyPress={this.toggleShowSeedPhrase}
              aria-checked={showSeedPhrase}
              aria-labelledby="ftf-chk1-label"
            >
              {showSeedPhrase ? <i className="fa fa-check fa-2x" /> : null}
            </div>
            <span
              id="ftf-chk1-label"
              className="first-time-flow__checkbox-label"
            >
              {t('showSeedPhrase')}
            </span>
          </div>
        </div>
        <TextField
          id="password"
          label={t('newPassword')}
          type="password"
          className="first-time-flow__input"
          value={this.state.password}
          onChange={(event) => this.handlePasswordChange(event.target.value)}
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
        <div
          className="first-time-flow__checkbox-container"
          onClick={this.toggleTermsCheck}
        >
          <div
            className="first-time-flow__checkbox first-time-flow__terms"
            tabIndex="0"
            role="checkbox"
            onKeyPress={this.onTermsKeyPress}
            aria-checked={termsChecked}
            aria-labelledby="ftf-chk1-label"
          >
            {termsChecked ? <i className="fa fa-check fa-2x" /> : null}
          </div>
          <span id="ftf-chk1-label" className="first-time-flow__checkbox-label">
            {t('acceptTermsOfUse', [
              <a
                onClick={(e) => e.stopPropagation()}
                key="first-time-flow__link-text"
                href="https://metamask.io/terms.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="first-time-flow__link-text">{t('terms')}</span>
              </a>,
            ])}
          </span>
        </div>
        <Button
          type="primary"
          submit
          className="first-time-flow__button"
          disabled={!this.isValid() || !termsChecked}
        >
          {t('import')}
        </Button>
      </form>
    );
  }
}
