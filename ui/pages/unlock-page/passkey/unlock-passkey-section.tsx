import React, { Component, type ReactNode } from 'react';
import PropTypes from 'prop-types';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  Box,
  Text,
  TextButton,
  BoxFlexDirection,
  BoxAlignItems,
  TextVariant,
  TextColor,
  TextAlign,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
} from '../../../../shared/lib/passkey';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { generatePasskeyAuthenticationOptions } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { UNLOCK_ROUTE } from '../../../helpers/constants/routes';

type PasskeySectionContext = {
  trackEvent: (event: object, options?: object) => void;
  t: (key: string, args?: unknown[]) => string;
};

export type UnlockPasskeySectionProps = {
  logoSection: ReactNode;
  isPasskeyActive: boolean;
  passkeyAutoUnlockSuppressed: boolean;
  isPasswordInProgress: boolean;
  onUnlockWithPasskey: (
    authenticationResponse: PasskeyAuthenticationResponse,
  ) => Promise<void>;
  onUsePassword: () => void;
};

type UnlockPasskeySectionState = {
  passkeyError: string | null;
  passkeyInProgress: boolean;
};

export class UnlockPasskeySection extends Component<
  UnlockPasskeySectionProps,
  UnlockPasskeySectionState
> {
  static readonly contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  static readonly propTypes = {
    logoSection: PropTypes.node.isRequired,
    isPasskeyActive: PropTypes.bool.isRequired,
    passkeyAutoUnlockSuppressed: PropTypes.bool.isRequired,
    isPasswordInProgress: PropTypes.bool.isRequired,
    onUnlockWithPasskey: PropTypes.func.isRequired,
    onUsePassword: PropTypes.func.isRequired,
  };

  state: UnlockPasskeySectionState = {
    passkeyError: null,
    passkeyInProgress: false,
  };

  /** Ensures auto WebAuthn runs at most once per section mount (e.g. first paint or after fingerprint). */
  autoUnlockStarted = false;

  isMounted = false;

  componentDidMount() {
    this.isMounted = true;
    const { isPasskeyActive, passkeyAutoUnlockSuppressed } = this.props;
    if (
      !isPasskeyActive ||
      passkeyAutoUnlockSuppressed ||
      this.autoUnlockStarted
    ) {
      return;
    }
    this.autoUnlockStarted = true;
    this.runPasskeyUnlock();
  }

  componentWillUnmount() {
    this.isMounted = false;
    cancelPasskeyCeremony();
  }

  onUsePassword = () => {
    cancelPasskeyCeremony();
    this.props.onUsePassword();
  };

  runPasskeyUnlock = async () => {
    const { isPasswordInProgress, isPasskeyActive } = this.props;
    if (isPasswordInProgress || this.state.passkeyInProgress) {
      return;
    }
    if (!isPasskeyActive) {
      return;
    }

    if (this.isMounted) {
      this.setState({
        passkeyError: null,
        passkeyInProgress: true,
      });
    }

    const { t, trackEvent } = this.context as PasskeySectionContext;
    try {
      const authOptions = await generatePasskeyAuthenticationOptions();
      const authenticationResponse =
        await startPasskeyAuthentication(authOptions);

      await this.props.onUnlockWithPasskey(authenticationResponse);

      trackEvent?.({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.AppUnlocked,
        properties: { method: 'passkey' },
      });
    } catch (err) {
      if (!this.isMounted) {
        return;
      }
      if (isPasskeyCeremonySilentError(err)) {
        this.setState({
          passkeyError: null,
        });
      } else {
        this.setState({
          passkeyError:
            translatePasskeyError(err, t) ?? t('passkeyUnlockFailed'),
        });
      }
    } finally {
      if (this.isMounted) {
        this.setState({ passkeyInProgress: false });
      }
    }
  };

  openUnlockInFullScreen = () => {
    cancelPasskeyCeremony();
    globalThis.platform.openExtensionInBrowser(UNLOCK_ROUTE, 'from=sidepanel');
  };

  render() {
    const { logoSection, isPasskeyActive, isPasswordInProgress } = this.props;
    const { passkeyError, passkeyInProgress } = this.state;
    const { t } = this.context as PasskeySectionContext;

    const showTroubleshoot =
      getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL &&
      isPasskeyActive &&
      passkeyInProgress;

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="unlock-page w-full"
        alignItems={BoxAlignItems.Center}
        gap={4}
        padding={4}
      >
        {logoSection}
        {passkeyError ? (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.ErrorDefault}
            textAlign={TextAlign.Center}
            data-testid="unlock-passkey-error-banner"
            className="w-full"
          >
            {passkeyError}
          </Text>
        ) : null}
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="w-full"
        >
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            type="button"
            isLoading={passkeyInProgress}
            data-testid="unlock-passkey-button"
            disabled={isPasswordInProgress || passkeyInProgress}
            onClick={this.runPasskeyUnlock}
            aria-busy={passkeyInProgress}
          >
            {t('unlockWithPasskey')}
          </Button>
          {showTroubleshoot ? (
            <TextButton
              type="button"
              data-testid="unlock-passkey-troubleshoot-button"
              color={TextColor.PrimaryDefault}
              className="w-full text-center"
              onClick={this.openUnlockInFullScreen}
            >
              {t('passkeyTroubleshoot')}
            </TextButton>
          ) : null}
        </Box>

        <Button
          variant={ButtonVariant.Tertiary}
          data-testid="unlock-use-password-button"
          type="button"
          onClick={this.onUsePassword}
          className="w-full"
        >
          {t('usePassword')}
        </Button>
      </Box>
    );
  }
}
