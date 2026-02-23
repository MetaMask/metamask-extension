import React from 'react';
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
  TextButton
} from '@metamask/design-system-react';
import type { QuizQuestionConfig, AnsweredQuizQuestion } from './types';

interface QuizQuestionProps {
  currentQuestionIndex: number;
  questionAnswered: boolean;
  correctAnswer: boolean;
  questionConfig: QuizQuestionConfig;
  answeredQuestion: AnsweredQuizQuestion;
  currentQuestionLabel: string;
  correctLabel: string;
  incorrectLabel: string;
  learnMoreLabel: string;
  continueLabel: string;
  tryAgainLabel: string;
  onAnswer: (isCorrect: boolean) => void;
  onFooterButtonClick: (correctAnswer: boolean) => void;
  onLearnMore: () => void;
}

export function QuizQuestion({
  currentQuestionIndex,
  questionAnswered,
  correctAnswer,
  questionConfig,
  answeredQuestion,
  currentQuestionLabel,
  correctLabel,
  incorrectLabel,
  learnMoreLabel,
  continueLabel,
  tryAgainLabel,
  onAnswer,
  onFooterButtonClick,
  onLearnMore,
}: QuizQuestionProps) {
  const { question, buttonLabelOne, buttonLabelTwo, questionDataTestId } =
    questionConfig;
  const { correct, wrong } = answeredQuestion;
  const correctAnswerTitle = correctAnswer ? correct.title : wrong.title;
  const title = questionAnswered ? correctAnswerTitle : question;

  const showFooter = questionAnswered;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isSecondQuestion = currentQuestionIndex === 1;

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Center}
        data-testid="reveal-seed-quiz-question"
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
                correctAnswer ? IconColor.SuccessDefault : IconColor.ErrorDefault
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
            className="w-full"
          >
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => onAnswer(isSecondQuestion)}
              data-testid={
                isSecondQuestion
                  ? 'srp-quiz-right-answer'
                  : 'srp-quiz-wrong-answer'
              }
              className='w-full'
            >
              {buttonLabelOne}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => onAnswer(isFirstQuestion)}
              data-testid={
                isFirstQuestion ? 'srp-quiz-right-answer' : 'srp-quiz-wrong-answer'
              }
              className='w-full'
            >
              {buttonLabelTwo}
            </Button>
            <TextButton
              onClick={onLearnMore}
              data-testid="reveal-seed-quiz-learn-more"
              className='w-full hover:bg-transparent'
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
            onClick={() => onFooterButtonClick(correctAnswer)}
            data-testid={
              correctAnswer ? 'srp-quiz-continue' : 'srp-quiz-try-again'
            }
            className='w-full'
          >
            {correctAnswer ? continueLabel : tryAgainLabel}
          </Button>
          <TextButton
            onClick={onLearnMore}
            data-testid="reveal-seed-quiz-footer-learn-more"
            className='w-full hover:bg-transparent'
          >
            {learnMoreLabel}
          </TextButton>
        </Box>
      )}
    </>
  );
}
