import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import { getErrorMessage } from '../../../shared/modules/error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  TextButton,
  Text,
  Box,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import { MetaMetricsContext } from '../../contexts/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import { requestRevealSeedWords } from '../../store/actions';
import { getHDEntropyIndex } from '../../selectors';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { Toast, ToastContainer } from '../../components/multichain/toast';
import type { RevealSeedScreen, RevealSeedLocationState } from './types';
import type { QuizQuestionConfig, AnsweredQuizQuestion } from './types';
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const onClickCopy = useCallback(() => {
    if (!seedWords) return;
    copyToClipboard(seedWords);
    setShowSuccessToast(true);
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.KeyExportCopied,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
        copy_method: 'clipboard',
        hd_entropy_index: hdEntropyIndex,
      },
    });
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpCopiedToClipboard,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
        copy_method: 'clipboard',
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
      (dispatch(
        requestRevealSeedWords(password, keyringId),
      ) as unknown as Promise<string>)
        .then((revealedSeedWords) => {
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.KeyExportRevealed,
            properties: {
              key_type: MetaMetricsEventKeyType.Srp,
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
              key_type: MetaMetricsEventKeyType.Srp,
              reason: e.message,
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

  const togglePasswordVisibility = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      setShowPassword((prev) => !prev);
    },
    [],
  );

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
        key_type: MetaMetricsEventKeyType.Srp,
        screen,
        hd_entropy_index: hdEntropyIndex,
      },
    });
    navigate(PREVIOUS_ROUTE);
  }, [trackEvent, screen, hdEntropyIndex, navigate]);

  const handleQuizFooterButtonClick = useCallback(
    (correct: boolean) => {
      if (currentQuestionIndex === 0) {
        setCurrentQuestionIndex(correct ? currentQuestionIndex + 1 : 0);
        setQuestionAnswered(false);
        setCorrectAnswer(false);
      } else if (currentQuestionIndex === 1) {
        if (correct) {
          setScreen(PASSWORD_PROMPT_SCREEN);
        } else {
          setQuestionAnswered(false);
          setCorrectAnswer(false);
        }
      }
    },
    [currentQuestionIndex],
  );

  useEffect(() => {
    if (
      screen === REVEAL_SEED_SCREEN &&
      !srpViewEventTracked
    ) {
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      setSrpViewEventTracked(true);
    }
  }, [screen, srpViewEventTracked, trackEvent]);

  const quizQuestionAnswers: QuizQuestionConfig[] = [
    {
      question: t('srpSecurityQuizQuestionOneQuestion'),
      buttonLabelOne: t('srpSecurityQuizQuestionOneWrongAnswer'),
      buttonLabelTwo: t('srpSecurityQuizQuestionOneRightAnswer'),
      questionDataTestId: 'srp_stage_question_one',
    },
    {
      question: t('srpSecurityQuizQuestionTwoQuestion'),
      buttonLabelOne: t('srpSecurityQuizQuestionTwoRightAnswer'),
      buttonLabelTwo: t('srpSecurityQuizQuestionTwoWrongAnswer'),
      questionDataTestId: 'srp_stage_question_two',
    },
  ];

  const answeredQuizQuestions: AnsweredQuizQuestion[] = [
    {
      correct: {
        title: t('srpSecurityQuizQuestionOneRightAnswerTitle'),
        description: t('srpSecurityQuizQuestionOneRightAnswerDescription'),
      },
      wrong: {
        title: t('srpSecurityQuizQuestionOneWrongAnswerTitle'),
        description: t('srpSecurityQuizQuestionOneWrongAnswerDescription'),
      },
    },
    {
      correct: {
        title: t('srpSecurityQuizQuestionTwoRightAnswerTitle'),
        description: t('srpSecurityQuizQuestionTwoRightAnswerDescription'),
      },
      wrong: {
        title: t('srpSecurityQuizQuestionTwoWrongAnswerTitle'),
        description: t('srpSecurityQuizQuestionTwoWrongAnswerDescription'),
      },
    },
  ];

  const handleRevealPhrase = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
      properties: {
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
            key_type: MetaMetricsEventKeyType.Srp,
          },
        });
      } else if (tabKey === 'qr-srp') {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.SrpViewsSrpQR,
          properties: {
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
          key_type: MetaMetricsEventKeyType.Srp,
          hd_entropy_index: hdEntropyIndex,
        },
      });
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
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
          introductionText={t('quizIntroduction')}
          onGetStarted={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.SrpRevealStarted,
              properties: {
                key_type: MetaMetricsEventKeyType.Srp,
                hd_entropy_index: hdEntropyIndex,
              },
            });
            setScreen(QUIZ_QUESTIONS_SCREEN);
          }}
          onLearnMore={openSupportArticle}
          getStartedLabel={t('srpSecurityQuizGetStarted')}
          learnMoreLabel={t('learnMoreUpperCase')}
        />
      );
    }
    if (screen === QUIZ_QUESTIONS_SCREEN) {
      return (
        <QuizQuestion
          currentQuestionIndex={currentQuestionIndex}
          questionAnswered={questionAnswered}
          correctAnswer={correctAnswer}
          questionConfig={quizQuestionAnswers[currentQuestionIndex]}
          answeredQuestion={answeredQuizQuestions[currentQuestionIndex]}
          currentQuestionLabel={t('currentQuestion', [
            String(currentQuestionIndex + 1),
          ])}
          correctLabel={t('correct')}
          incorrectLabel={t('incorrect')}
          learnMoreLabel={t('learnMoreUpperCase')}
          continueLabel={t('continue')}
          tryAgainLabel={t('tryAgain')}
          onAnswer={(isCorrect) => {
            setQuestionAnswered(true);
            setCorrectAnswer(isCorrect);
          }}
          onFooterButtonClick={handleQuizFooterButtonClick}
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
          passwordLabel={t('enterPasswordContinue')}
          continueLabel={t('continue')}
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
          textTabLabel={t('revealSeedWordsText')}
          qrTabLabel={t('revealSeedWordsQR')}
          copyButtonLabel={t('copyToClipboard')}
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
              className='hover:bg-transparent'
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
