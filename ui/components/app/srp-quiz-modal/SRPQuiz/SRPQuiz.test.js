import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import configureStore from '../../../../store/store';
import { QuizStage } from '../types';
import SRPQuiz from './SRPQuiz';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

let openTabSpy;

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

async function waitForStage(stage) {
  return await waitFor(() => {
    expect(screen.getByTestId(`srp_stage_${stage}`)).toBeInTheDocument();
  });
}

function clickButton(id) {
  fireEvent.click(screen.getByTestId(id));
}

describe('srp-reveal-quiz', () => {
  beforeAll(() => {
    global.platform = { openTab: jest.fn() };
    openTabSpy = jest.spyOn(global.platform, 'openTab');
  });

  it('should go through the full sequence of steps', async () => {
    renderWithProvider(<SRPQuiz isOpen />, store);

    expect(screen.queryByTestId('srp-quiz-get-started')).toBeInTheDocument();

    expect(
      screen.queryByTestId('srp-quiz-right-answer'),
    ).not.toBeInTheDocument();

    clickButton('srp-quiz-learn-more');

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringMatching(ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE),
      }),
    );

    clickButton('srp-quiz-get-started');

    await waitForStage(QuizStage.questionOne);

    clickButton('srp-quiz-wrong-answer');

    await waitForStage(QuizStage.wrongAnswerQuestionOne);

    clickButton('srp-quiz-try-again');

    await waitForStage(QuizStage.questionOne);

    clickButton('srp-quiz-right-answer');

    await waitForStage(QuizStage.rightAnswerQuestionOne);

    clickButton('srp-quiz-continue');

    await waitForStage(QuizStage.questionTwo);

    clickButton('srp-quiz-wrong-answer');

    await waitForStage(QuizStage.wrongAnswerQuestionTwo);

    clickButton('srp-quiz-try-again');

    await waitForStage(QuizStage.questionTwo);

    clickButton('srp-quiz-right-answer');

    await waitForStage(QuizStage.rightAnswerQuestionTwo);

    clickButton('srp-quiz-continue');
  });
});
