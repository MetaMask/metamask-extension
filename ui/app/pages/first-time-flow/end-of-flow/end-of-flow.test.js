import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import EndOfFlowScreen from './end-of-flow.container';

describe('End of Flow Screen', function () {
  let wrapper;

  const props = {
    history: {
      push: sinon.spy(),
    },
    setCompletedOnboarding: sinon.spy(),
  };

  beforeEach(function () {
    wrapper = mountWithRouter(<EndOfFlowScreen.WrappedComponent {...props} />);
  });

  it('renders', function () {
    assert.strictEqual(wrapper.length, 1);
  });

  it('should navigate to the default route on click', function (done) {
    const endOfFlowButton = wrapper.find(
      '.btn-primary.first-time-flow__button',
    );
    endOfFlowButton.simulate('click');

    setImmediate(() => {
      assert(props.history.push.calledOnceWithExactly(DEFAULT_ROUTE));
      done();
    });
  });
});
