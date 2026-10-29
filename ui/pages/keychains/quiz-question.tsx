import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Icon,
  Text,
  Box,
  IconName,
  IconSize,
  IconColor,
  ButtonVariant,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextAlign,
  TextButton,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { QuizQuestionConfig, AnsweredQuizQuestion } from './types';

type QuizQuestionProps = {
  onQuizComplete: () => void;
  onLearnMore: () => void;
};

export function QuizQuestion({
  onQuizComplete,
  onLearnMore,
}: Readonly<QuizQuestionProps>) {
  const t = useI18nContext();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(false);

  const questionConfigs: QuizQuestionConfig[] = useMemo(
    () => [
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
    ],
    [t],
  );

  const answeredQuestions: AnsweredQuizQuestion[] = useMemo(
    () => [
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
    ],
    [t],
  );

  const currentQuestionLabels: [string, string] = useMemo(
    () => [t('currentQuestion', ['1']), t('currentQuestion', ['2'])],
    [t],
  );

  const questionConfig = questionConfigs[currentQuestionIndex];
  const answeredQuestion = answeredQuestions[currentQuestionIndex];
  const currentQuestionLabel = currentQuestionLabels[currentQuestionIndex];

  const correctLabel = t('correct');
  const incorrectLabel = t('incorrect');
  const learnMoreLabel = t('learnMoreUpperCase');
  const continueLabel = t('continue');
  const tryAgainLabel = t('tryAgain');

  const { question, buttonLabelOne, buttonLabelTwo, questionDataTestId } =
    questionConfig;
  const { correct, wrong } = answeredQuestion;
  const correctAnswerTitle = correctAnswer ? correct.title : wrong.title;
  const title = questionAnswered ? correctAnswerTitle : question;

  const showFooter = questionAnswered;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isSecondQuestion = currentQuestionIndex === 1;

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setQuestionAnswered(true);
    setCorrectAnswer(isCorrect);
  }, []);

  const handleFooterButtonClick = useCallback(() => {
    if (correctAnswer) {
      if (currentQuestionIndex === 0) {
        setCurrentQuestionIndex(1);
        setQuestionAnswered(false);
        setCorrectAnswer(false);
      } else {
        onQuizComplete();
      }
    } else {
      setQuestionAnswered(false);
      setCorrectAnswer(false);
    }
  }, [correctAnswer, currentQuestionIndex, onQuizComplete]);

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Start}
        data-testid="reveal-seed-quiz-question"
        className="h-full"
      >
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mb-2"
        >
          {currentQuestionLabel}
        </Text>

        {questionAnswered && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
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
              variant={TextVariant.HeadingMd}
              fontWeight={FontWeight.Medium}
              color={
                correctAnswer
                  ? TextColor.SuccessDefault
                  : TextColor.ErrorDefault
              }
            >
              {correctAnswer ? correctLabel : incorrectLabel}
            </Text>
          </Box>
        )}

        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          textAlign={TextAlign.Left}
          fontWeight={FontWeight.Medium}
          className={questionAnswered ? 'mb-4' : 'mb-6'}
          data-testid={questionDataTestId}
        >
          {title}
        </Text>

        {questionAnswered && (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Left}
          >
            {correctAnswer ? correct.description : wrong.description}
          </Text>
        )}

        {!questionAnswered && (
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={4}
            className="w-full mt-auto"
          >
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => handleAnswer(isSecondQuestion)}
              data-testid={
                isSecondQuestion
                  ? 'srp-quiz-right-answer'
                  : 'srp-quiz-wrong-answer'
              }
              className="w-full"
            >
              {buttonLabelOne}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => handleAnswer(isFirstQuestion)}
              data-testid={
                isFirstQuestion
                  ? 'srp-quiz-right-answer'
                  : 'srp-quiz-wrong-answer'
              }
              className="w-full"
            >
              {buttonLabelTwo}
            </Button>
            <TextButton
              onClick={onLearnMore}
              data-testid="reveal-seed-quiz-learn-more"
              className="w-full hover:bg-transparent"
            >
              {learnMoreLabel}
            </TextButton>
          </Box>
        )}
      </Box>

      {showFooter && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          gap={4}
          className="mt-auto w-full"
        >
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleFooterButtonClick}
            data-testid={
              correctAnswer ? 'srp-quiz-continue' : 'srp-quiz-try-again'
            }
            className="w-full"
          >
            {correctAnswer ? continueLabel : tryAgainLabel}
          </Button>
          <TextButton
            onClick={onLearnMore}
            data-testid="reveal-seed-quiz-footer-learn-more"
            className="w-full hover:bg-transparent active:bg-transparent"
          >
            {learnMoreLabel}
          </TextButton>
        </Box>
      )}
    </>
  );
}
