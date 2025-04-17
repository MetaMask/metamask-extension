import { ButtonSize, ButtonVariant } from '../../component-library';

export enum QuizStage {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  introduction = 'introduction',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  questionOne = 'question_one',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  wrongAnswerQuestionOne = 'wrong_answer_question_one',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rightAnswerQuestionOne = 'right_answer_question_one',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  questionTwo = 'question_two',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  wrongAnswerQuestionTwo = 'wrong_answer_question_two',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rightAnswerQuestionTwo = 'right_answer_question_two',
}

export type IQuizInformationProps = {
  /**
   * The icon to display in the modal should use <Icon /> component
   */

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
};

export type JSXDict = { [key: string]: () => JSX.Element };
