import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SeedlessOnboardingControllerError } from '@metamask/seedless-onboarding-controller';
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
  BackgroundColor,
} from '../../helpers/constants/design-system';
import Mascot from '../../components/ui/mascot';
import {
  DEFAULT_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { isFlask, isBeta } from '../../helpers/utils/build-types';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { getCaretCoordinates } from './unlock-page.util';
import ResetPasswordModal from './reset-password-modal';
import FormattedCounter from './formatted-counter';

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
     * Whether the seedless password is outdated
     */
    isSeedlessPasswordOutdated: PropTypes.bool,
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
  };

  state = {
    password: '',
    error: null,
    showResetPasswordModal: false,
    isLocked: false,
    isSubmitting: false,
  };

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  UNSAFE_componentWillMount() {
    const { isUnlocked, history, isSeedlessPasswordOutdated } = this.props;

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE);
      return;
    }

    if (isSeedlessPasswordOutdated) {
      // first error if seedless password is outdated
      const { t } = this.context;
      this.setState({ error: t('passwordChangedRecently') });
    }
  }

  componentDidUpdate(prevProps) {
    if (
      !prevProps.isSeedlessPasswordOutdated &&
      prevProps.isSeedlessPasswordOutdated !==
        this.props.isSeedlessPasswordOutdated
    ) {
      this.setState({ error: this.context.t('passwordChangedRecently') });
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { password } = this.state;
    const { onSubmit } = this.props;

    if (password === '' || this.submitting) {
      return;
    }

    this.setState({ error: null, isSubmitting: true });

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
      await this.handleLoginError(error);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleLoginError = async (error) => {
    const { t } = this.context;
    this.failed_attempts += 1;
    const { message, data } = error;
    let finalErrorMessage = message;
    let errorReason;
    let isLocked = false;

    switch (message) {
      case 'Incorrect password':
      case SeedlessOnboardingControllerError.IncorrectPassword:
        finalErrorMessage = t('unlockPageIncorrectPassword');
        errorReason = 'incorrect_password';
        break;
      case SeedlessOnboardingControllerError.TooManyLoginAttempts:
        isLocked = true;

        // TODO: check if we need to remove this
        if (data.isPermanent) {
          finalErrorMessage = t('unlockPageTooManyFailedAttemptsPermanent');
        } else {
          const initialRemainingTime = data.remainingTime;
          finalErrorMessage = t('unlockPageTooManyFailedAttempts', [
            <FormattedCounter
              key="unlockPageTooManyFailedAttempts"
              remainingTime={initialRemainingTime}
              unlock={() => this.setState({ isLocked: false, error: '' })}
            />,
          ]);
        }
        errorReason = 'too_many_login_attempts';
        break;
      case 'Seed phrase not found':
        this.props.history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
        return;
      default:
        finalErrorMessage = message;
        break;
    }

    if (errorReason) {
      await this.props.forceUpdateMetamaskState();
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.AppUnlockedFailed,
        properties: {
          reason: errorReason,
          failed_attempts: this.failed_attempts,
        },
      });
    }
    this.setState({ error: finalErrorMessage, isLocked });
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
    const { error } = this.state;

    if (!error) {
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
      </Box>
    );
  };

  onForgotPassword = () => {
    this.setState({ showResetPasswordModal: true });
  };

  render() {
    const { password, error, isLocked, isSubmitting, showResetPasswordModal } =
      this.state;
    const { t } = this.context;

    const needHelpText = t('needHelpLinkText');

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        width={BlockSize.Full}
        height={BlockSize.Full}
        marginTop={0}
        marginBottom="auto"
        marginInline={0}
        className="unlock-page__container"
      >
        {showResetPasswordModal && (
          <ResetPasswordModal
            onClose={() => this.setState({ showResetPasswordModal: false })}
            onRestore={() => this.props.onRestore()}
          />
        )}
        <Box
          as="form"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          margin="auto"
          padding={6}
          width={BlockSize.Full}
          height={BlockSize.Full}
          borderRadius={BorderRadius.LG}
          gap={6}
          className="unlock-page"
          data-testid="unlock-page"
          onSubmit={this.handleSubmit}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
            alignItems={AlignItems.center}
          >
            <Box marginTop={6} className="unlock-page__mascot-container">
              {this.renderMascot()}
              {isBeta() ? (
                <Box className="unlock-page__mascot-container__beta">
                  {t('beta')}
                </Box>
              ) : null}
            </Box>
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
              value={password}
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
              autoComplete="current-password"
              autoFocus
              disabled={isLocked}
              width={BlockSize.Full}
              textFieldProps={{
                borderRadius: BorderRadius.LG,
              }}
            />
          </Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
            alignItems={AlignItems.center}
          >
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
                disabled={!password || isLocked || isSubmitting}
                loading={isSubmitting}
              >
                {this.context.t('unlock')}
              </Button>
              <ButtonLink
                data-testid="unlock-forgot-password-button"
                key="import-account"
                type="button"
                onClick={() => this.onForgotPassword()}
              >
                {t('forgotPassword')}
              </ButtonLink>
            </Box>
            <Box marginTop={6} className="unlock-page__support">
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
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
}
