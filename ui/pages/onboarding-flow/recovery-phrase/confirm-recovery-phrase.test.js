import { fireEvent, act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import { ONBOARDING_METAMETRICS } from '../../../helpers/constants/routes';
import ConfirmRecoveryPhrase from './confirm-recovery-phrase';

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  setSeedPhraseBackedUp: jest.fn().mockReturnValue(jest.fn()),
}));

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('Confirm Recovery Phrase Component', () => {
  const TEST_SEED =
    'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

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

  it('should enable confirm recovery phrase with correct word inputs', async () => {
    const clock = jest.useFakeTimers();

    const { queryByTestId, queryAllByTestId, getByText } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseChips = queryAllByTestId(
      /recovery-phrase-quiz-unanswered-/u,
    );
    const quizWord1 = recoveryPhraseChips[0].textContent;
    const quizWord2 = recoveryPhraseChips[1].textContent;
    const quizWord3 = recoveryPhraseChips[2].textContent;

    // sort the quiz words by index, and then click the chip in correct order
    const seedArray = TEST_SEED.split(' ');
    const quizWords = [
      { index: seedArray.indexOf(quizWord1), elm: recoveryPhraseChips[0] },
      { index: seedArray.indexOf(quizWord2), elm: recoveryPhraseChips[1] },
      { index: seedArray.indexOf(quizWord3), elm: recoveryPhraseChips[2] },
    ];
    const sortedQuizWords = quizWords.sort((a, b) => a.index - b.index);

    sortedQuizWords.forEach((word) => {
      fireEvent.click(word.elm);
    });

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );

    act(() => {
      clock.advanceTimersByTime(500); // Wait for debounce
    });

    expect(confirmRecoveryPhraseButton).not.toBeDisabled();
    fireEvent.click(confirmRecoveryPhraseButton);

    const gotItButton = getByText('Got it');
    expect(gotItButton).toBeInTheDocument();
    fireEvent.click(gotItButton);

    expect(setSeedPhraseBackedUp).toHaveBeenCalledWith(true);
    expect(mockHistoryPush).toHaveBeenCalledWith(ONBOARDING_METAMETRICS);
  });
});
