import qrCode from 'qrcode-generator';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ButtonIcon,
  IconName,
  IconColor,
  ButtonIconSize,
  Icon,
  IconSize,
} from '@metamask/design-system-react';
import copyToClipboard from 'copy-to-clipboard';
import { getErrorMessage } from '../../../shared/modules/error';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  BUTTON_SIZES,
  BUTTON_VARIANT,
  BannerAlert,
  Button,
  HelpText,
  HelpTextSeverity,
  Label,
  Text,
  TextField,
  TextFieldSize,
  TextFieldType,
} from '../../components/component-library';
import Box from '../../components/ui/box';
import { Tab, Tabs } from '../../components/ui/tabs';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  AlignItems,
  BlockSize,
  Display,
  JustifyContent,
  Severity,
  Size,
  TextVariant,
  TextColor,
  FlexDirection,
  TextAlign,
  FontWeight,
} from '../../helpers/constants/design-system';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import { requestRevealSeedWords } from '../../store/actions';
import { getHDEntropyIndex } from '../../selectors';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import RecoveryPhraseChips from '../onboarding-flow/recovery-phrase/recovery-phrase-chips';
import { Toast, ToastContainer } from '../../components/multichain/toast';

const QUIZ_INTRODUCTION_SCREEN = 'QUIZ_INTRODUCTION_SCREEN';
const QUIZ_QUESTIONS_SCREEN = 'QUIZ_QUESTIONS_SCREEN';
const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

function RevealSeedPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const { keyringId } = useParams();
  const { skipQuiz } = useLocation()?.state || { skipQuiz: false };

  const [screen, setScreen] = useState(
    skipQuiz ? PASSWORD_PROMPT_SCREEN : QUIZ_INTRODUCTION_SCREEN,
  );
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState(null);
  const [error, setError] = useState(null);
  const [srpViewEventTracked, setSrpViewEventTracked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phraseRevealed, setPhraseRevealed] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const onClickCopy = useCallback(() => {
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

  const renderQR = () => {
    const qrImage = qrCode(0, 'L');
    qrImage.addData(seedWords);
    qrImage.make();
    return qrImage;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    trace({
      name: TraceName.RevealSeed,
    });
    setSeedWords(null);
    setError(null);
    dispatch(requestRevealSeedWords(password, keyringId))
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
      .catch((e) => {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportFailed,
          properties: {
            key_type: MetaMetricsEventKeyType.Srp,
            reason: e.message, // 'incorrect_password',
            hd_entropy_index: hdEntropyIndex,
          },
        });
        setError(getErrorMessage(e));
      })
      .finally(() => {
        endTrace({
          name: TraceName.RevealSeed,
        });
      });
  };

  const renderWarning = () => {
    return (
      <BannerAlert severity={Severity.Danger} data-testid="reveal-seed-warning">
        <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
          {t('revealSeedWordsWarning')}
        </Text>
      </BannerAlert>
    );
  };

  const togglePasswordVisibility = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setShowPassword(!showPassword);
  };

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

  const renderQuizIntroductionContent = () => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={6}
        paddingTop={6}
        data-testid="reveal-seed-quiz-introduction"
      >
        <img
          src="images/reveal_srp.png"
          alt="Reveal SRP"
          className="w-[190px] h-[220px] object-contain"
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('quizIntroduction')}
        </Text>
      </Box>
    );
  };

  const renderQuizIntroductionFooter = () => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        marginTop="auto"
        gap={4}
      >
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          width={BlockSize.Full}
          size={Size.LG}
          onClick={() => {
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
          data-testid="reveal-seed-quiz-get-started"
        >
          {t('srpSecurityQuizGetStarted')}
        </Button>
        <Button
          variant={BUTTON_VARIANT.LINK}
          width={BlockSize.Full}
          size={Size.LG}
          onClick={openSupportArticle}
          data-testid="reveal-seed-quiz-intro-learn-more"
        >
          {t('learnMoreUpperCase')}
        </Button>
      </Box>
    );
  };

  const quizQuestionAnswers = [
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

  const answeredQuizQuestions = [
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

  const renderQuizQuestionContent = () => {
    const { question, buttonLabelOne, buttonLabelTwo, questionDataTestId } =
      quizQuestionAnswers[currentQuestionIndex];

    const { correct, wrong } = answeredQuizQuestions[currentQuestionIndex];

    const correctAnswerTitle = correctAnswer ? correct.title : wrong.title;

    const title = questionAnswered ? correctAnswerTitle : question;

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        justifyContent={JustifyContent.center}
        data-testid="reveal-seed-quiz-question"
      >
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          paddingBottom={2}
        >
          {t('currentQuestion', [currentQuestionIndex + 1])}
        </Text>

        {questionAnswered && (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={2}
            paddingBottom={4}
          >
            <Icon
              key={correctAnswer ? 'correct' : 'incorrect'}
              name={correctAnswer ? IconName.Confirmation : IconName.CircleX}
              color={
                correctAnswer
                  ? IconColor.SuccessDefault
                  : IconColor.ErrorDefault
              }
              size={IconSize.Lg}
            />
            <Text
              variant={TextVariant.headingMd}
              fontWeight={FontWeight.Medium}
              color={
                correctAnswer
                  ? TextColor.successDefault
                  : TextColor.errorDefault
              }
            >
              {correctAnswer ? t('correct') : t('incorrect')}
            </Text>
          </Box>
        )}

        <Text
          variant={TextVariant.headingLg}
          color={TextColor.textDefault}
          textAlign={TextAlign.Start}
          fontWeight={FontWeight.Medium}
          paddingBottom={questionAnswered ? 4 : 6}
          data-testid={questionDataTestId}
        >
          {title}
        </Text>

        {questionAnswered && (
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Start}
          >
            {correctAnswer ? correct.description : wrong.description}
          </Text>
        )}

        {!questionAnswered && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
            width={BlockSize.Full}
          >
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              width={BlockSize.Full}
              size={Size.LG}
              onClick={() => {
                setQuestionAnswered(true);
                setCorrectAnswer(currentQuestionIndex === 1);
              }}
              data-testid={
                currentQuestionIndex === 1
                  ? 'srp-quiz-right-answer'
                  : 'srp-quiz-wrong-answer'
              }
            >
              {buttonLabelOne}
            </Button>
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              width={BlockSize.Full}
              size={Size.LG}
              onClick={() => {
                setQuestionAnswered(true);
                setCorrectAnswer(currentQuestionIndex === 0);
              }}
              data-testid={
                currentQuestionIndex === 0
                  ? 'srp-quiz-right-answer'
                  : 'srp-quiz-wrong-answer'
              }
            >
              {buttonLabelTwo}
            </Button>
            <Button
              variant={BUTTON_VARIANT.LINK}
              width={BlockSize.Full}
              size={Size.LG}
              onClick={openSupportArticle}
              data-testid="reveal-seed-quiz-learn-more"
            >
              {t('learnMoreUpperCase')}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const renderQuizQuestionFooter = () => {
    const handleButtonClick = () => {
      if (currentQuestionIndex === 0) {
        setCurrentQuestionIndex(
          correctAnswer ? currentQuestionIndex + 1 : currentQuestionIndex,
        );
        setQuestionAnswered(false);
        setCorrectAnswer(false);
      }

      if (currentQuestionIndex === 1) {
        if (correctAnswer) {
          setScreen(PASSWORD_PROMPT_SCREEN);
        } else {
          setCurrentQuestionIndex(1);
          setQuestionAnswered(false);
          setCorrectAnswer(false);
        }
      }
    };
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={4}
        marginTop="auto"
      >
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          width={BlockSize.Full}
          size={Size.LG}
          onClick={handleButtonClick}
          data-testid={
            correctAnswer ? 'srp-quiz-continue' : 'srp-quiz-try-again'
          }
        >
          {correctAnswer ? t('continue') : t('tryAgain')}
        </Button>
        <Button
          variant={BUTTON_VARIANT.LINK}
          width={BlockSize.Full}
          size={Size.LG}
          onClick={openSupportArticle}
          data-testid="reveal-seed-quiz-footer-learn-more"
        >
          {t('learnMoreUpperCase')}
        </Button>
      </Box>
    );
  };

  const renderPasswordPromptContent = () => {
    return (
      <form onSubmit={handleSubmit} data-testid="reveal-seed-password-form">
        <Label htmlFor="password-box">{t('enterPasswordContinue')}</Label>
        <TextField
          inputProps={{
            'data-testid': 'input-password',
          }}
          type={showPassword ? TextFieldType.Text : TextFieldType.Password}
          id="password-box"
          size={TextFieldSize.Large}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(error)}
          width={BlockSize.Full}
          endAccessory={
            <ButtonIcon
              onClick={togglePasswordVisibility}
              iconProps={{
                name: showPassword ? IconName.EyeSlash : IconName.Eye,
                color: IconColor.IconAlternative,
              }}
            />
          }
        />
        {error && (
          <HelpText
            severity={HelpTextSeverity.Danger}
            data-testid="reveal-seed-password-error"
          >
            {error}
          </HelpText>
        )}
      </form>
    );
  };

  const renderRevealSeedContent = () => {
    // default for SRP_VIEW_SRP_TEXT event because this is the first thing shown after rendering
    if (!srpViewEventTracked) {
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      setSrpViewEventTracked(true);
    }

    return (
      <div data-testid="reveal-seed-tabs-container">
        <Tabs
          defaultActiveTabName={t('revealSeedWordsText')}
          onTabClick={(tabName) => {
            if (tabName === 'text-seed') {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.SrpViewSrpText,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                },
              });
            } else if (tabName === 'qr-srp') {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.SrpViewsSrpQR,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                },
              });
            }
          }}
        >
          <Tab
            name={t('revealSeedWordsText')}
            tabKey="text-seed"
            className="flex-1"
          >
            <RecoveryPhraseChips
              secretRecoveryPhrase={seedWords.split(' ')}
              phraseRevealed={phraseRevealed}
              revealPhrase={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Onboarding,
                  event:
                    MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
                  properties: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    hd_entropy_index: hdEntropyIndex,
                  },
                });
                setPhraseRevealed(true);
              }}
              recoveryPhraseChipsContainerClassName="recovery-phrase-chips-container"
            />
            <Button
              variant={BUTTON_VARIANT.LINK}
              width={BlockSize.Full}
              size={Size.LG}
              onClick={onClickCopy}
              data-testid="reveal-seed-copy-button"
            >
              <Icon
                name={IconName.Copy}
                color={IconColor.PrimaryDefault}
                className="mr-2"
              />
              {t('copyToClipboard')}
            </Button>
          </Tab>
          <Tab name={t('revealSeedWordsQR')} tabKey="qr-srp" className="flex-1">
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              data-testid="qr-srp"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: renderQR().createTableTag(5, 15),
                }}
              />
            </Box>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderPasswordPromptFooter = () => {
    return (
      <Box
        display={Display.Flex}
        marginTop="auto"
        gap={4}
        data-testid="reveal-seed-password-footer"
      >
        <Button
          width={BlockSize.Full}
          size={Size.LG}
          onClick={(event) => {
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
          }}
          disabled={password === ''}
          data-testid="reveal-seed-password-continue"
        >
          {t('continue')}
        </Button>
      </Box>
    );
  };

  const renderContent = () => {
    if (screen === QUIZ_INTRODUCTION_SCREEN) {
      return renderQuizIntroductionContent();
    }
    if (screen === QUIZ_QUESTIONS_SCREEN) {
      return renderQuizQuestionContent();
    }
    if (screen === PASSWORD_PROMPT_SCREEN) {
      return renderPasswordPromptContent();
    }
    return renderRevealSeedContent();
  };

  const renderFooter = () => {
    if (screen === QUIZ_INTRODUCTION_SCREEN) {
      return renderQuizIntroductionFooter();
    }
    if (screen === QUIZ_QUESTIONS_SCREEN && questionAnswered) {
      return renderQuizQuestionFooter();
    }
    if (screen === PASSWORD_PROMPT_SCREEN) {
      return renderPasswordPromptFooter();
    }

    return null;
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
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        gap={2}
      >
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          color={IconColor.iconDefault}
          size={ButtonIconSize.Md}
          data-testid="reveal-recovery-phrase-back-button"
          onClick={() => {
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
          }}
          ariaLabel={t('back')}
        />
        <Text variant={TextVariant.headingSm} color={TextColor.textDefault}>
          {t('secretRecoveryPhrase')}
        </Text>
        <Box />
      </Box>
      {screen === PASSWORD_PROMPT_SCREEN && (
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {screen === PASSWORD_PROMPT_SCREEN
            ? t('revealSeedWordsDescription1', [
                <Button
                  key="srp-learn-srp"
                  variant={BUTTON_VARIANT.LINK}
                  size={BUTTON_SIZES.INHERIT}
                  as="a"
                  href={ZENDESK_URLS.SECRET_RECOVERY_PHRASE}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('revealSeedWordsSRPName')}
                </Button>,
              ])
            : t('revealSeedWordsDescription')}
        </Text>
      )}
      {screen === PASSWORD_PROMPT_SCREEN && renderWarning()}
      {renderContent()}
      {renderFooter()}
      {showSuccessToast && (
        <ToastContainer>
          <Toast
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
