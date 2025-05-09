import { EventEmitter } from 'events';
import React, { Component, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  FormTextField,
  Box,
  ButtonLink,
  Button,
  ButtonSize,
  ButtonVariant,
  InputType,
  FormTextFieldSize,
} from '../../components/component-library';
import {
  TextVariant,
  TextColor,
  BlockSize,
  BorderRadius,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
  TextAlign,
} from '../../helpers/constants/design-system';
import Mascot from '../../components/ui/mascot';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { isFlask, isBeta } from '../../helpers/utils/build-types';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { getCaretCoordinates } from './unlock-page.util';
import ResetPasswordModal from './reset-password-modal';
import EraseWalletModal from './erase-wallet-modal';

const formatTimeToUnlock = (timeInSeconds) => {
  if (timeInSeconds <= 60) {
    return `${timeInSeconds}s`;
  } else if (timeInSeconds < 3600) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}m:${seconds.toString().padStart(2, '0')}s`;
  }
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return `${hours}hr:${minutes.toString().padStart(2, '0')}m:${seconds
    .toString()
    .padStart(2, '0')}s`;
};

function Counter({ remainingTime, unlock }) {
  const [time, setTime] = useState(remainingTime);
  const [timeDisplay, setTimeDisplay] = useState(
    formatTimeToUnlock(remainingTime),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = time - 1;
      if (newTime < 0) {
        unlock();
      } else {
        setTime(newTime);
        setTimeDisplay(formatTimeToUnlock(newTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [time, unlock]);

  return <span>{timeDisplay}</span>;
}

Counter.propTypes = {
  remainingTime: PropTypes.number.isRequired,
  unlock: PropTypes.func.isRequired,
};

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
     * onClick handler for "Forgot password?" button
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
    /**
     * Password hint
     */
    passwordHint: PropTypes.string.optional,
  };

  state = {
    password: '',
    error: null,
    showHint: false,
    showResetPasswordModal: false,
    showEraseWalletModal: false,
    isLocked: false,
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
    } catch (error) {
      this.failed_attempts += 1;
      const errorMessage = error instanceof Error ? error.message : error;

      // TODO: add remainingTime and isPermanent on UI
      // remainingTime: seconds
      // isPermanent: boolean
      if (errorMessage === 'Incorrect password') {
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

      this.setState({ error: errorMessage });
      this.submitting = false;
    }
  };

  handleInputChange(event) {
    const { target } = event;
    this.setState({ password: target.value, error: null });

    const element = target;
    const boundingRect = element.getBoundingClientRect();
    const coordinates = getCaretCoordinates(element, element.selectionEnd ?? 0);
    this.animationEventEmitter.emit('point', {
      x: boundingRect.left + coordinates.left - element.scrollLeft,
      y: boundingRect.top + coordinates.top - element.scrollTop,
    });
  }

  renderMascot = () => {
    if (isFlask()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="120" height="120" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="120" height="120" />
      );
    }
    return (
      <Mascot
        animationEventEmitter={this.animationEventEmitter}
        width="120"
        height="120"
      />
    );
  };

  renderHelpText = () => {
    const { error, showHint } = this.state;
    const { passwordHint } = this.props;
    const { t } = this.context;

    if (!error && !showHint) {
      return null;
    }

    return (
      <Box
        className="unlock-page__help-text"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        {error && (
          <Text
            variant={TextVariant.bodySm}
            textAlign={TextAlign.Left}
            color={TextColor.errorDefault}
          >
            {error}
          </Text>
        )}
        {showHint && (
          <Text textAlign={TextAlign.Left} color={TextColor.textMuted}>
            {t('unlockPageHint', [passwordHint])}
          </Text>
        )}
      </Box>
    );
  };

  render() {
    const {
      password,
      error,
      showHint,
      showResetPasswordModal,
      showEraseWalletModal,
      isLocked,
    } = this.state;
    const { t } = this.context;
    const { passwordHint, onRestore } = this.props;

    const needHelpText = t('needHelpLinkText');

    return (
      <div className="unlock-page__container">
        <div className="unlock-page" data-testid="unlock-page">
          <form className="unlock-page__form" onSubmit={this.handleSubmit}>
            <div className="unlock-page__content">
              {showResetPasswordModal && (
                <ResetPasswordModal
                  onClose={() =>
                    this.setState({ showResetPasswordModal: false })
                  }
                  onEraseWallet={() =>
                    this.setState({
                      showResetPasswordModal: false,
                      showEraseWalletModal: true,
                    })
                  }
                />
              )}
              {showEraseWalletModal && (
                <EraseWalletModal
                  onClose={() => this.setState({ showEraseWalletModal: false })}
                  onEraseWallet={() =>
                    // TODO: erase wallet
                    this.setState({ showEraseWalletModal: false })
                  }
                />
              )}
              <div className="unlock-page__mascot-container">
                {this.renderMascot()}
                {isBeta() ? (
                  <div className="unlock-page__mascot-container__beta">
                    {t('beta')}
                  </div>
                ) : null}
              </div>
              <Text
                data-testid="unlock-page-title"
                as="h1"
                variant={TextVariant.headingLg}
                marginTop={1}
                marginBottom={2}
                color={TextColor.textDefault}
              >
                {t('welcomeBack')}
              </Text>
              <FormTextField
                id="password"
                label={
                  <Box
                    display={Display.Flex}
                    width={BlockSize.Full}
                    justifyContent={JustifyContent.spaceBetween}
                    alignItems={AlignItems.center}
                    marginBottom={1}
                  >
                    <Text variant={TextVariant.bodyMdMedium}>
                      {t('password')}
                    </Text>
                    {passwordHint && (
                      <ButtonLink
                        onClick={() => {
                          this.setState({ showHint: !showHint });
                        }}
                      >
                        {showHint ? 'Hide hint' : 'Show hint'}
                      </ButtonLink>
                    )}
                  </Box>
                }
                placeholder={t('enterPassword')}
                size={FormTextFieldSize.Lg}
                inputProps={{
                  'data-testid': 'unlock-password',
                  type: InputType.Password,
                }}
                onChange={(event) => this.handleInputChange(event)}
                error={Boolean(error)}
                helpText={this.renderHelpText()}
                autoComplete
                autoFocus
                disabled={isLocked}
                width={BlockSize.Full}
                textFieldProps={{
                  borderRadius: BorderRadius.LG,
                }}
              />
            </div>
            <div className="unlock-page__footer">
              <Box
                className="unlock-page__buttons"
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                width={BlockSize.Full}
                gap={4}
              >
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  block
                  type="submit"
                  data-testid="unlock-submit"
                  disabled={!password || isLocked}
                >
                  {this.context.t('unlock')}
                </Button>
                <ButtonLink
                  data-testid="unlock-forgot-password-button"
                  key="import-account"
                  onClick={() => onRestore()}
                >
                  {t('forgotPassword')}
                </ButtonLink>
              </Box>
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
          </form>
        </div>
      </div>
    );
  }
}
