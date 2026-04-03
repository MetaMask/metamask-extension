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
  ButtonIcon,
  ButtonIconVariant,
  IconName,
  ButtonIconSize,
  IconColor,
  IconSize,
} from '@metamask/design-system-react';
import {
  prepareAssertionParams,
  unwrapEncryptionKeyFromAssertion,
} from '@metamask/passkey-controller';
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
} from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { isFlask, isBeta } from '../../../shared/lib/build-types';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { withMetaMetrics } from '../../contexts/metametrics';
import LoginErrorModal from '../onboarding-flow/welcome/login-error-modal';
import { LOGIN_ERROR } from '../onboarding-flow/welcome/types';
import ConnectionsRemovedModal from '../../components/app/connections-removed-modal';
import { captureException } from '../../../shared/lib/sentry';
import { PasskeyCeremonyExtensionAdapter } from '../../../shared/lib/passkey/PasskeyCeremonyExtensionAdapter';
import {
  getPasskeyRecord,
  isPasskeyEnrolled,
  submitEncryptionKey,
} from '../../store/actions';
import { getCaretCoordinates } from './unlock-page.util';
import ResetPasswordModal from './reset-password-modal';
import FormattedCounter from './formatted-counter';
import { MetamaskWordmarkLogo } from './metamask-wordmark-logo';

