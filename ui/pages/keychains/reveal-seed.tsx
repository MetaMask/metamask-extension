import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import {
  TextButton,
  Text,
  Box,
  Checkbox,
  TextVariant,
  TextColor,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import {
  RecommendedAction,
  type PhishingDetectionScanResult,
} from '@metamask/phishing-controller';
import { getErrorMessage } from '../../../shared/modules/error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  requestRevealSeedWords,
  scanUrlForPhishing,
} from '../../store/actions';
import { getHDEntropyIndex, getOriginOfCurrentTab } from '../../selectors';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { Toast, ToastContainer } from '../../components/multichain/toast';
import type { RevealSeedScreen, RevealSeedLocationState } from './types';
import { RevealSeedPageHeader } from './reveal-seed-page-header';
import { RevealSeedWarning } from './reveal-seed-warning';
import { QuizIntroduction } from './quiz-introduction';
import { QuizQuestion } from './quiz-question';
import { PasswordPrompt } from './password-prompt';
import { RevealSeedContent } from './reveal-seed-content';

const QUIZ_INTRODUCTION_SCREEN: RevealSeedScreen = 'QUIZ_INTRODUCTION_SCREEN';
const QUIZ_QUESTIONS_SCREEN: RevealSeedScreen = 'QUIZ_QUESTIONS_SCREEN';
// Screen identifier for the unlock step (not a credential)
const PASSWORD_PROMPT_SCREEN: RevealSeedScreen = 'PASSWORD_PROMPT_SCREEN'; // NOSONAR
const REVEAL_SEED_SCREEN: RevealSeedScreen = 'REVEAL_SEED_SCREEN';

function RevealSeedPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const { keyringId } = useParams<Record<string, string | undefined>>();
  const locationState = useLocation().state as RevealSeedLocationState | null;
  const skipQuiz = locationState?.skipQuiz ?? false;

  const [screen, setScreen] = useState<RevealSeedScreen>(
    skipQuiz ? PASSWORD_PROMPT_SCREEN : QUIZ_INTRODUCTION_SCREEN,
  );
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [srpViewEventTracked, setSrpViewEventTracked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phraseRevealed, setPhraseRevealed] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const [scanResult, setScanResult] =
    useState<PhishingDetectionScanResult | null>(null);
  const [dangerAcknowledged, setDangerAcknowledged] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setScanResult(null);
    setDangerAcknowledged(false);

    if (activeTabOrigin) {
      scanUrlForPhishing(activeTabOrigin)
        .then((result: unknown) => {
          if (cancelled) {
            return;
          }
          setScanResult(result as PhishingDetectionScanResult);
        })
        .catch(() => {
          // Scan failed — no action needed
        });
    }

    return () => {
      cancelled = true;
    };
  }, [activeTabOrigin]);

  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;
  const activeTabOriginRef = React.useRef(activeTabOrigin);
  activeTabOriginRef.current = activeTabOrigin;

  useEffect(() => {
    if (scanResult?.recommendedAction === RecommendedAction.Block) {
      trackEventRef.current({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealMaliciousSiteDetected,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          active_tab_origin: activeTabOriginRef.current,
          hostname: scanResult.hostname ?? 'unknown',
        },
      });
    }
  }, [scanResult]);

  const isMalicious = scanResult?.recommendedAction === RecommendedAction.Block;

  const onClickCopy = useCallback(() => {
    if (!seedWords || !phraseRevealed) {
      return;
    }
    copyToClipboard(seedWords);
    setShowSuccessToast(true);
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.KeyExportCopied,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        key_type: MetaMetricsEventKeyType.Srp,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        copy_method: 'clipboard',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpCopiedToClipboard,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        key_type: MetaMetricsEventKeyType.Srp,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        copy_method: 'clipboard',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
  }, [seedWords, phraseRevealed, trackEvent, hdEntropyIndex]);

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
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.KeyExportRevealed,
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Srp,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            },
          });
          setSeedWords(revealedSeedWords);
          setScreen(REVEAL_SEED_SCREEN);
        })
        .catch((e: Error) => {
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.KeyExportFailed,
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Srp,
              reason: e.message,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
            },
          });
          setError(getErrorMessage(e));
        })
        .finally(() => {
          endTrace({ name: TraceName.RevealSeed });
        });
    },
    [dispatch, password, keyringId, trackEvent, hdEntropyIndex],
  );

  const togglePasswordVisibility = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setShowPassword((prev) => !prev);
  }, []);

  const openSupportArticle = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SupportLinkClicked,
      properties: {
        url: `${ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE}#metamask-secret-recovery-phrase-dos-and-donts`,
        location: 'reveal_srp',
      },
    });
    globalThis.platform.openTab({
      url: `${ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE}#metamask-secret-recovery-phrase-dos-and-donts`,
    });
  }, [trackEvent]);

  const handleBack = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpRevealBackButtonClicked,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        key_type: MetaMetricsEventKeyType.Srp,
        screen,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    navigate(PREVIOUS_ROUTE);
  }, [trackEvent, screen, hdEntropyIndex, navigate]);

  const handleQuizComplete = useCallback(() => {
    setScreen(PASSWORD_PROMPT_SCREEN);
  }, []);

  useEffect(() => {
    if (screen === REVEAL_SEED_SCREEN && !srpViewEventTracked) {
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      setSrpViewEventTracked(true);
    }
  }, [screen, srpViewEventTracked, trackEvent]);

  const handleRevealPhrase = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    setPhraseRevealed(true);
  }, [trackEvent, hdEntropyIndex]);

  const handleTabClick = useCallback(
    (tabKey: 'text-seed' | 'qr-srp') => {
      if (tabKey === 'text-seed') {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.SrpViewSrpText,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
          },
        });
      } else if (tabKey === 'qr-srp') {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.SrpViewsSrpQR,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
          },
        });
      }
    },
    [trackEvent],
  );

  const handlePasswordContinueClick = useCallback(
    (event: React.MouseEvent) => {
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        },
      });
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      handleSubmit(event);
    },
    [trackEvent, hdEntropyIndex, handleSubmit],
  );

  const handleQuizGetStarted = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpRevealStarted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        key_type: MetaMetricsEventKeyType.Srp,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    setScreen(QUIZ_QUESTIONS_SCREEN);
  }, [trackEvent, hdEntropyIndex]);

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
    if (screen === PASSWORD_PROMPT_SCREEN) {
      return (
        <PasswordPrompt
          password={password}
          error={error}
          showPassword={showPassword}
          onPasswordChange={setPassword}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={handleSubmit}
          onContinueClick={handlePasswordContinueClick}
          isMalicious={isMalicious}
          dangerAcknowledged={dangerAcknowledged}
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
      {screen === PASSWORD_PROMPT_SCREEN && (
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
      )}
      {screen === PASSWORD_PROMPT_SCREEN && isMalicious && (
        <RevealSeedWarning
          message={t('dappScanMaliciousWarning')}
          title={t('dappScanMaliciousTitle')}
          data-testid="dapp-scan-warning"
        />
      )}
      {screen === PASSWORD_PROMPT_SCREEN && !isMalicious && (
        <RevealSeedWarning message={t('revealSeedWordsWarning')} />
      )}
      {screen === PASSWORD_PROMPT_SCREEN && isMalicious && (
        <Box
          className="flex w-full p-4 rounded-lg"
          style={{ borderLeft: '4px solid var(--color-error-default)' }}
          backgroundColor={BoxBackgroundColor.ErrorMuted}
        >
          <Checkbox
            id="dapp-scan-acknowledge-checkbox"
            label={t('alertModalAcknowledge')}
            isSelected={dangerAcknowledged}
            onChange={
              ((selected: boolean) =>
                setDangerAcknowledged(
                  selected,
                )) as React.FormEventHandler<HTMLLabelElement> &
                ((isSelected: boolean) => void)
            }
            inputProps={{
              'data-testid': 'dapp-scan-acknowledge-checkbox',
            }}
          />
        </Box>
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
