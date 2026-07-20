import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  IconName,
  ButtonIconSize,
  TextVariant,
  TextAlign,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconColor,
} from '@metamask/design-system-react';
import { createSentryError } from '../../../../shared/lib/error';
import { captureException } from '../../../../shared/lib/sentry';
import { cancelPasskeyCeremony } from '../../../../shared/lib/passkey';
import { getPasskeyErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
  MetaMetricsEventVerificationMethod,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  FormTextFieldSize,
  FormTextField,
  TextFieldType,
} from '../../../components/component-library';
import { FontWeight as DesignSystemFontWeight } from '../../../helpers/constants/design-system';
import {
  getSeedPhrase,
  getSeedPhraseWithPasskey,
} from '../../../store/actions';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVEAL_SRP_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  MANAGE_WALLET_RECOVERY_ROUTE,
} from '../../../helpers/constants/routes';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { useIsFirefox } from '../../../hooks/useIsFirefox';
import {
  useIsPasskeyActive,
  useIsPasskeyIncompatibleInSidepanel,
} from '../../../hooks/usePasskeyAvailability';
import { getHDEntropyIndex } from '../../../selectors';
import { PasskeyVerification } from '../../../components/app/passkey-verification';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { useOnboardingSearchParams } from '../hooks/useOnboardingSearchParams';
import { useDispatch } from '../../../store/hooks';

type RevealRecoveryPhraseScreen =
  | 'VERIFY_PASSKEY_SCREEN'
  | 'PASSWORD_PROMPT_SCREEN';

const VERIFY_PASSKEY_SCREEN: RevealRecoveryPhraseScreen =
  'VERIFY_PASSKEY_SCREEN';
const PASSWORD_PROMPT_SCREEN: RevealRecoveryPhraseScreen =
  'PASSWORD_PROMPT_SCREEN'; // NOSONAR

