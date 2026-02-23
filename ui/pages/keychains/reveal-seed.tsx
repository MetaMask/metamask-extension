import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import {
  TextButton,
  Text,
  Box,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import { getErrorMessage } from '../../../shared/modules/error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import { requestRevealSeedWords } from '../../store/actions';
import { getHDEntropyIndex } from '../../selectors';
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
const PASSWORD_PROMPT_SCREEN: RevealSeedScreen = 'PASSWORD_PROMPT_SCREEN';
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

  const onClickCopy = useCallback(() => {
    if (!seedWords) {
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
  }, [seedWords, trackEvent, hdEntropyIndex]);

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
    global.platform.openTab({
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

  const renderContent = () => {
    if (screen === QUIZ_INTRODUCTION_SCREEN) {
      return (
        <QuizIntroduction
          onGetStarted={() => {
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
          }}
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
    global.platform.openTab({
      url: ZENDESK_URLS.SECRET_RECOVERY_PHRASE,
    });
  };

  return (
    <Box
      className="page-container"
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
      {screen === PASSWORD_PROMPT_SCREEN && (
        <RevealSeedWarning message={t('revealSeedWordsWarning')} />
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
