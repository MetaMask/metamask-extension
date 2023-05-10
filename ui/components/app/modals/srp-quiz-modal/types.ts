import { BUTTON_VARIANT } from 'ui/components/component-library';

export enum QuizStage {
  introduction = 'introduction',
  questionOne = 'question-one',
  wrongAnswerQuestionOne = 'wrong-answer-question-one',
  rightAnswerQuestionOne = 'right-answer-question-one',
  questionTwo = 'question-two',
  wrongAnswerQuestionTwo = 'wrong-answer-question-two',
  rightAnswerQuestionTwo = 'right-answer-question-two',
}

export interface IQuizInformationProps {
  title: {
    content: string;
    style?: any;
  };
  buttons: {
    onClick: () => void;
    label: string;
    variant: string;
  }[];
  dismiss: () => void;
  header?: string;
  image?: string; // was ImageSourcePropType
  content?: string;
  icon?: any;
}
