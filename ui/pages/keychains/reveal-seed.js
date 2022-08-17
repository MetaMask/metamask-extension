import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { requestRevealSeedWords } from '../../store/actions';
import ExportTextContainer from '../../components/ui/export-text-container';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

import Button from '../../components/ui/button';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

class RevealSeedPage extends Component {
  state = {
    screen: PASSWORD_PROMPT_SCREEN,
    password: '',
    seedWords: null,
    error: null,
  };

  componentDidMount() {
    const passwordBox = document.getElementById('password-box');
    if (passwordBox) {
      passwordBox.focus();
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({ seedWords: null, error: null });
    this.props
      .requestRevealSeedWords(this.state.password)
      .then((seedWords) => {
        this.context.trackEvent({
          category: EVENT.CATEGORIES.KEYS,
          event: EVENT_NAMES.KEY_EXPORT_REVEALED,
          properties: {
            key_type: EVENT.KEY_TYPES.SRP,
          },
        });
        this.setState({ seedWords, screen: REVEAL_SEED_SCREEN });
      })
      .catch((error) => {
        this.context.trackEvent({
          category: EVENT.CATEGORIES.KEYS,
          event: EVENT_NAMES.KEY_EXPORT_FAILED,
          properties: {
            key_type: EVENT.KEY_TYPES.SRP,
            reason: error.message, // 'incorrect_password',
          },
        });
        this.setState({ error: error.message });
      });
  }

  renderWarning() {
    return (
      <div className="page-container__warning-container">
        <i className="fa fa-exclamation-triangle fa-2x page-container__warning-icon" />
        <div className="page-container__warning-message">
          <div className="page-container__warning-title">
            {this.context.t('revealSeedWordsWarningTitle')}
          </div>
          <div>{this.context.t('revealSeedWordsWarning')}</div>
        </div>
      </div>
    );
  }

  renderContent() {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptContent()
      : this.renderRevealSeedContent();
  }

  renderPasswordPromptContent() {
    const { t } = this.context;

    return (
      <form onSubmit={(event) => this.handleSubmit(event)}>
        <label className="input-label" htmlFor="password-box">
          {t('enterPasswordContinue')}
        </label>
        <div className="input-group">
          <input
            type="password"
            placeholder={t('password')}
            id="password-box"
            value={this.state.password}
            onChange={(event) =>
              this.setState({ password: event.target.value })
            }
            className={classnames('form-control', {
              'form-control--error': this.state.error,
            })}
          />
        </div>
        {this.state.error && (
          <div className="reveal-seed__error">{this.state.error}</div>
        )}
      </form>
    );
  }

  renderRevealSeedContent() {
    const { t, trackEvent } = this.context;

    return (
      <div>
        <label className="reveal-seed__label">
          {t('yourPrivateSeedPhrase')}
        </label>
        <ExportTextContainer
          text={this.state.seedWords}
          onClickCopy={() => {
            trackEvent({
              category: EVENT.CATEGORIES.KEYS,
              event: EVENT_NAMES.KEY_EXPORT_COPIED,
              properties: {
                key_type: EVENT.KEY_TYPES.SRP,
                copy_method: 'clipboard',
              },
            });
          }}
          onClickDownload={() => {
            trackEvent({
              category: EVENT.CATEGORIES.KEYS,
              event: EVENT_NAMES.KEY_EXPORT_COPIED,
              properties: {
                key_type: EVENT.KEY_TYPES.SRP,
                copy_method: 'file_download',
              },
            });
          }}
        />
      </div>
    );
  }

  renderFooter() {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptFooter()
      : this.renderRevealSeedFooter();
  }

  renderPasswordPromptFooter() {
    return (
      <div className="page-container__footer">
        <footer>
          <Button
            type="secondary"
            large
            className="page-container__footer-button"
            onClick={() => {
              this.context.trackEvent({
                category: EVENT.CATEGORIES.KEYS,
                event: EVENT_NAMES.KEY_EXPORT_CANCELED,
                properties: {
                  key_type: EVENT.KEY_TYPES.SRP,
                },
              });
              this.props.history.push(this.props.mostRecentOverviewPage);
            }}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="primary"
            large
            className="page-container__footer-button"
            onClick={(event) => {
              this.context.trackEvent({
                category: EVENT.CATEGORIES.KEYS,
                event: EVENT_NAMES.KEY_EXPORT_REQUESTED,
                properties: {
                  key_type: EVENT.KEY_TYPES.SRP,
                },
              });
              this.handleSubmit(event);
            }}
            disabled={this.state.password === ''}
          >
            {this.context.t('next')}
          </Button>
        </footer>
      </div>
    );
  }

  renderRevealSeedFooter() {
    return (
      <div className="page-container__footer">
        <Button
          type="secondary"
          large
          className="page-container__footer-single-button"
          onClick={() =>
            this.props.history.push(this.props.mostRecentOverviewPage)
          }
        >
          {this.context.t('close')}
        </Button>
      </div>
    );
  }

  render() {
    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('secretRecoveryPhrase')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('revealSeedWordsDescription')}
          </div>
        </div>
        <div className="page-container__content">
          {this.renderWarning()}
          <div className="reveal-seed__content">{this.renderContent()}</div>
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}

RevealSeedPage.propTypes = {
  requestRevealSeedWords: PropTypes.func,
  history: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
};

RevealSeedPage.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    requestRevealSeedWords: (password) =>
      dispatch(requestRevealSeedWords(password)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RevealSeedPage);
