import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import * as BrowserRuntimeUtils from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import ConfirmRecoveryPhrase from './confirm-recovery-phrase';

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  setSeedPhraseBackedUp: jest.fn().mockReturnValue(jest.fn()),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '' }),
  };
});

// click and answer the srp quiz
const clickAndAnswerSrpQuiz = (quizUnansweredChips) => {
  // sort the unanswered chips by testId
  const sortedQuizWords = quizUnansweredChips
    .map((chipElm) => {
      // extract the testId number from the data-testid attribute, sample testId -> recovery-phrase-quiz-unanswered-[number]
      const testIdNumber = chipElm.getAttribute('data-testid').split('-')[4];
      return {
        id: testIdNumber,
        elm: chipElm,
      };
    })
    .sort((a, b) => a.id - b.id);

  sortedQuizWords.forEach((word) => {
    // assert the unanswered chip is in the document
    expect(word.elm).toBeInTheDocument();
    fireEvent.click(word.elm);
  });
};

describe('Confirm Recovery Phrase Component', () => {
  const TEST_SEED =
    'debris dizzy just just just float just just just just speak just';

  const props = {
    secretRecoveryPhrase: TEST_SEED,
  };

  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
          },
        },
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
    },
  };

  const mockStore = configureMockStore([thunk])(mockState);

  it('should have 3 recovery phrase inputs', () => {
    const { queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    expect(queryAllByTestId(/recovery-phrase-quiz-unanswered/u)).toHaveLength(
      3,
    );
  });

  it('should not enable confirm recovery phrase with two missing words', () => {
    const { queryByTestId, queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseInputs = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    const wrongInputEvent = {
      target: {
        value: 'wrong',
      },
    };

    fireEvent.change(recoveryPhraseInputs[0], wrongInputEvent);

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );
    expect(confirmRecoveryPhraseButton).toBeDisabled();
  });

  it('should not enable confirm recovery phrase with one missing words', () => {
    const { queryByTestId, queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseInputs = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    const wrongInputEvent = {
      target: {
        value: 'wrong',
      },
    };

    fireEvent.change(recoveryPhraseInputs[0], wrongInputEvent);
    fireEvent.change(recoveryPhraseInputs[1], wrongInputEvent);

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );

    expect(confirmRecoveryPhraseButton).toBeDisabled();
  });

  it('should not enable confirm recovery phrase with wrong word inputs', () => {
    const { queryByTestId, queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseInputs = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    const wrongInputEvent = {
      target: {
        value: 'wrong',
      },
    };

    fireEvent.change(recoveryPhraseInputs[0], wrongInputEvent);
    fireEvent.change(recoveryPhraseInputs[1], wrongInputEvent);
    fireEvent.change(recoveryPhraseInputs[2], wrongInputEvent);

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );

    expect(confirmRecoveryPhraseButton).toBeDisabled();
  });

  it('should enable confirm recovery phrase with correct word inputs', () => {
    const { queryByTestId, queryAllByTestId, getByText } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const quizUnansweredChips = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    // click and answer the srp quiz
    clickAndAnswerSrpQuiz(quizUnansweredChips);

    // assert the unanswered chips are not in the document
    const quizAnsweredChips = queryAllByTestId(
      /recovery-phrase-quiz-answered-/u,
    );
    expect(quizAnsweredChips).toHaveLength(3);

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );
    expect(confirmRecoveryPhraseButton).not.toBeDisabled();
    fireEvent.click(confirmRecoveryPhraseButton);

    const gotItButton = getByText('Got it');
    expect(gotItButton).toBeInTheDocument();
    fireEvent.click(gotItButton);

    expect(setSeedPhraseBackedUp).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('should go to Onboarding Completion page as a next step in firefox', async () => {
    jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { queryByTestId, queryAllByTestId, getByText } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const quizUnansweredChips = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );

    // click and answer the srp quiz
    clickAndAnswerSrpQuiz(quizUnansweredChips);

    const quizAnsweredChips = queryAllByTestId(
      /recovery-phrase-quiz-answered-/u,
    );
    expect(quizAnsweredChips).toHaveLength(3);

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );

    fireEvent.click(confirmRecoveryPhraseButton);
    fireEvent.click(getByText('Got it'));

    expect(setSeedPhraseBackedUp).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE, {
      replace: true,
    });
  });
});
