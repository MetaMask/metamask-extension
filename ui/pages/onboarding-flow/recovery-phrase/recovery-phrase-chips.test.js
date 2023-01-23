import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import RecoveryPhraseChips from './recovery-phrase-chips';

describe('Name of the group', () => {
  const TEST_SEED =
    'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

  it('should', () => {
    const props = {
      secretRecoveryPhrase: TEST_SEED.split(' '),
    };

    const { queryAllByTestId } = renderWithProvider(
      <RecoveryPhraseChips {...props} />,
    );

    expect(queryAllByTestId(/recovery-phrase-chip-/u)).toHaveLength(12);
  });
});
