import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import messages from '../../../../../app/_locales/en/messages.json';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { getMessage } from '../../../../helpers/utils/i18n-helper';
import configureStore from '../../../../store/store';
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

async function waitForText(text) {
  return await waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });
}

function clickButton(text) {
  fireEvent.click(screen.getByText(text));
}

function t(key) {
  return getMessage('en', messages, key);
}

describe('srp-reveal-quiz', () => {
  beforeAll(() => {
    global.platform = { openTab: jest.fn() };
    openTabSpy = jest.spyOn(global.platform, 'openTab');
  });

  it('should go through the full sequence of steps', async () => {
    renderWithProvider(<SRPQuiz isOpen />, store);

    expect(
      screen.queryByText(t('srpSecurityQuizGetStarted')),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(t('srpSecurityQuizQuestionOneQuestion')),
    ).not.toBeInTheDocument();

    clickButton(t('learnMoreUpperCase'));

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringMatching(ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE),
      }),
    );

    clickButton(t('srpSecurityQuizGetStarted'));

    await waitForText(t('srpSecurityQuizQuestionOneQuestion'));

    clickButton(t('srpSecurityQuizQuestionOneWrongAnswer'));

    await waitForText(t('srpSecurityQuizQuestionOneWrongAnswerTitle'));

    clickButton(t('tryAgain'));

    await waitForText(t('srpSecurityQuizQuestionOneQuestion'));

    clickButton(t('srpSecurityQuizQuestionOneRightAnswer'));

    await waitForText(t('srpSecurityQuizQuestionOneRightAnswerTitle'));

    clickButton(t('continue'));

    await waitForText(t('srpSecurityQuizQuestionTwoQuestion'));

    clickButton(t('srpSecurityQuizQuestionTwoWrongAnswer'));

    await waitForText(t('srpSecurityQuizQuestionTwoWrongAnswerTitle'));

    clickButton(t('tryAgain'));

    await waitForText(t('srpSecurityQuizQuestionTwoQuestion'));

    clickButton(t('srpSecurityQuizQuestionTwoRightAnswer'));

    await waitForText(t('srpSecurityQuizQuestionTwoRightAnswerTitle'));

    clickButton(t('continue'));
  });
});
