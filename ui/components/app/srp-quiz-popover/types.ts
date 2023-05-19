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
  icon?: any;
  image?: string; // was ImageSourcePropType
  content: string;
  moreContent?: string;
  buttons: {
    onClick: () => void;
    label: string;
    variant: string;
  }[];
}

export type JSXDict = { [key: string]: () => JSX.Element };
