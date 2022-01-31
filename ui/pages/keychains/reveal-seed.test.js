import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import RevealSeedPage from './reveal-seed';

describe('Reveal Seed Page', () => {
  it('form submit', () => {
    const props = {
      history: {
        push: sinon.spy(),
      },
      requestRevealSeedWords: sinon.stub().resolves(),
      mostRecentOverviewPage: '/',
    };
    const wrapper = mount(<RevealSeedPage.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });

    wrapper.find('form').simulate('submit');
    expect(props.requestRevealSeedWords.calledOnce).toStrictEqual(true);
  });
});
