import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import RecoveryPhraseChips, {
  fakeSeedPhraseWords,
} from './recovery-phrase-chips';

describe('Recovery Phrase Chips Component', () => {
  const TEST_SEED =
    'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

  it('should match snapshot', () => {
    const props = {
      secretRecoveryPhrase: TEST_SEED.split(' '),
    };

    const { queryByTestId, container } = renderWithProvider(
      <RecoveryPhraseChips {...props} />,
    );

    expect(container).toMatchSnapshot();

    const recoveryPhraseChips = queryByTestId('recovery-phrase-chips');
    expect(recoveryPhraseChips).not.toHaveClass(
      'recovery-phrase__chips--hidden',
    );
  });

  it('should have --hidden class when phrase revealed is false', () => {
    const props = {
      secretRecoveryPhrase: TEST_SEED.split(' '),
      phraseRevealed: false,
    };

    const { queryByTestId } = renderWithProvider(
      <RecoveryPhraseChips {...props} />,
    );

    const recoveryPhraseChips = queryByTestId('recovery-phrase-chips');
    expect(recoveryPhraseChips).toHaveClass('recovery-phrase__chips--hidden');
  });

  it('should have fake word list when phrase revealed is false', () => {
    const props = {
      secretRecoveryPhrase: TEST_SEED.split(' '),
      phraseRevealed: false,
    };

    const { queryByTestId } = renderWithProvider(
      <RecoveryPhraseChips {...props} />,
    );

    const recoveryPhraseChips = queryByTestId('recovery-phrase-chips');

    const phraseWords = Array.from(recoveryPhraseChips.childNodes)
      .map((text) => text.textContent)
      .join(' ');
    expect(phraseWords).toBe(
      fakeSeedPhraseWords
        .map((word, index) => `${index + 1}.${word}`)
        .join(' '),
    );
  });

  it('should match snapshot of confirm recovery phrase with inputs of indicies to check', () => {
    const props = {
      secretRecoveryPhrase: TEST_SEED.split(' '),
      indicesToCheck: [1, 5, 10],
      confirmPhase: true,
      inputValue: {},
    };

    const { container } = renderWithProvider(
      <RecoveryPhraseChips {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should have seed phrase as proper element length', () => {
    const props = {
      secretRecoveryPhrase: TEST_SEED.split(' '),
    };

    const { queryAllByTestId } = renderWithProvider(
      <RecoveryPhraseChips {...props} />,
    );

    expect(queryAllByTestId(/recovery-phrase-chip-/u)).toHaveLength(12);
  });
});
