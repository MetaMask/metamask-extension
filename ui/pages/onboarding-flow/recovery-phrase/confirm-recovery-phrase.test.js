import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import ConfirmRecoveryPhrase from './confirm-recovery-phrase';

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  setSeedPhraseBackedUp: jest.fn().mockReturnValue(jest.fn()),
}));

describe('Confirm Recovery Phrase Component', () => {
  const TEST_SEED =
    'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

  const props = {
    secretRecoveryPhrase: TEST_SEED,
  };

  const mockState = {
    metamask: {},
  };

  const mockStore = configureMockStore([thunk])(mockState);

  it('should have 3 recovery phrase inputs', () => {
    const { queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    expect(queryAllByTestId(/recovery-phrase-input-/u)).toHaveLength(3);
  });

  it('should not enable confirm recovery phrase with two missing words', () => {
    const { queryByTestId, queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseInputs = queryAllByTestId(/recovery-phrase-input-/u);

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

    const recoveryPhraseInputs = queryAllByTestId(/recovery-phrase-input-/u);

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

    const recoveryPhraseInputs = queryAllByTestId(/recovery-phrase-input-/u);

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

    const { queryByTestId, queryAllByTestId } = renderWithProvider(
      <ConfirmRecoveryPhrase {...props} />,
      mockStore,
    );

    const recoveryPhraseInputs = queryAllByTestId(/recovery-phrase-input-/u);

    const correctInputEvent1 = {
      target: {
        value: 'just',
      },
    };

    const correctInputEvent2 = {
      target: {
        value: 'program',
      },
    };

    const correctInputEvent3 = {
      target: {
        value: 'vacant',
      },
    };

    fireEvent.change(recoveryPhraseInputs[0], correctInputEvent1);
    fireEvent.change(recoveryPhraseInputs[1], correctInputEvent2);
    fireEvent.change(recoveryPhraseInputs[2], correctInputEvent3);

    const confirmRecoveryPhraseButton = queryByTestId(
      'recovery-phrase-confirm',
    );

    await waitFor(() => {
      clock.advanceTimersByTime(500); // Wait for debounce

      expect(confirmRecoveryPhraseButton).not.toBeDisabled();

      fireEvent.click(confirmRecoveryPhraseButton);

      expect(setSeedPhraseBackedUp).toHaveBeenCalledWith(true);
    });
  });
});
