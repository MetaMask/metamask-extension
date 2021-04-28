import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import RevealSeedPhrase from './reveal-seed-phrase.container';

describe('Reveal Seed Phrase', () => {
  let wrapper;

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

  beforeEach(() => {
    wrapper = mount(<RevealSeedPhrase.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        metricsEvent: () => undefined,
      },
    });
  });

  it('seed phrase', () => {
    const seedPhrase = wrapper.find(
      '.reveal-seed-phrase__secret-words--hidden',
    );
    expect(seedPhrase).toHaveLength(1);
    expect(seedPhrase.text()).toStrictEqual(TEST_SEED);
  });

  it('clicks to reveal', () => {
    const reveal = wrapper.find('.reveal-seed-phrase__secret-blocker');

    expect(wrapper.state().isShowingSeedPhrase).toStrictEqual(false);
    reveal.simulate('click');
    expect(wrapper.state().isShowingSeedPhrase).toStrictEqual(true);

    const showSeed = wrapper.find('.reveal-seed-phrase__secret-words');
    expect(showSeed).toHaveLength(1);
  });
});
