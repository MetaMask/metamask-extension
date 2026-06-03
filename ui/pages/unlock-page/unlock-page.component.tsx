import { EventEmitter } from 'events';
import React, {
  Component,
  ComponentType,
  lazy,
  Suspense,
  FormEvent,
  ChangeEvent,
  MutableRefObject,
} from 'react';
import PropTypes from 'prop-types';
import { Location as RouterLocation, NavigateFunction } from 'react-router-dom';
import { SeedlessOnboardingControllerErrorMessage } from '@metamask/seedless-onboarding-controller';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  TextVariant,
  TextColor,
  FontWeight,
  Text,
  Box,
  TextButton,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxBackgroundColor,
  TextAlign,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  FormTextField,
  TextFieldType,
  FormTextFieldSize,
} from '../../components/component-library';
import {
  BlockSize,
  TextTransform,
} from '../../helpers/constants/design-system';
import Mascot from '../../components/ui/mascot';
import {
  DEFAULT_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  UNLOCK_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { cancelPasskeyCeremony } from '../../../shared/lib/passkey';
import { isFlask, isBeta } from '../../../shared/lib/build-types';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { withMetaMetrics } from '../../contexts/metametrics';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import LoginErrorModal from '../onboarding-flow/welcome/login-error-modal';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { LOGIN_ERROR } from '../onboarding-flow/welcome/types';
import ConnectionsRemovedModal from '../../components/app/connections-removed-modal';
import { captureException } from '../../../shared/lib/sentry';
import { getCaretCoordinates } from './unlock-page.util';
import { UnlockPasskeyIconButton, UnlockPasskeySection } from './passkey';
import ResetPasswordModal from './reset-password-modal';
import FormattedCounter from './formatted-counter';
import { MetamaskWordmarkLogo } from './metamask-wordmark-logo';

type UnlockPageProps = {
  navigate: NavigateFunction;
  location: RouterLocation;
  isUnlocked: boolean;
  isOnboardingCompleted: boolean;
  onSubmit: (password: string) => Promise<void>;
  navigateAfterUnlock: () => Promise<void>;
  isPasskeyActive: boolean;
  onUnlockWithPasskey: (
    authenticationResponse: PasskeyAuthenticationResponse,
  ) => Promise<void>;
  checkIsSeedlessPasswordOutdated: () => Promise<void>;
  getIsSeedlessOnboardingUserAuthenticated: () => Promise<boolean>;
  forceUpdateMetamaskState: () => Promise<void>;
  isSocialLoginFlow: boolean;
  onboardingParentContext: MutableRefObject<unknown>;
  loginWithDifferentMethod: () => Promise<void>;
  firstTimeFlowType: string | null;
  isPopup: boolean;
  accountTypeForMetrics: string;
  isWalletResetInProgress: boolean;
  passkeyAutoUnlockSuppressed: boolean;
  /** When true, passkey ceremony must run in a browser tab (sidepanel + incompatible AAGUID). */
  mustDeferPasskeyToBrowserTab: boolean;
};

type UnlockPageState = {
  password: string;
  error: string | null;
  showResetPasswordModal: boolean;
  isLocked: boolean;
  isSubmitting: boolean;
  unlockDelayPeriod: number;
  showLoginErrorModal: boolean;
  showConnectionsRemovedModal: boolean;
  isPasswordUnlockMode: boolean;
};

type UnlockPageContext = {
  trackEvent: (event: object, options?: object) => void;
  bufferedTrace: (trace: object) => void;
  bufferedEndTrace: (trace: object) => void;
  t: (key: string, args?: unknown[]) => string;
};

type LoginError = {
  message: string;
  data?: {
    numberOfAttempts?: number;
    remainingTime?: number;
  };
};

const FoxAppearAnimation = lazy(
  () =>
    // @ts-expect-error - Build system resolves without extension, but TS wants .js
    // eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
    import('../onboarding-flow/welcome/fox-appear-animation') as Promise<{
      default: ComponentType<{
        isLoader?: boolean;
        skipTransition?: boolean;
      }>;
    }>,
);

class UnlockPage extends Component<UnlockPageProps, UnlockPageState> {
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
     * If isUnlocked is true will redirect to most recent route in history
     */
    isUnlocked: PropTypes.bool,
    /**
     * If isOnboardingCompleted is true, `Use a different login method` button
     * will be shown instead of `Forgot password?`
     */
    isOnboardingCompleted: PropTypes.bool,
    /**
     * onSubmit handler when form is submitted
     */
    onSubmit: PropTypes.func,
    /**
     * Redirects after a successful unlock.
     */
    navigateAfterUnlock: PropTypes.func,
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
     * Indicates if the environment is a popup
     */
    isPopup: PropTypes.bool,
    /**
     * Indicates the account type for onboarding metrics
     */
    accountTypeForMetrics: PropTypes.string,
    /**
     * Indicates if the wallet is reset in progress
     */
    isWalletResetInProgress: PropTypes.bool,
    /**
     * True when passkey unlock is available (feature on, registered, not social rehydration, onboarding done).
     */
    isPasskeyActive: PropTypes.bool,
    /**
     * When true, do not auto-start WebAuthn (after UI-initiated lock; background + timer).
     */
    passkeyAutoUnlockSuppressed: PropTypes.bool,
    /**
     * When true, passkey unlock UI defers ceremony to a full extension tab (sidepanel + incompatible AAGUID).
     */
    mustDeferPasskeyToBrowserTab: PropTypes.bool,
    /**
     * Completes passkey unlock and navigates after success (same redirect rules as password onSubmit).
     */
    onUnlockWithPasskey: PropTypes.func,
  };

  state: UnlockPageState = {
    password: '',
    error: null,
    showResetPasswordModal: false,
    isLocked: false,
    isSubmitting: false,
    unlockDelayPeriod: 0,
    showLoginErrorModal: false,
    showConnectionsRemovedModal: false,
    isPasswordUnlockMode: true,
  };

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  /**
   * Determines if the current user is in the social import rehydration phase
   *
   * @returns True if user is importing social wallet during onboarding
   */
  isSocialImportRehydration() {
    return (
      this.props.firstTimeFlowType === FirstTimeFlowType.socialImport &&
      !this.props.isOnboardingCompleted
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  UNSAFE_componentWillMount() {
    const { isUnlocked, navigate, location, isPasskeyActive } = this.props;

    this.setState({
      isPasswordUnlockMode: !isPasskeyActive,
    });

    if (isUnlocked) {
      // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
      let redirectTo = DEFAULT_ROUTE;
      const fromLocation = location.state?.from;
      if (fromLocation?.pathname) {
        const search = fromLocation.search || '';
        redirectTo = fromLocation.pathname + search;
      }
      navigate(redirectTo, { replace: true });
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
        return;
      }
    }
    if (
      this.props.isWalletResetInProgress &&
      this.props.firstTimeFlowType === null
    ) {
      this.props.navigate(DEFAULT_ROUTE, { replace: true });
    }
  }

  handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const { password, isSubmitting } = this.state;
    const { onSubmit, isOnboardingCompleted, accountTypeForMetrics } =
      this.props;

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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
          biometrics: false,
        },
      });
    } else if (!isOnboardingCompleted) {
      this.context.bufferedTrace({
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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: accountTypeForMetrics,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            biometrics: false,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failed_attempts: this.failed_attempts,
          },
        });
        this.context.bufferedEndTrace({
          name: TraceName.OnboardingExistingSocialLogin,
        });
      }

      if (!isOnboardingCompleted) {
        this.context.bufferedEndTrace({
          name: TraceName.OnboardingPasswordLoginAttempt,
        });
        this.context.bufferedEndTrace({
          name: TraceName.OnboardingJourneyOverall,
        });
      }

      this.context.trackEvent(
        {
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlocked,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failed_attempts: this.failed_attempts,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            unlock_type: 'password',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            passkey_enabled: this.props.isPasskeyActive,
          },
        },
        {
          isNewVisit: true,
        },
      );
      this.setState({ isSubmitting: false });
      await this.props.navigateAfterUnlock();
    } catch (error) {
      this.setState({ isSubmitting: false });
      await this.handleLoginError(error as LoginError, isRehydrationFlow);
    }
  };

  handleLoginError = async (error: LoginError, isRehydrationFlow = false) => {
    const { t } = this.context as UnlockPageContext;
    const { message, data } = error;
    const { isOnboardingCompleted, accountTypeForMetrics } = this.props;

    // Sync failed_attempts with numberOfAttempts from error data
    if (data?.numberOfAttempts !== undefined) {
      this.failed_attempts = data.numberOfAttempts;
    }

    let finalErrorMessage = message;
    let finalUnlockDelayPeriod = 0;
    let errorReason;
    let shouldShowLoginErrorModal = false;
    let shouldShowConnectionsRemovedModal = false;

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
        finalUnlockDelayPeriod = data?.remainingTime ?? 0;
        break;
      case SeedlessOnboardingControllerErrorMessage.OutdatedPassword:
        finalErrorMessage = t('passwordChangedRecently');
        errorReason = 'outdated_password';
        break;
      case SeedlessOnboardingControllerErrorMessage.AuthenticationError:
      case SeedlessOnboardingControllerErrorMessage.InvalidRevokeToken:
      case SeedlessOnboardingControllerErrorMessage.InvalidRefreshToken:
        // capture the error to sentry
        captureException(error);

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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: accountTypeForMetrics,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failed_attempts: this.failed_attempts,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            error_type: errorReason,
          },
        });
      }
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.AppUnlockedFailed,
        properties: {
          reason: errorReason,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          failed_attempts: this.failed_attempts,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          unlock_type: 'password',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          passkey_enabled: this.props.isPasskeyActive,
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

  handleInputChange(event: ChangeEvent<HTMLInputElement>) {
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
        flexDirection={BoxFlexDirection.Column}
      >
        {error && (
          <Text
            data-testid="unlock-page-help-text"
            variant={TextVariant.BodySm}
            textAlign={TextAlign.Left}
            color={TextColor.ErrorDefault}
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

  setPasswordUnlockMode = (isPasswordUnlockMode: boolean) => {
    this.setState({ isPasswordUnlockMode, error: null });
  };

  handleUnlockPasskeyFromPasswordForm = () => {
    if (this.props.mustDeferPasskeyToBrowserTab) {
      cancelPasskeyCeremony();
      globalThis.platform?.openExtensionInBrowser?.(UNLOCK_ROUTE);
      return;
    }
    this.setPasswordUnlockMode(false);
  };

  handleUnlockWithPasskey = async (
    authenticationResponse: PasskeyAuthenticationResponse,
  ) => {
    await this.props.onUnlockWithPasskey(authenticationResponse);
    await this.props.navigateAfterUnlock();
  };

  onForgotPasswordOrLoginWithDiffMethods = async () => {
    const {
      isSocialLoginFlow,
      navigate,
      isOnboardingCompleted,
      accountTypeForMetrics,
    } = this.props;

    // in `onboarding_unlock` route, if the user is on a social login flow and onboarding is not completed,
    // we can redirect to `onboarding_welcome` route to select a different login method
    if (!isOnboardingCompleted && isSocialLoginFlow) {
      // Track when user clicks "Use a different login method" during rehydration
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.UseDifferentLoginMethodClicked,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: accountTypeForMetrics,
      },
    });

    this.setState({ showResetPasswordModal: true });
  };

  renderLogoSection = (isRehydrationFlow: boolean) => {
    const { t } = this.context as UnlockPageContext;
    return (
      <Box
        className="unlock-page__mascot-container"
        marginBottom={isBeta() || isFlask() ? 6 : 0}
      >
        {isRehydrationFlow ? (
          this.renderMascot()
        ) : (
          <MetamaskWordmarkLogo isPopup={this.props.isPopup ?? false} />
        )}
        {isBeta() ? (
          <Text
            className="unlock-page__mascot-container__beta bg-primary-default rounded-lg p-1"
            color={TextColor.PrimaryInverse}
            textTransform={TextTransform.Uppercase}
            fontWeight={FontWeight.Medium}
          >
            {t('beta')}
          </Text>
        ) : null}
      </Box>
    );
  };

  render() {
    const {
      password,
      error,
      isLocked,
      isSubmitting,
      showResetPasswordModal,
      showLoginErrorModal,
      showConnectionsRemovedModal,
      isPasswordUnlockMode,
    } = this.state;
    const { isOnboardingCompleted, isSocialLoginFlow } = this.props;
    const { t } = this.context as UnlockPageContext;

    const needHelpText = t('needHelpLinkText');
    const isRehydrationFlow = isSocialLoginFlow && !isOnboardingCompleted;
    const showPasswordUnlockForm =
      !this.props.isPasskeyActive || isPasswordUnlockMode;

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        className="w-full"
        paddingBottom={12} // offset header to center content
      >
        {showResetPasswordModal && (
          <ResetPasswordModal
            onClose={() => this.setState({ showResetPasswordModal: false })}
          />
        )}
        {showLoginErrorModal && (
          <LoginErrorModal
            loginError={LOGIN_ERROR.RESET_WALLET}
            onClose={() => this.setState({ showLoginErrorModal: false })}
          />
        )}
        {showConnectionsRemovedModal && <ConnectionsRemovedModal />}
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          padding={4}
          className="unlock-page w-full"
          data-testid="unlock-page"
          asChild
        >
          {showPasswordUnlockForm ? (
            <form onSubmit={this.handleSubmit}>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="w-full"
                alignItems={BoxAlignItems.Center}
              >
                {this.renderLogoSection(isRehydrationFlow)}
                {isRehydrationFlow && (
                  <Text
                    data-testid="unlock-page-title"
                    variant={TextVariant.DisplayMd}
                    className="mb-12"
                    fontWeight={FontWeight.Medium}
                    color={TextColor.TextDefault}
                    textAlign={TextAlign.Center}
                  >
                    {t('welcomeBack')}
                  </Text>
                )}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Start}
                  justifyContent={BoxJustifyContent.Center}
                  gap={2}
                  className="w-full"
                >
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
                    onChange={(event) =>
                      this.handleInputChange(
                        event as ChangeEvent<HTMLInputElement>,
                      )
                    }
                    type={TextFieldType.Password}
                    value={password}
                    error={Boolean(error)}
                    helpText={this.renderHelpText()}
                    autoComplete={false}
                    autoFocus
                    width={BlockSize.Full}
                    marginBottom={4}
                  />
                  {this.props.isPasskeyActive ? (
                    <UnlockPasskeyIconButton
                      disabled={isLocked || isSubmitting}
                      onClick={this.handleUnlockPasskeyFromPasswordForm}
                    />
                  ) : null}
                </Box>
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  className="w-full mb-6"
                  type="submit"
                  data-testid="unlock-submit"
                  disabled={!password || isLocked}
                >
                  {this.context.t('unlock')}
                </Button>

                <TextButton
                  data-testid="unlock-forgot-password-button"
                  key="import-account"
                  type="button"
                  onClick={this.onForgotPasswordOrLoginWithDiffMethods}
                  className="mb-4"
                  color={
                    isRehydrationFlow
                      ? TextColor.TextDefault
                      : TextColor.PrimaryDefault
                  }
                >
                  {isRehydrationFlow
                    ? t('useDifferentLoginMethod')
                    : t('forgotPassword')}
                </TextButton>

                {isRehydrationFlow && (
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextDefault}
                  >
                    {t('needHelp', [
                      <TextButton
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
                        asChild
                      >
                        <a
                          href={SUPPORT_LINK}
                          type="button"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {needHelpText}
                        </a>
                      </TextButton>,
                    ])}
                  </Text>
                )}
              </Box>
            </form>
          ) : (
            <UnlockPasskeySection
              logoSection={this.renderLogoSection(isRehydrationFlow)}
              isPasskeyActive={this.props.isPasskeyActive}
              passkeyAutoUnlockSuppressed={
                this.props.passkeyAutoUnlockSuppressed
              }
              mustDeferPasskeyToBrowserTab={
                this.props.mustDeferPasskeyToBrowserTab
              }
              isPasswordInProgress={isSubmitting}
              onUnlockWithPasskey={this.handleUnlockWithPasskey}
              onUsePassword={() => this.setPasswordUnlockMode(true)}
            />
          )}
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

export default withMetaMetrics(
  UnlockPage as unknown as React.ComponentType<Record<string, unknown>>,
);
