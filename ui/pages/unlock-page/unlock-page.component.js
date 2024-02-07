import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import TextField from '../../components/ui/text-field';
import Mascot from '../../components/ui/mascot';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { isBeta } from '../../helpers/utils/build-types';
import { getCaretCoordinates } from './unlock-page.util';

export default class UnlockPage extends Component {
  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  static propTypes = {
    /**
     * History router for redirect after action
     */
    history: PropTypes.object.isRequired,
    /**
     * If isUnlocked is true will redirect to most recent route in history
     */
    isUnlocked: PropTypes.bool,
    /**
     * onClick handler for "Forgot password?" link
     */
    onRestore: PropTypes.func,
    /**
     * onSubmit handler when form is submitted
     */
    onSubmit: PropTypes.func,
    /**
     * Force update metamask data state
     */
    forceUpdateMetamaskState: PropTypes.func,
  };

  state = {
    password: '',
    error: null,
  };

  submitting = false;

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  UNSAFE_componentWillMount() {
    const { isUnlocked, history } = this.props;

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE);
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { password } = this.state;
    const { onSubmit, forceUpdateMetamaskState } = this.props;

    if (password === '' || this.submitting) {
      return;
    }

    this.setState({ error: null });
    this.submitting = true;

    try {
      await onSubmit(password);
      this.context.trackEvent(
        {
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlocked,
          properties: {
            failed_attempts: this.failed_attempts,
          },
        },
        {
          isNewVisit: true,
        },
      );
    } catch ({ message }) {
      this.failed_attempts += 1;

      if (message === 'Incorrect password') {
        await forceUpdateMetamaskState();
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlockedFailed,
          properties: {
            reason: 'incorrect_password',
            failed_attempts: this.failed_attempts,
          },
        });
      }

      this.setState({ error: message });
      this.submitting = false;
    }
  };

  handleInputChange({ target }) {
    this.setState({ password: target.value, error: null });
    // tell mascot to look at page action
    if (target.getBoundingClientRect) {
      const element = target;
      const boundingRect = element.getBoundingClientRect();
      const coordinates = getCaretCoordinates(element, element.selectionEnd);
      this.animationEventEmitter.emit('point', {
        x: boundingRect.left + coordinates.left - element.scrollLeft,
        y: boundingRect.top + coordinates.top - element.scrollTop,
      });
    }
  }

  renderSubmitButton() {
    const style = {
      backgroundColor: 'var(--color-primary-default)',
      color: 'var(--color-primary-inverse)',
      marginTop: '20px',
      height: '60px',
      fontWeight: '400',
      boxShadow: 'none',
      borderRadius: '100px',
    };

    return (
      <Button
        type="submit"
        data-testid="unlock-submit"
        style={style}
        disabled={!this.state.password}
        variant="contained"
        size="large"
        onClick={this.handleSubmit}
      >
        {this.context.t('unlock')}
      </Button>
    );
  }

  render() {
    const { password, error } = this.state;
    const { t } = this.context;
    const { onRestore } = this.props;

    let needHelpText = t('appNameMmi');

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    needHelpText = t('needHelpLinkText');
    ///: END:ONLY_INCLUDE_IF

    return (
      <div className="unlock-page__container">
        <div className="unlock-page" data-testid="unlock-page">
          <div className="unlock-page__mascot-container">
            <Mascot
              animationEventEmitter={this.animationEventEmitter}
              width="120"
              height="120"
            />
            {isBeta() ? (
              <div className="unlock-page__mascot-container__beta">
                {t('beta')}
              </div>
            ) : null}
          </div>
          <h1 className="unlock-page__title">{t('welcomeBack')}</h1>
          <div>{t('unlockMessage')}</div>
          <form className="unlock-page__form" onSubmit={this.handleSubmit}>
            <TextField
              id="password"
              data-testid="unlock-password"
              label={t('password')}
              type="password"
              value={password}
              onChange={(event) => this.handleInputChange(event)}
              error={error}
              autoFocus
              autoComplete="current-password"
              theme="material"
              fullWidth
            />
          </form>
          {this.renderSubmitButton()}
          <div className="unlock-page__links">
            <Button
              type="link"
              key="import-account"
              className="unlock-page__link"
              onClick={() => onRestore()}
            >
              {t('forgotPassword')}
            </Button>
          </div>
          <div className="unlock-page__support">
            {t('needHelp', [
              <a
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="need-help-link"
                onClick={() => {
                  this.context.trackEvent(
                    {
                      category: MetaMetricsEventCategory.Navigation,
                      event: MetaMetricsEventName.SupportLinkClicked,
                      properties: {
                        url: SUPPORT_LINK,
                      },
                    },
                    {
                      contextPropsIntoEventProperties: [
                        MetaMetricsContextProp.PageTitle,
                      ],
                    },
                  );
                }}
              >
                {needHelpText}
              </a>,
            ])}
          </div>
        </div>
      </div>
    );
  }
}
