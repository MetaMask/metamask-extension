import { ButtonSize, ButtonVariant } from '../../component-library';

export enum QuizStage {
  introduction = 'introduction',
  questionOne = 'question_one',
  wrongAnswerQuestionOne = 'wrong_answer_question_one',
  rightAnswerQuestionOne = 'right_answer_question_one',
  questionTwo = 'question_two',
  wrongAnswerQuestionTwo = 'wrong_answer_question_two',
  rightAnswerQuestionTwo = 'right_answer_question_two',
}

export interface IQuizInformationProps {
  /**
   * The icon to display in the modal should use <Icon /> component
   */
  icon?: any;
  /**
   * The image to display in the modal
   */
  image?: string;
  /**
   * The text content to go inside of the <Text /> component
   */
  content: string;
  /**
   * More text content to go inside of the <Text /> component
   */
  moreContent?: string;
  /**
   * Array of <Button /> component props
   */
  buttons: {
    onClick: () => void;
    label: string;
    variant: ButtonVariant;
    size?: ButtonSize;
    'data-testid'?: string;
  }[];
}

export type JSXDict = { [key: string]: () => JSX.Element };
