import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { requestRevealSeedWords } from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

import Button from '../../components/ui/button';
import Box from '../../components/ui/box';
import Typography from '../../components/ui/typography';
import {
  BorderStyle,
  Color,
  FONT_WEIGHT,
  Size,
  TypographyVariant,
} from '../../helpers/constants/design-system';
import WarningPopover from './components/warning-popover';
import RevealSeedContent from './components/reveal-seed-content';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

class RevealSeedPage extends Component {
  state = {
    screen: PASSWORD_PROMPT_SCREEN,
    password: '',
    seedWords: null,
    error: null,
    showPopover: false,
  };

  componentDidMount() {
    const passwordBox = document.getElementById('password-box');
    if (passwordBox) {
      passwordBox.focus();
    }
  }

  handleSubmit() {
    this.setState({ showPopover: false });
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
      <Box
        className="page-container__warning-container"
        margin={4}
        borderStyle={BorderStyle.solid}
        borderWidth={1}
        borderRadius={Size.MD}
        borderColor={Color.errorDefault}
      >
        <i className="fa fa-eye-slash page-container__warning-icon" />
        <Box className="page-container__warning-message">
          <Typography
            variant={TypographyVariant.H7}
            margin={0}
            className="page-container__warning-title"
          >
            {this.context.t('secretRecoveryPhraseWarningTitle')}
          </Typography>
          <Typography
            variant={TypographyVariant.H7}
            margin={0}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {this.context.t('secretRecoveryPhraseWarning')}
          </Typography>
        </Box>
      </Box>
    );
  }

  renderContent() {
    return this.state.screen === PASSWORD_PROMPT_SCREEN ? (
      this.renderPasswordPromptContent()
    ) : (
      <RevealSeedContent seedWords={this.state.seedWords} />
    );
  }

  renderPasswordPromptContent() {
    const { t } = this.context;

    return (
      <form onSubmit={() => this.setState({ showPopover: true })}>
        <Typography
          variant={TypographyVariant.H6}
          fontWeight={FONT_WEIGHT.BOLD}
          color={Color.textDefault}
          boxProps={{ paddingBottom: 3 }}
          className="input-label"
          htmlFor="password-box"
        >
          {t('enterPasswordContinue')}
        </Typography>
        <div className="input-group">
          <input
            data-testid="input-password"
            type="password"
            placeholder={t('makeSureNobodyIsLooking')}
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
            onClick={() => {
              this.context.trackEvent({
                category: EVENT.CATEGORIES.KEYS,
                event: EVENT_NAMES.KEY_EXPORT_REQUESTED,
                properties: {
                  key_type: EVENT.KEY_TYPES.SRP,
                },
              });
              this.setState({ showPopover: true });
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
      <Box className="page-container">
        <Box className="page-container__header">
          <Typography
            variant={TypographyVariant.H2}
            className="page-container__title"
          >
            {this.context.t('secretRecoveryPhrase')}
          </Typography>
          <Typography
            className="page-container__subtitle"
            variant={TypographyVariant.H6}
            fontWeight={400}
          >
            {this.context.t('secretRecoveryPhraseDescription', [
              <Button
                key="secret_recovery_phrase_link"
                type="link"
                href="https://metamask.zendesk.com/hc/en-us/articles/4404722782107-User-guide-Secret-Recovery-Phrase-password-and-private-keys"
                rel="noopener noreferrer"
                target="_blank"
                className="settings-page__inline-link"
              >
                {this.context.t('secretRecoveryPhraseDescriptionLink')}
              </Button>,
              <b key="non_custodial_bold">
                {this.context.t('secretRecoveryPhraseDescriptionBold')}
              </b>,
            ])}
          </Typography>
          <Typography
            className="page-container__subtitle"
            variant={TypographyVariant.H6}
            fontWeight={400}
          >
            {this.context.t('secretRecoveryPhraseNonCustodialDescription', [
              <Button
                key="non_custodial_link"
                type="link"
                href="https://metamask.zendesk.com/hc/en-us/articles/360059952212-MetaMask-is-a-non-custodial-wallet"
                rel="noopener noreferrer"
                target="_blank"
                className="settings-page__inline-link"
              >
                {this.context.t(
                  'secretRecoveryPhraseNonCustodialDescriptionLink',
                )}
              </Button>,
              <b key="non_custodial_bold">
                {this.context.t(
                  'secretRecoveryPhraseNonCustodialDescriptionBold',
                )}
              </b>,
            ])}
          </Typography>
        </Box>
        <Box className="page-container__content">
          {this.state.showPopover ? (
            <WarningPopover
              onClose={() => this.setState({ showPopover: false })}
              onClick={(event) => this.handleSubmit(event)}
            />
          ) : null}
          {this.renderWarning()}
          <Box className="reveal-seed__content">{this.renderContent()}</Box>
        </Box>
        {this.renderFooter()}
      </Box>
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
