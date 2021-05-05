import React from 'react';
import sinon from 'sinon';
import { tick } from '../../../../../test/lib/tick';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import EndOfFlowScreen from './end-of-flow.container';

describe('End of Flow Screen', () => {
  let wrapper;

  const props = {
    history: {
      push: sinon.stub(),
    },
    setCompletedOnboarding: sinon.stub().resolves(),
  };

  beforeEach(() => {
    wrapper = mountWithRouter(<EndOfFlowScreen.WrappedComponent {...props} />);
  });

  it('renders', () => {
    expect(wrapper).toHaveLength(1);
  });

  it('should navigate to the default route on click', async () => {
    const endOfFlowButton = wrapper.find(
      '.btn-primary.first-time-flow__button',
    );
    endOfFlowButton.simulate('click');

    await tick();

    expect(
      props.history.push.calledOnceWithExactly(DEFAULT_ROUTE),
    ).toStrictEqual(true);
  });
});
