import React from 'react';
import sinon from 'sinon';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import RevealSeedPhrase from '.';

describe('Reveal Secret Recovery Phrase', () => {
  const TEST_SEED =
    'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

  const props = {
    history: {
      push: sinon.spy(),
    },
    seedPhrase: TEST_SEED,
    setSeedPhraseBackedUp: sinon.spy(),
    setCompletedOnboarding: sinon.spy(),
  };

  const mockState = {
    metamask: {},
  };

  const mockStore = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <RevealSeedPhrase {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('clicks to reveal shows seed phrase', () => {
    const { queryByTestId } = renderWithProvider(
      <RevealSeedPhrase {...props} />,
      mockStore,
    );

    fireEvent.click(queryByTestId('reveal-seed-blocker'));

    expect(queryByTestId('showing-seed-phrase')).toBeInTheDocument();
  });
});
