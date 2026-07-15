import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import { type PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  TextButton,
  Text,
  Box,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import {
  RecommendedAction,
  type PhishingDetectionScanResult,
} from '@metamask/phishing-controller';
import { createSentryError, getErrorMessage } from '../../../shared/lib/error';
import { captureException } from '../../../shared/lib/sentry';
import { cancelPasskeyCeremony } from '../../../shared/lib/passkey';
import { getPasskeyErrorCode } from '../../../shared/lib/passkey/passkey-error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
  MetaMetricsEventVerificationMethod,
} from '../../../shared/constants/metametrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  requestRevealSeedWords,
  getSeedPhraseWithPasskey,
  scanUrlForPhishing,
} from '../../store/actions';
import { getHDEntropyIndex, getOriginOfCurrentTab } from '../../selectors';
import {
  useIsPasskeyActive,
  useIsPasskeyIncompatibleInSidepanel,
} from '../../hooks/usePasskeyAvailability';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';
import {
  PREVIOUS_ROUTE,
  REVEAL_SEED_ROUTE,
} from '../../helpers/constants/routes';
import { PasskeyVerification } from '../../components/app/passkey-verification';
import { useBoolean } from '../../hooks/useBoolean';
import { Toast, ToastContainer } from '../../components/multichain/toast';
import { useAppDispatch } from '../../store/hooks';
import type { RevealSeedScreen, RevealSeedLocationState } from './types';
import { RevealSeedPageHeader } from './reveal-seed-page-header';
import { RevealSeedWarning } from './reveal-seed-warning';
import { RevealSeedMaliciousBlock } from './reveal-seed-malicious-block';
import { QuizIntroduction } from './quiz-introduction';
import { QuizQuestion } from './quiz-question';
import { PasswordPrompt } from './password-prompt';
import { RevealSeedContent } from './reveal-seed-content';

const QUIZ_INTRODUCTION_SCREEN: RevealSeedScreen = 'QUIZ_INTRODUCTION_SCREEN';
const QUIZ_QUESTIONS_SCREEN: RevealSeedScreen = 'QUIZ_QUESTIONS_SCREEN';
const VERIFY_PASSKEY_SCREEN: RevealSeedScreen = 'VERIFY_PASSKEY_SCREEN';
// Screen identifier for the unlock step (not a credential)
const PASSWORD_PROMPT_SCREEN: RevealSeedScreen = 'PASSWORD_PROMPT_SCREEN'; // NOSONAR
const REVEAL_SEED_SCREEN: RevealSeedScreen = 'REVEAL_SEED_SCREEN';

function RevealSeedPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const { keyringId } = useParams<Record<string, string | undefined>>();
  const locationState = useLocation().state as RevealSeedLocationState | null;
  const skipQuiz = locationState?.skipQuiz ?? false;

  const isPasskeyActive = useIsPasskeyActive();
  const isPasskeyIncompatibleInSidepanel =
    useIsPasskeyIncompatibleInSidepanel();

  // The credential step after the quiz: passkey when active, else password.
  const initialCredentialScreen =
    isPasskeyActive && !isPasskeyIncompatibleInSidepanel
      ? VERIFY_PASSKEY_SCREEN
      : PASSWORD_PROMPT_SCREEN;

  const [screen, setScreen] = useState<RevealSeedScreen>(
    skipQuiz ? initialCredentialScreen : QUIZ_INTRODUCTION_SCREEN,
  );
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [srpViewEventTracked, setSrpViewEventTracked] = useState(false);
  const { value: showPassword, toggle } = useBoolean();
  const [phraseRevealed, setPhraseRevealed] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const [scanResult, setScanResult] =
    useState<PhishingDetectionScanResult | null>(null);
  const scanResultPromiseRef = React.useRef<
    Promise<PhishingDetectionScanResult | null>
  >(Promise.resolve(null));

  useEffect(() => {
    let cancelled = false;
    setScanResult(null);

    if (activeTabOrigin) {
      const scanPromise = scanUrlForPhishing(activeTabOrigin).catch(() => {
        // Scan failed — no action needed
        return null;
      });
      scanResultPromiseRef.current = scanPromise;
      scanPromise.then((result) => {
        if (cancelled) {
          return;
        }
        setScanResult(result);
      });
    } else {
      scanResultPromiseRef.current = Promise.resolve(null);
    }

    return () => {
      cancelled = true;
    };
  }, [activeTabOrigin]);

  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;

  useEffect(() => {
    if (scanResult?.recommendedAction === RecommendedAction.Block) {
      trackEventRef.current(
        createEventBuilder(MetaMetricsEventName.SrpRevealMaliciousSiteDetected)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            dapp_host_name: scanResult.hostname ?? 'unknown',
          })
          .build(),
      );
    }
  }, [createEventBuilder, scanResult]);

  // Only Block triggers the malicious warning. Warn and None show the generic warning.
  const isMalicious = scanResult?.recommendedAction === RecommendedAction.Block;

  const onClickCopy = useCallback(() => {
    if (!seedWords || !phraseRevealed) {
      return;
    }
    copyToClipboard(seedWords);
    setShowSuccessToast(true);
    trackEvent(
      createEventBuilder(MetaMetricsEventName.KeyExportCopied)
        .addCategory(MetaMetricsEventCategory.Keys)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          copy_method: 'clipboard',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SrpCopiedToClipboard)
        .addCategory(MetaMetricsEventCategory.Keys)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          copy_method: 'clipboard',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );
  }, [
    createEventBuilder,
    hdEntropyIndex,
    phraseRevealed,
    seedWords,
    trackEvent,
  ]);

  useEffect(() => {
    const passwordBox = document.getElementById('password-box');
    if (passwordBox) {
      passwordBox.focus();
    }
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent | React.MouseEvent) => {
      event.preventDefault();
      trace({ name: TraceName.RevealSeed });
      setSeedWords(null);
      setError(null);
      (
        dispatch(
          requestRevealSeedWords(password, keyringId),
        ) as unknown as Promise<string>
      )
        .then((revealedSeedWords) => {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.KeyExportRevealed)
              .addCategory(MetaMetricsEventCategory.Keys)
              .addProperties({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                key_type: MetaMetricsEventKeyType.Srp,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                verification_method:
                  MetaMetricsEventVerificationMethod.Password,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
              })
              .build(),
          );
          setSeedWords(revealedSeedWords);
          setScreen(REVEAL_SEED_SCREEN);
        })
        .catch((e: Error) => {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.KeyExportFailed)
              .addCategory(MetaMetricsEventCategory.Keys)
              .addProperties({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                key_type: MetaMetricsEventKeyType.Srp,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                verification_method:
                  MetaMetricsEventVerificationMethod.Password,
                reason: e.message,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
              })
              .build(),
          );
          setError(getErrorMessage(e));
        })
        .finally(() => {
          endTrace({ name: TraceName.RevealSeed });
        });
    },
    [
      createEventBuilder,
      dispatch,
      hdEntropyIndex,
      keyringId,
      password,
      trackEvent,
    ],
  );

  const togglePasswordVisibility = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      toggle();
    },
    [toggle],
  );

  const openSupportArticle = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
        .addCategory(MetaMetricsEventCategory.Keys)
        .addProperties({
          url: `${ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE}#metamask-secret-recovery-phrase-dos-and-donts`,
          location: 'reveal_srp',
        })
        .build(),
    );
    globalThis.platform.openTab({
      url: `${ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE}#metamask-secret-recovery-phrase-dos-and-donts`,
    });
  }, [createEventBuilder, trackEvent]);

  const handleBack = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SrpRevealBackButtonClicked)
        .addCategory(MetaMetricsEventCategory.Keys)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          screen,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );
    navigate(PREVIOUS_ROUTE);
  }, [createEventBuilder, hdEntropyIndex, navigate, screen, trackEvent]);

  const handleQuizComplete = useCallback(() => {
    setScreen(initialCredentialScreen);
  }, [initialCredentialScreen]);

  const handleRevealWithPasskey = useCallback(
    async (authenticationResponse: PasskeyAuthenticationResponse) => {
      const latestScanResult = await scanResultPromiseRef.current;
      const isMaliciousAction =
        latestScanResult?.recommendedAction === RecommendedAction.Block;
      if (isMaliciousAction) {
        setScreen(PASSWORD_PROMPT_SCREEN);
        return false;
      }

      trace({ name: TraceName.RevealSeed });
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportRequested)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            verification_method: MetaMetricsEventVerificationMethod.Passkey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );

      try {
        const revealedSeedWords = await (dispatch(
          getSeedPhraseWithPasskey(authenticationResponse, keyringId),
        ) as unknown as Promise<string>);

        trackEvent(
          createEventBuilder(MetaMetricsEventName.KeyExportRevealed)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Srp,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              verification_method: MetaMetricsEventVerificationMethod.Passkey,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            })
            .build(),
        );

        setSeedWords(revealedSeedWords);
        setScreen(REVEAL_SEED_SCREEN);
        return true;
      } catch (e) {
        const revealError = e as Error;
        const errorCode = getPasskeyErrorCode(revealError);
        trackEvent(
          createEventBuilder(MetaMetricsEventName.KeyExportFailed)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Srp,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              verification_method: MetaMetricsEventVerificationMethod.Passkey,
              reason: errorCode,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            })
            .build(),
        );
        captureException(
          createSentryError('Reveal SRP with passkey failed', revealError),
        );
        // Fall back to password verification on any passkey reveal failure.
        setScreen(PASSWORD_PROMPT_SCREEN);
        return false;
      } finally {
        endTrace({ name: TraceName.RevealSeed });
      }
    },
    [createEventBuilder, dispatch, hdEntropyIndex, keyringId, trackEvent],
  );

  const handleUsePassword = useCallback(() => {
    setScreen(PASSWORD_PROMPT_SCREEN);
  }, []);

  const handlePasskeyCeremonyFailed = useCallback(() => {
    setScreen(PASSWORD_PROMPT_SCREEN);
  }, []);

  const handlePasskeyVerified = useCallback(
    async (authenticationResponse: PasskeyAuthenticationResponse) => {
      await handleRevealWithPasskey(authenticationResponse);
    },
    [handleRevealWithPasskey],
  );

  const openRevealSeedInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform?.openExtensionInBrowser?.(
      keyringId ? `${REVEAL_SEED_ROUTE}/${keyringId}` : REVEAL_SEED_ROUTE,
    );
  }, [keyringId]);

  useEffect(() => {
    if (screen === REVEAL_SEED_SCREEN && !srpViewEventTracked) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SrpViewSrpText)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
          })
          .build(),
      );
      setSrpViewEventTracked(true);
    }
  }, [createEventBuilder, screen, srpViewEventTracked, trackEvent]);

  const handleRevealPhrase = useCallback(() => {
    trackEvent(
      createEventBuilder(
        MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
      )
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );
    setPhraseRevealed(true);
  }, [createEventBuilder, hdEntropyIndex, trackEvent]);

  const handleTabClick = useCallback(
    (tabKey: 'text-seed' | 'qr-srp') => {
      if (tabKey === 'text-seed') {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.SrpViewSrpText)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Srp,
            })
            .build(),
        );
      } else if (tabKey === 'qr-srp') {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.SrpViewsSrpQR)
            .addCategory(MetaMetricsEventCategory.Keys)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Srp,
            })
            .build(),
        );
      }
    },
    [createEventBuilder, trackEvent],
  );

  const handlePasswordContinueClick = useCallback(
    (event: React.MouseEvent) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.KeyExportRequested)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            verification_method: MetaMetricsEventVerificationMethod.Password,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SrpRevealNextClicked)
          .addCategory(MetaMetricsEventCategory.Keys)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
          })
          .build(),
      );
      handleSubmit(event);
    },
    [createEventBuilder, handleSubmit, hdEntropyIndex, trackEvent],
  );

  const handleQuizGetStarted = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SrpRevealStarted)
        .addCategory(MetaMetricsEventCategory.Keys)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );
    setScreen(QUIZ_QUESTIONS_SCREEN);
  }, [createEventBuilder, hdEntropyIndex, trackEvent]);

  const renderContent = () => {
    if (screen === QUIZ_INTRODUCTION_SCREEN) {
      return (
        <QuizIntroduction
          onGetStarted={handleQuizGetStarted}
          onLearnMore={openSupportArticle}
        />
      );
    }
    if (screen === QUIZ_QUESTIONS_SCREEN) {
      return (
        <QuizQuestion
          onQuizComplete={handleQuizComplete}
          onLearnMore={openSupportArticle}
        />
      );
    }
    if (screen === VERIFY_PASSKEY_SCREEN) {
      if (isMalicious) {
        return (
          <RevealSeedMaliciousBlock
            onDismiss={handleBack}
            hostname={scanResult?.hostname ?? undefined}
          />
        );
      }
      return (
        <PasskeyVerification
          flow="reveal-seed"
          troubleshootLocation="reveal-srp"
          onOpenFullScreen={openRevealSeedInFullScreen}
          onVerified={handlePasskeyVerified}
          onCeremonyFailed={handlePasskeyCeremonyFailed}
          onUsePassword={handleUsePassword}
        />
      );
    }
    if (screen === PASSWORD_PROMPT_SCREEN) {
      if (isMalicious) {
        return (
          <RevealSeedMaliciousBlock
            onDismiss={handleBack}
            hostname={scanResult?.hostname ?? undefined}
          />
        );
      }
      return (
        <PasswordPrompt
          password={password}
          error={error}
          showPassword={showPassword}
          onPasswordChange={setPassword}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={handleSubmit}
          onContinueClick={handlePasswordContinueClick}
        />
      );
    }
    if (seedWords) {
      return (
        <RevealSeedContent
          seedWords={seedWords}
          phraseRevealed={phraseRevealed}
          onRevealPhrase={handleRevealPhrase}
          onCopy={onClickCopy}
          onTabClick={handleTabClick}
        />
      );
    }
    return null;
  };

  const handleSrpClick = () => {
    globalThis.platform.openTab({
      url: ZENDESK_URLS.SECRET_RECOVERY_PHRASE,
    });
  };

  return (
    <Box
      className="page-container h-full md:w-[490px]"
      paddingTop={8}
      paddingBottom={8}
      paddingLeft={4}
      paddingRight={4}
      gap={4}
      data-testid="reveal-seed-page"
    >
      <RevealSeedPageHeader
        onBack={handleBack}
        title={t('revealSecretRecoveryPhraseSettings')}
        backButtonAriaLabel={t('back')}
      />
      {screen === PASSWORD_PROMPT_SCREEN && !isMalicious && (
        <>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('revealSeedWordsDescription1', [
              <TextButton
                key="srp-learn-srp"
                onClick={handleSrpClick}
                className="hover:bg-transparent"
              >
                {t('revealSeedWordsSRPName')}
              </TextButton>,
            ])}
          </Text>
          <RevealSeedWarning message={t('revealSeedWordsWarning')} />
        </>
      )}
      {renderContent()}
      {showSuccessToast && (
        <ToastContainer>
          <Toast
            startAdornment={null}
            text={t('copiedToClipboard')}
            onClose={() => setShowSuccessToast(false)}
            autoHideTime={5000}
            onAutoHideToast={() => setShowSuccessToast(false)}
            dataTestId="reveal-seed-copy-success-toast"
          />
        </ToastContainer>
      )}
    </Box>
  );
}

export default RevealSeedPage;
