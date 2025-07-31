import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SeedlessOnboardingControllerErrorMessage } from '@metamask/seedless-onboarding-controller';
import log from 'loglevel';
import {
  Text,
  FormTextField,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  TextFieldType,
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
  TextTransform,
  FontWeight,
} from '../../helpers/constants/design-system';
import Mascot from '../../components/ui/mascot';
import {
  DEFAULT_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { isFlask, isBeta } from '../../helpers/utils/build-types';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { withMetaMetrics } from '../../contexts/metametrics';
import { getCaretCoordinates } from './unlock-page.util';
import ResetPasswordModal from './reset-password-modal';
import FormattedCounter from './formatted-counter';

class UnlockPage extends Component {
  static contextTypes = {
    trackEvent: PropTypes.func,
    bufferedTrace: PropTypes.func,
    bufferedEndTrace: PropTypes.func,
    t: PropTypes.func,
  };

  static propTypes = {
    /**
     * History router for redirect after action
     */
    history: PropTypes.object.isRequired,
    /**
     * Location router for redirect after action
     */
    location: PropTypes.object.isRequired,
    /**
     * If isUnlocked is true will redirect to most recent route in history
     */
    isUnlocked: PropTypes.bool,
    /**
     * If isOnboardingCompleted is true, `Use a different login method` button
     * will be shown instead of `Forgot password?`
     */
    isOnboardingCompleted: PropTypes.bool,
    /**
     * onClick handler for "Forgot password?" link
     */
    onRestore: PropTypes.func,
    /**
     * onSubmit handler when form is submitted
     */
    onSubmit: PropTypes.func,
    /**
     * check password is outdated for social login flow
     */
    checkIsSeedlessPasswordOutdated: PropTypes.func,
    /**
     * Force update metamask data state
     */
    forceUpdateMetamaskState: PropTypes.func,
    /**
     * isSocialLoginFlow. True if the user is on a social login flow
     */
    isSocialLoginFlow: PropTypes.bool,
    /**
     * Sentry trace context ref for onboarding journey tracing
     */
    onboardingParentContext: PropTypes.object,
  };

  state = {
    password: '',
    error: null,
    showResetPasswordModal: false,
    isLocked: false,
    isSubmitting: false,
    unlockDelayPeriod: 0,
  };

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  passwordLoginAttemptTraceCtx = null;

  UNSAFE_componentWillMount() {
    const { isUnlocked, history, location } = this.props;

    if (isUnlocked) {
      // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
      let redirectTo = DEFAULT_ROUTE;
      if (location.state?.from?.pathname) {
        const search = location.state.from.search || '';
        redirectTo = location.state.from.pathname + search;
      }
      history.push(redirectTo);
    }
  }

  async componentDidMount() {
    this.passwordLoginAttemptTraceCtx = this.context.bufferedTrace?.({
      name: TraceName.OnboardingPasswordLoginAttempt,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: this.props.onboardingParentContext?.current,
    });

    try {
      await this.props.checkIsSeedlessPasswordOutdated();
    } catch (error) {
      log.error('unlock page - checkIsSeedlessPasswordOutdated error', error);
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { password, isSubmitting } = this.state;
    const { onSubmit } = this.props;

    if (password === '' || isSubmitting) {
      return;
    }

    this.setState({ error: null, isSubmitting: true });

    // Track wallet rehydration attempted for social login users
    if (this.props.isSocialLoginFlow) {
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.RehydrationPasswordAttempted,
        properties: {
          account_type: 'social',
          biometrics: false,
        },
      });
    }

    try {
      await onSubmit(password);

      // Track wallet rehydration completed for social login users
      if (this.props.isSocialLoginFlow) {
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.RehydrationCompleted,
          properties: {
            account_type: 'social',
            biometrics: false,
            failed_attempts: this.failed_attempts,
          },
        });
      }

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
      if (this.passwordLoginAttemptTraceCtx) {
        this.context.bufferedEndTrace?.({
          name: TraceName.OnboardingPasswordLoginAttempt,
        });
        this.passwordLoginAttemptTraceCtx = null;
      }
      this.context.bufferedEndTrace?.({
        name: TraceName.OnboardingExistingSocialLogin,
      });
      this.context.bufferedEndTrace?.({
        name: TraceName.OnboardingJourneyOverall,
      });
    } catch (error) {
      await this.handleLoginError(error);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleLoginError = async (error) => {
    const { t } = this.context;
    const { message, data } = error;

    // Sync failed_attempts with numberOfAttempts from error data
    if (data?.numberOfAttempts !== undefined) {
      this.failed_attempts = data.numberOfAttempts;
    }

    let finalErrorMessage = message;
    let finalUnlockDelayPeriod = 0;
    let errorReason;

    // Track wallet rehydration failed for social login users
    if (this.props.isSocialLoginFlow) {
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.RehydrationPasswordFailed,
        properties: {
          account_type: 'social',
          failed_attempts: this.failed_attempts,
        },
      });
    }

    // Check if we are in the onboarding flow
    if (this.props.onboardingParentContext?.current) {
      this.context.bufferedTrace?.({
        name: TraceName.OnboardingPasswordLoginError,
        op: TraceOperation.OnboardingError,
        tags: { errorMessage: message },
        parentContext: this.props.onboardingParentContext.current,
      });
      this.context.bufferedEndTrace?.({
        name: TraceName.OnboardingPasswordLoginError,
      });
    }

    switch (message) {
      case 'Incorrect password':
      case SeedlessOnboardingControllerErrorMessage.IncorrectPassword:
        finalErrorMessage = t('unlockPageIncorrectPassword');
        errorReason = 'incorrect_password';
        break;
      case SeedlessOnboardingControllerErrorMessage.TooManyLoginAttempts:
        this.setState({ isLocked: true });

        finalErrorMessage = t('unlockPageTooManyFailedAttempts');
        errorReason = 'too_many_login_attempts';
        finalUnlockDelayPeriod = data.remainingTime;
        break;
      case SeedlessOnboardingControllerErrorMessage.OutdatedPassword:
        finalErrorMessage = t('passwordChangedRecently');
        errorReason = 'outdated_password';
        break;
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
    this.setState({
      error: finalErrorMessage,
      unlockDelayPeriod: finalUnlockDelayPeriod,
    });
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
        <img src="./images/logo/metamask-fox.svg" width="115" height="115" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="115" height="115" />
      );
    }
    return (
      <Mascot
        animationEventEmitter={this.animationEventEmitter}
        width="170"
        height="170"
      />
    );
  };

  renderHelpText = () => {
    const { error, unlockDelayPeriod } = this.state;

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
            data-testid="unlock-page-help-text"
            variant={TextVariant.bodySm}
            textAlign={TextAlign.Left}
            color={TextColor.errorDefault}
          >
            {error}
            {unlockDelayPeriod > 0 && (
              <FormattedCounter
                startFrom={unlockDelayPeriod}
                onCountdownEnd={() =>
                  this.setState({
                    isLocked: false,
                    error: null,
                    unlockDelayPeriod: 0,
                  })
                }
              />
            )}
          </Text>
        )}
      </Box>
    );
  };

  onForgotPasswordOrLoginWithDiffMethods = () => {
    const { isSocialLoginFlow, history, isOnboardingCompleted } = this.props;

    // in `onboarding_unlock` route, if the user is on a social login flow and onboarding is not completed,
    // we can redirect to `onboarding_welcome` route to select a different login method
    if (!isOnboardingCompleted && isSocialLoginFlow) {
      history.replace(ONBOARDING_WELCOME_ROUTE);
      return;
    }

    this.context.trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.ForgotPasswordClicked,
      properties: {
        account_type: isSocialLoginFlow ? 'social' : 'metamask',
      },
    });

    this.setState({ showResetPasswordModal: true });
  };

  onRestoreWallet = () => {
    const { isSocialLoginFlow } = this.props;

    this.context.trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.ResetWallet,
      properties: {
        account_type: isSocialLoginFlow ? 'social' : 'metamask',
      },
    });
    this.props.onRestore();
  };

  render() {
    const { password, error, isLocked, showResetPasswordModal } = this.state;
    const { isOnboardingCompleted, isSocialLoginFlow } = this.props;
    const { t } = this.context;

    const needHelpText = t('needHelpLinkText');

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        width={BlockSize.Full}
        paddingBottom={12} // offset header to center content
      >
        {showResetPasswordModal && (
          <ResetPasswordModal
            onClose={() => this.setState({ showResetPasswordModal: false })}
            onRestore={this.onRestoreWallet}
          />
        )}
        <Box
          as="form"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          padding={4}
          width={BlockSize.Full}
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
            <Box
              className="unlock-page__mascot-container"
              marginBottom={isBeta() || isFlask() ? 6 : 0}
            >
              {this.renderMascot()}
              {isBeta() ? (
                <Text
                  className="unlock-page__mascot-container__beta"
                  backgroundColor={BackgroundColor.primaryDefault}
                  color={TextColor.primaryInverse}
                  padding={1}
                  borderRadius={BorderRadius.LG}
                  textTransform={TextTransform.Uppercase}
                  fontWeight={FontWeight.Medium}
                >
                  {t('beta')}
                </Text>
              ) : null}
            </Box>
            <Text
              data-testid="unlock-page-title"
              as="h1"
              variant={TextVariant.displayMd}
              marginBottom={12}
              fontWeight={FontWeight.Medium}
              color={TextColor.textDefault}
              textAlign={TextAlign.Center}
            >
              {t('welcomeBack')}
            </Text>
            <FormTextField
              id="password"
              placeholder={
                this.props.isSocialLoginFlow
                  ? t('enterYourPasswordSocialLoginFlow')
                  : t('enterYourPassword')
              }
              size={FormTextFieldSize.Lg}
              inputProps={{
                'data-testid': 'unlock-password',
                'aria-label': t('password'),
              }}
              textFieldProps={{
                disabled: isLocked,
              }}
              onChange={(event) => this.handleInputChange(event)}
              type={TextFieldType.Password}
              value={password}
              error={Boolean(error)}
              helpText={this.renderHelpText()}
              autoComplete
              autoFocus
              width={BlockSize.Full}
              marginBottom={4}
            />
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              type="submit"
              data-testid="unlock-submit"
              disabled={!password || isLocked}
              marginBottom={6}
            >
              {this.context.t('unlock')}
            </Button>

            <Button
              variant={ButtonVariant.Link}
              data-testid="unlock-forgot-password-button"
              key="import-account"
              type="button"
              onClick={() => this.onForgotPasswordOrLoginWithDiffMethods()}
              marginBottom={6}
            >
              {isSocialLoginFlow && !isOnboardingCompleted
                ? t('useDifferentLoginMethod')
                : t('forgotPassword')}
            </Button>

            <Text>
              {t('needHelp', [
                <Button
                  variant={ButtonVariant.Link}
                  href={SUPPORT_LINK}
                  type="button"
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
                </Button>,
              ])}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }
}

export default withMetaMetrics(UnlockPage);
