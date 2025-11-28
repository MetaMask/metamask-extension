import { EventEmitter } from 'events';
import React, { Component, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { SeedlessOnboardingControllerErrorMessage } from '@metamask/seedless-onboarding-controller';
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
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { withMetaMetrics } from '../../contexts/metametrics';
import LoginErrorModal from '../onboarding-flow/welcome/login-error-modal';
import { LOGIN_ERROR } from '../onboarding-flow/welcome/types';
import ConnectionsRemovedModal from '../../components/app/connections-removed-modal';
import { getCaretCoordinates } from './unlock-page.util';
import ResetPasswordModal from './reset-password-modal';
import FormattedCounter from './formatted-counter';
import { MetamaskWordmarkLogo } from './metamask-wordmark-logo';

const FoxAppearAnimation = lazy(
  () => import('../onboarding-flow/welcome/fox-appear-animation'),
);

class UnlockPage extends Component {
  static contextTypes = {
    trackEvent: PropTypes.func,
    bufferedTrace: PropTypes.func,
    bufferedEndTrace: PropTypes.func,
    t: PropTypes.func,
  };

  static propTypes = {
    /**
     * navigate function for redirect after action
     */
    navigate: PropTypes.func.isRequired,
    /**
     * Location router for redirect after action
     */
    location: PropTypes.object.isRequired,
    /**
     * Navigation state from v5-compat navigation context
     */
    navState: PropTypes.object,
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
     * check if the seedless onboarding user is authenticated for social login flow to do the rehydration
     */
    getIsSeedlessOnboardingUserAuthenticated: PropTypes.func,
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
    /**
     * Reset Onboarding and OAuth login state
     */
    loginWithDifferentMethod: PropTypes.func,
    /**
     * Indicates the type of first time flow
     */
    firstTimeFlowType: PropTypes.string,
    /**
     * Reset Wallet
     */
    resetWallet: PropTypes.func,
    /**
     * Indicates if the environment is a popup
     */
    isPopup: PropTypes.bool,
  };

  state = {
    password: '',
    error: null,
    showResetPasswordModal: false,
    isLocked: false,
    isSubmitting: false,
    unlockDelayPeriod: 0,
    showLoginErrorModal: false,
    showConnectionsRemovedModal: false,
  };

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  /**
   * Determines if the current user is in the social import rehydration phase
   *
   * @returns {boolean} True if user is importing social wallet during onboarding
   */
  isSocialImportRehydration() {
    return (
      this.props.firstTimeFlowType === FirstTimeFlowType.socialImport &&
      !this.props.isOnboardingCompleted
    );
  }

  UNSAFE_componentWillMount() {
    const { isUnlocked, navigate, location, navState } = this.props;

    if (isUnlocked) {
      // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
      let redirectTo = DEFAULT_ROUTE;
      // Read from both v5 location.state and v5-compat navState
      const fromLocation = location.state?.from || navState?.from;
      if (fromLocation?.pathname) {
        const search = fromLocation.search || '';
        redirectTo = fromLocation.pathname + search;
      }
      navigate(redirectTo);
    }
  }

  async componentDidMount() {
    const { isOnboardingCompleted, isSocialLoginFlow } = this.props;
    if (isOnboardingCompleted) {
      await this.props.checkIsSeedlessPasswordOutdated();
    } else if (isSocialLoginFlow) {
      // if the onboarding is not completed, check if the seedless onboarding user is authenticated to do the rehydration
      // we have to consider the case where required tokens for rehydration are removed when user closed the browser app after social login is completed.
      const isAuthenticated =
        await this.props.getIsSeedlessOnboardingUserAuthenticated();
      if (!isAuthenticated) {
        // if the seedless onboarding user is not authenticated, redirect to the onboarding welcome page
        this.props.navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
      }
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { password, isSubmitting } = this.state;
    const { onSubmit, isOnboardingCompleted } = this.props;

    if (password === '' || isSubmitting) {
      return;
    }

    this.setState({ error: null, isSubmitting: true });

    // Capture the rehydration state before async operations that might change it
    const isRehydrationFlow = this.isSocialImportRehydration();

    // Track wallet rehydration attempted for social import users (only during rehydration)
    if (isRehydrationFlow) {
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.RehydrationPasswordAttempted,
        properties: {
          account_type: 'social',
          biometrics: false,
        },
      });
    } else if (!isOnboardingCompleted) {
      this.context.bufferedTrace?.({
        name: TraceName.OnboardingPasswordLoginAttempt,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: this.props.onboardingParentContext?.current,
      });
    }

    try {
      await onSubmit(password);

      // Track wallet rehydration completed for social import users (only during rehydration)
      if (isRehydrationFlow) {
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.RehydrationCompleted,
          properties: {
            account_type: 'social',
            biometrics: false,
            failed_attempts: this.failed_attempts,
          },
        });
        this.context.bufferedEndTrace?.({
          name: TraceName.OnboardingExistingSocialLogin,
        });
      }

      if (!isOnboardingCompleted) {
        this.context.bufferedEndTrace?.({
          name: TraceName.OnboardingPasswordLoginAttempt,
        });
        this.context.bufferedEndTrace?.({
          name: TraceName.OnboardingJourneyOverall,
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
    } catch (error) {
      await this.handleLoginError(error, isRehydrationFlow);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleLoginError = async (error, isRehydrationFlow = false) => {
    const { t } = this.context;
    const { message, data } = error;
    const { isOnboardingCompleted } = this.props;

    // Sync failed_attempts with numberOfAttempts from error data
    if (data?.numberOfAttempts !== undefined) {
      this.failed_attempts = data.numberOfAttempts;
    }

    let finalErrorMessage = message;
    let finalUnlockDelayPeriod = 0;
    let errorReason;
    let shouldShowLoginErrorModal = false;
    let shouldShowConnectionsRemovedModal = false;

    // Check if we are in the onboarding flow
    if (!isOnboardingCompleted) {
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
      case SeedlessOnboardingControllerErrorMessage.AuthenticationError:
      case SeedlessOnboardingControllerErrorMessage.InvalidRevokeToken:
      case SeedlessOnboardingControllerErrorMessage.InvalidRefreshToken:
        if (isOnboardingCompleted) {
          finalErrorMessage = message;
          shouldShowLoginErrorModal = true;
        }
        break;
      case SeedlessOnboardingControllerErrorMessage.MaxKeyChainLengthExceeded:
        finalErrorMessage = message;
        shouldShowConnectionsRemovedModal = true;
        break;
      default:
        finalErrorMessage = message;
        break;
    }

    if (errorReason) {
      await this.props.forceUpdateMetamaskState();
      // Track wallet rehydration failed for social import users (only during rehydration)
      if (isRehydrationFlow) {
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.RehydrationPasswordFailed,
          properties: {
            account_type: 'social',
            failed_attempts: this.failed_attempts,
            error_type: errorReason,
          },
        });
      }
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
      showLoginErrorModal: shouldShowLoginErrorModal,
      showConnectionsRemovedModal: shouldShowConnectionsRemovedModal,
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

  onForgotPasswordOrLoginWithDiffMethods = async () => {
    const { isSocialLoginFlow, navigate, isOnboardingCompleted } = this.props;

    // in `onboarding_unlock` route, if the user is on a social login flow and onboarding is not completed,
    // we can redirect to `onboarding_welcome` route to select a different login method
    if (!isOnboardingCompleted && isSocialLoginFlow) {
      // Track when user clicks "Use a different login method" during rehydration
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.UseDifferentLoginMethodClicked,
        properties: {
          account_type: 'social',
        },
      });

      await this.props.loginWithDifferentMethod();
      await this.props.forceUpdateMetamaskState();
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
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

  onRestoreWallet = async () => {
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

  onResetWallet = async () => {
    this.setState({
      showLoginErrorModal: false,
      showConnectionsRemovedModal: false,
      showResetPasswordModal: false,
    });
    await this.props.resetWallet();
    await this.props.forceUpdateMetamaskState();
    this.props.navigate(DEFAULT_ROUTE, { replace: true });
  };

  render() {
    const {
      password,
      error,
      isLocked,
      showResetPasswordModal,
      showLoginErrorModal,
      showConnectionsRemovedModal,
    } = this.state;
    const { isOnboardingCompleted, isSocialLoginFlow } = this.props;
    const { t } = this.context;

    const needHelpText = t('needHelpLinkText');
    const isRehydrationFlow = isSocialLoginFlow && !isOnboardingCompleted;

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
        {showLoginErrorModal && (
          <LoginErrorModal
            onDone={this.onResetWallet}
            loginError={LOGIN_ERROR.RESET_WALLET}
          />
        )}
        {showConnectionsRemovedModal && (
          <ConnectionsRemovedModal onConfirm={this.onResetWallet} />
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
              {isRehydrationFlow ? (
                this.renderMascot()
              ) : (
                <MetamaskWordmarkLogo isPopup={this.props.isPopup} />
              )}
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
            {isRehydrationFlow && (
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
            )}
            <FormTextField
              id="password"
              placeholder={
                this.props.isSocialLoginFlow
                  ? t('enterYourPasswordSocialLoginFlow')
                  : t('enterYourPassword')
              }
              size={FormTextFieldSize.Lg}
              placeholderColor={TextColor.textDefault}
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
              onClick={this.onForgotPasswordOrLoginWithDiffMethods}
              marginBottom={4}
              color={
                isRehydrationFlow
                  ? TextColor.textDefault
                  : TextColor.primaryDefault
              }
            >
              {isRehydrationFlow
                ? t('useDifferentLoginMethod')
                : t('forgotPassword')}
            </Button>

            <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
              {t('needHelp', [
                <Button
                  variant={ButtonVariant.Link}
                  color={TextColor.primaryDefault}
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
        {!isRehydrationFlow && (
          <Suspense fallback={<Box />}>
            <FoxAppearAnimation />
          </Suspense>
        )}
      </Box>
    );
  }
}

export default withMetaMetrics(UnlockPage);