type UnlockPageProps = {
  navigate: NavigateFunction;
  location: RouterLocation;
  isUnlocked: boolean;
  isOnboardingCompleted: boolean;
  onRestore: () => void;
  onSubmit: (password: string) => Promise<void>;
  checkIsSeedlessPasswordOutdated: () => Promise<void>;
  getIsSeedlessOnboardingUserAuthenticated: () => Promise<boolean>;
  forceUpdateMetamaskState: () => Promise<void>;
  isSocialLoginFlow: boolean;
  onboardingParentContext: MutableRefObject<unknown>;
  loginWithDifferentMethod: () => Promise<void>;
  firstTimeFlowType: string | null;
  resetWallet: () => Promise<void>;
  isPopup: boolean;
  isWalletResetInProgress: boolean;
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
  showPasswordForm: boolean;
  passkeyAvailable: boolean;
  passkeyInProgress: boolean;
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
    /**
     * Indicates if the wallet is reset in progress
     */
    isWalletResetInProgress: PropTypes.bool,
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
    showPasswordForm: false,
    passkeyAvailable: false,
    passkeyInProgress: false,
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
    const { isUnlocked, navigate, location } = this.props;

    if (isUnlocked) {
      // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
      let redirectTo = DEFAULT_ROUTE;
      const fromLocation = location.state?.from;
      if (fromLocation?.pathname) {
        const search = fromLocation.search || '';
        redirectTo = fromLocation.pathname + search;
      }
      navigate(redirectTo);
    }
  }

  async componentDidMount() {
    const { isOnboardingCompleted, isSocialLoginFlow } = this.props;
    try {
      const enrolled = await isPasskeyEnrolled();
      this.setState({ passkeyAvailable: enrolled });
    } catch {
      this.setState({ passkeyAvailable: false });
    }
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'social',
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
            account_type: 'social',
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
          },
        },
        {
          isNewVisit: true,
        },
      );
    } catch (error) {
      await this.handleLoginError(error as LoginError, isRehydrationFlow);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleLoginError = async (error: LoginError, isRehydrationFlow = false) => {
    const { t } = this.context as UnlockPageContext;
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
            account_type: 'social',
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

  handlePasskeyUnlock = async () => {
    if (
      this.state.isLocked ||
      this.state.isSubmitting ||
      this.state.passkeyInProgress
    ) {
      return;
    }
    this.setState({ error: null, passkeyInProgress: true });
    try {
      const record = await getPasskeyRecord();
      if (!record) {
        this.setState({
          error: (this.context as UnlockPageContext).t('passkeyUnlockFailed'),
          passkeyInProgress: false,
          showPasswordForm: true,
        });
        return;
      }
      const adapter = new PasskeyCeremonyExtensionAdapter();
      const params = prepareAssertionParams(record);
      const assertion = await adapter.getAssertion(params);
      const encryptionKey = await unwrapEncryptionKeyFromAssertion(
        record,
        assertion,
      );
      await submitEncryptionKey(encryptionKey, record.encryptionSalt);
      await this.props.forceUpdateMetamaskState();

      let redirectTo = DEFAULT_ROUTE;
      const fromLocation = this.props.location.state?.from;
      if (fromLocation?.pathname) {
        const search = fromLocation.search || '';
        redirectTo = fromLocation.pathname + search;
      }
      this.props.navigate(redirectTo);

      (this.context as UnlockPageContext).trackEvent?.({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.AppUnlocked,
        properties: { method: 'passkey' },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (this.context as UnlockPageContext).t('passkeyUnlockFailed');
      this.setState({
        error: message,
        passkeyInProgress: false,
        showPasswordForm: true,
      });
    } finally {
      this.setState({ passkeyInProgress: false });
    }
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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

  handlePasswordForm = () => {
    this.setState({ showPasswordForm: true });
  };

  renderLogoSection(isRehydrationFlow: boolean) {
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
  }

  render() {
    const {
      password,
      error,
      isLocked,
      isSubmitting,
      showResetPasswordModal,
      showLoginErrorModal,
      showConnectionsRemovedModal,
      showPasswordForm,
    } = this.state;
    const { isOnboardingCompleted, isSocialLoginFlow } = this.props;
    const { t } = this.context as UnlockPageContext;

    const needHelpText = t('needHelpLinkText');
    const isRehydrationFlow = isSocialLoginFlow && !isOnboardingCompleted;

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
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          padding={4}
          className="unlock-page w-full"
          data-testid="unlock-page"
        >
          {this.renderLogoSection(isRehydrationFlow)}

          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            className="min-h-[250px] w-full"
          >
            {showPasswordForm ? (
              <form
                onSubmit={this.handleSubmit}
                className="w-full flex flex-col items-center"
              >
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
                  alignItems={BoxAlignItems.Center}
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
                  <ButtonIcon
                    variant={ButtonIconVariant.Filled}
                    ariaLabel={'biometric'}
                    iconName={IconName.Fingerprint}
                    size={ButtonIconSize.Lg}
                    color={IconColor.IconAlternative}
                    iconProps={{
                      color: IconColor.IconAlternative,
                      size: IconSize.Lg,
                    }}
                    className="flex self-center mb-4 h-12 w-12 rounded-lg"
                  />
                </Box>

                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  className="w-full mb-4"
                  type="submit"
                  data-testid="unlock-submit"
                  disabled={!password || isLocked}
                >
                  {this.context.t('unlock')}
                </Button>

                {this.state.passkeyAvailable && (
                  <Button
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Lg}
                    type="button"
                    data-testid="unlock-with-passkey"
                    disabled={
                      isLocked ||
                      this.state.isSubmitting ||
                      this.state.passkeyInProgress
                    }
                    onClick={this.handlePasskeyUnlock}
                  >
                    {this.state.passkeyInProgress
                      ? t('unlocking')
                      : t('unlockWithPasskey')}
                  </Button>
                )}

                <Button
                  variant={ButtonVariant.Tertiary}
                  data-testid="unlock-forgot-password-button"
                  key="import-account"
                  type="button"
                  onClick={this.onForgotPasswordOrLoginWithDiffMethods}
                  className={`mb-4 w-full ${isRehydrationFlow ? 'text-default' : 'text-primary-default'}`}
                >
                  {isRehydrationFlow
                    ? t('useDifferentLoginMethod')
                    : t('forgotPassword')}
                </Button>

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
              </form>
            ) : (
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="w-full"
                alignItems={BoxAlignItems.Center}
                gap={4}
              >
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  className="w-full"
                  type="button"
                  data-testid="unlock-biometrics"
                  disabled={
                    isLocked || isSubmitting || this.state.passkeyInProgress
                  }
                  onClick={this.handlePasskeyUnlock}
                >
                  {this.state.passkeyInProgress
                    ? t('unlocking')
                    : t('unlockWithBiometrics')}
                </Button>
                <Button
                  variant={ButtonVariant.Tertiary}
                  data-testid="unlock-use-password-button"
                  key="import-account"
                  type="button"
                  onClick={this.handlePasswordForm}
                  className="w-full"
                >
                  {t('usePassword')}
                </Button>
              </Box>
            )}
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

export default withMetaMetrics(
  UnlockPage as unknown as React.ComponentType<Record<string, unknown>>,
);
