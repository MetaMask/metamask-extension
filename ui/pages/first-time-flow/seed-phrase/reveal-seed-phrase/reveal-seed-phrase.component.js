import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../../../components/ui/box';
import LockIcon from '../../../../components/ui/lock-icon';
import Button from '../../../../components/ui/button';
import Snackbar from '../../../../components/ui/snackbar';
import {
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
  INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
} from '../../../../helpers/constants/routes';
import { exportAsFile } from '../../../../helpers/utils/util';
import { EVENT } from '../../../../../shared/constants/metametrics';
import { returnToOnboardingInitiatorTab } from '../../onboarding-initiator-util';

export default class RevealSeedPhrase extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
    setSeedPhraseBackedUp: PropTypes.func,
    setCompletedOnboarding: PropTypes.func,
    onboardingInitiator: PropTypes.exact({
      location: PropTypes.string,
      tabId: PropTypes.number,
    }),
  };

  state = {
    isShowingSeedPhrase: false,
  };

  handleExport = () => {
    exportAsFile('', this.props.seedPhrase, 'text/plain');
  };

  handleNext = () => {
    const { isShowingSeedPhrase } = this.state;
    const { history } = this.props;

    this.context.trackEvent({
      category: EVENT.CATEGORIES.ONBOARDING,
      event: 'Advance to Verify',
      properties: {
        action: 'Seed Phrase Setup',
        legacy_event: true,
      },
    });

    if (!isShowingSeedPhrase) {
      return;
    }

    history.replace(INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE);
  };

  handleSkip = async () => {
    const {
      history,
      setSeedPhraseBackedUp,
      setCompletedOnboarding,
      onboardingInitiator,
    } = this.props;

    this.context.trackEvent({
      category: EVENT.CATEGORIES.ONBOARDING,
      event: 'Remind me later',
      properties: {
        action: 'Seed Phrase Setup',
        legacy_event: true,
      },
    });

    await Promise.all([setCompletedOnboarding(), setSeedPhraseBackedUp(false)]);

    if (onboardingInitiator) {
      await returnToOnboardingInitiatorTab(onboardingInitiator);
    }
    history.replace(DEFAULT_ROUTE);
  };

  renderSecretWordsContainer() {
    const { t } = this.context;
    const { seedPhrase } = this.props;
    const { isShowingSeedPhrase } = this.state;

    return (
      <div className="reveal-seed-phrase__secret">
        <div
          className={classnames(
            'reveal-seed-phrase__secret-words notranslate',
            {
              'reveal-seed-phrase__secret-words--hidden': !isShowingSeedPhrase,
            },
          )}
        >
          {seedPhrase}
        </div>
        {!isShowingSeedPhrase && (
          <div
            className="reveal-seed-phrase__secret-blocker"
            onClick={() => {
              this.context.trackEvent({
                category: EVENT.CATEGORIES.ONBOARDING,
                event: 'Revealed Words',
                properties: {
                  action: 'Seed Phrase Setup',
                  legacy_event: true,
                },
              });
              this.setState({ isShowingSeedPhrase: true });
            }}
          >
            <LockIcon
              width="28px"
              height="35px"
              fill="var(--color-overlay-inverse)"
            />
            <div className="reveal-seed-phrase__reveal-button">
              {t('clickToRevealSeed')}
            </div>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const { isShowingSeedPhrase } = this.state;
    const { history, onboardingInitiator } = this.props;

    return (
      <div className="reveal-seed-phrase">
        <div className="seed-phrase__sections">
          <div className="seed-phrase__main">
            <Box marginBottom={4}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(INITIALIZE_SEED_PHRASE_INTRO_ROUTE);
                }}
              >
                {`< ${t('back')}`}
              </a>
            </Box>
            <div className="first-time-flow__header">
              {t('secretRecoveryPhrase')}
            </div>
            <div className="first-time-flow__text-block">
              {t('secretBackupPhraseDescription')}
            </div>
            <div className="first-time-flow__text-block">
              {t('secretBackupPhraseWarning')}
            </div>
            {this.renderSecretWordsContainer()}
          </div>
          <div className="seed-phrase__side">
            <div className="first-time-flow__text-block">{`${t('tips')}:`}</div>
            <div className="first-time-flow__text-block">
              {t('storePhrase')}
            </div>
            <div className="first-time-flow__text-block">
              {t('writePhrase')}
            </div>
            <div className="first-time-flow__text-block">
              {t('memorizePhrase')}
            </div>
            <div className="first-time-flow__text-block">
              <a
                className="reveal-seed-phrase__export-text"
                onClick={this.handleExport}
              >
                {t('downloadSecretBackup')}
              </a>
            </div>
          </div>
        </div>
        <div className="reveal-seed-phrase__buttons">
          <Button
            type="secondary"
            className="first-time-flow__button"
            onClick={this.handleSkip}
          >
            {t('remindMeLater')}
          </Button>
          <Button
            type="primary"
            className="first-time-flow__button"
            onClick={this.handleNext}
            disabled={!isShowingSeedPhrase}
          >
            {t('next')}
          </Button>
        </div>
        {onboardingInitiator ? (
          <Snackbar
            content={t('onboardingReturnNotice', [
              t('remindMeLater'),
              onboardingInitiator.location,
            ])}
          />
        ) : null}
      </div>
    );
  }
}