function getSrpExportEventProperties(
  hdEntropyIndex: number,
  verificationMethod: MetaMetricsEventVerificationMethod,
  extraProperties: { reason?: string } = {},
) {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    key_type: MetaMetricsEventKeyType.Srp,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    verification_method: verificationMethod,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    hd_entropy_index: hdEntropyIndex,
    ...extraProperties,
  };
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RevealRecoveryPhrase({
  setSecretRecoveryPhrase,
}: {
  setSecretRecoveryPhrase: (seedPhrase: string) => void;
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const isFirefox = useIsFirefox();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const { isFromSettingsSecurity, nextRouteQueryString } =
    useOnboardingSearchParams();
  const hasSeedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);

  const isPasskeyActive = useIsPasskeyActive();
  const isPasskeyIncompatibleInSidepanel =
    useIsPasskeyIncompatibleInSidepanel();

  const initialScreen =
    isPasskeyActive && !isPasskeyIncompatibleInSidepanel
      ? VERIFY_PASSKEY_SCREEN
      : PASSWORD_PROMPT_SCREEN;

  const [screen, setScreen] =
    useState<RevealRecoveryPhraseScreen>(initialScreen);
  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const reviewSrpRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}${
    nextRouteQueryString ? `?${nextRouteQueryString}` : ''
  }`;

  useEffect(() => {
    if (hasSeedPhraseBackedUp) {
      navigate(
        isFirefox ? ONBOARDING_COMPLETION_ROUTE : ONBOARDING_METAMETRICS,
        { replace: true },
      );
    }
  }, [navigate, hasSeedPhraseBackedUp, isFirefox]);

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  const navigateToReviewSrp = useCallback(() => {
    navigate(reviewSrpRoute, { replace: true });
  }, [navigate, reviewSrpRoute]);

  const revealSeedPhrase = useCallback(
    async (
      verificationMethod: MetaMetricsEventVerificationMethod,
      fetchSeedPhrase: () => Promise<string>,
      onFailure: (error: Error) => void,
    ) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportRequested)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties(
            getSrpExportEventProperties(hdEntropyIndex, verificationMethod),
          )
          .build(),
      );

      try {
        const seedPhrase = await fetchSeedPhrase();

        trackEvent(
          createEventBuilder(MetaMetricsEventName.KeyExportRevealed)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties(
              getSrpExportEventProperties(hdEntropyIndex, verificationMethod),
            )
            .build(),
        );

        setSecretRecoveryPhrase(seedPhrase);
        navigateToReviewSrp();
      } catch (error) {
        const revealError = error as Error;
        const reason =
          verificationMethod === MetaMetricsEventVerificationMethod.Passkey
            ? getPasskeyErrorCode(revealError)
            : revealError.message;

        trackEvent(
          createEventBuilder(MetaMetricsEventName.KeyExportFailed)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties(
              getSrpExportEventProperties(hdEntropyIndex, verificationMethod, {
                reason,
              }),
            )
            .build(),
        );
        onFailure(revealError);
      }
    },
    [
      createEventBuilder,
      trackEvent,
      hdEntropyIndex,
      setSecretRecoveryPhrase,
      navigateToReviewSrp,
    ],
  );

  const handleRevealWithPasskey = useCallback(
    async (authenticationResponse: PasskeyAuthenticationResponse) => {
      await revealSeedPhrase(
        MetaMetricsEventVerificationMethod.Passkey,
        () => dispatch(getSeedPhraseWithPasskey(authenticationResponse)),
        (error) => {
          captureException(
            createSentryError('Reveal SRP backup with passkey failed', error),
          );
          setScreen(PASSWORD_PROMPT_SCREEN);
        },
      );
    },
    [dispatch, revealSeedPhrase],
  );

  const handleUsePassword = useCallback(() => {
    setScreen(PASSWORD_PROMPT_SCREEN);
  }, []);

  const handlePasskeyCeremonyFailed = useCallback(() => {
    setScreen(PASSWORD_PROMPT_SCREEN);
  }, []);

  const openRevealRecoveryPhraseInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    const fullScreenRoute = nextRouteQueryString
      ? `${ONBOARDING_REVEAL_SRP_ROUTE}?${nextRouteQueryString}`
      : ONBOARDING_REVEAL_SRP_ROUTE;
    globalThis.platform?.openExtensionInBrowser?.(fullScreenRoute);
  }, [nextRouteQueryString]);

  const onSubmit = useCallback(
    async (_password: string) => {
      await revealSeedPhrase(
        MetaMetricsEventVerificationMethod.Password,
        () => getSeedPhrase(_password),
        () => setIsIncorrectPasswordError(true),
      );
    },
    [revealSeedPhrase],
  );

  const returnToPreviousPage = useCallback(() => {
    cancelPasskeyCeremony();
    if (isFromSettingsSecurity) {
      navigate(MANAGE_WALLET_RECOVERY_ROUTE, { replace: true });
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [navigate, isFromSettingsSecurity]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      gap={6}
      className="reveal-recovery-phrase h-full"
      data-testid="reveal-recovery-phrase"
    >
      <Box className="w-full">
        <Box
          className="recovery-phrase__header grid w-full"
          alignItems={BoxAlignItems.Center}
          gap={3}
          marginBottom={4}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            data-testid="reveal-recovery-phrase-back-button"
            onClick={returnToPreviousPage}
            ariaLabel={t('back')}
          />
          <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
            {t('revealSecretRecoveryPhrase')}
          </Text>
          <ButtonIcon
            iconName={IconName.Close}
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            data-testid="reveal-recovery-phrase-close-button"
            onClick={returnToPreviousPage}
            ariaLabel={t('close')}
          />
        </Box>
        {screen === VERIFY_PASSKEY_SCREEN && !hasSeedPhraseBackedUp ? (
          <PasskeyVerification
            flow="reveal-recovery-phrase"
            troubleshootLocation="reveal-srp-backup"
            onOpenFullScreen={openRevealRecoveryPhraseInFullScreen}
            onVerified={handleRevealWithPasskey}
            onCeremonyFailed={handlePasskeyCeremonyFailed}
            onUsePassword={handleUsePassword}
          />
        ) : (
          <Box className="w-full" asChild>
            <form
              onSubmit={(e: FormEvent<HTMLElement>) => {
                e.preventDefault();
                onSubmit(password);
              }}
            >
              <FormTextField
                size={FormTextFieldSize.Lg}
                id="account-details-authenticate"
                label={t('enterYourPasswordContinue')}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsIncorrectPasswordError(false);
                }}
                value={password}
                error={isIncorrectPasswordError}
                helpText={
                  isIncorrectPasswordError
                    ? t('unlockPageIncorrectPassword')
                    : null
                }
                type={TextFieldType.Password}
                labelProps={{ fontWeight: DesignSystemFontWeight.Medium }}
                autoFocus
              />
            </form>
          </Box>
        )}
      </Box>
      {screen === PASSWORD_PROMPT_SCREEN && (
        <Box className="w-full">
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            data-testid="reveal-recovery-phrase-continue"
            className="reveal-recovery-phrase__footer--button w-full"
            onClick={() => onSubmit(password)}
          >
            {t('continue')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
