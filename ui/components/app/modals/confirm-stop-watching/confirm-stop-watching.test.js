import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import ConfirmStopWatching from './confirm-stop-watching.container';

describe('Confirm Stop Watching', () => {
  let wrapper;

  const props = {
    hideModal: sinon.spy(),
    stopWatching: sinon.stub().resolves(),
  };

  beforeEach(() => {
    wrapper = mount(<ConfirmStopWatching.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('hides modal when cancel button is clicked', () => {
    const cancel = wrapper.find({ type: 'secondary' });
    cancel.simulate('click');

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('stops watching the account and hides modal when stop watching button is clicked', async () => {
    const stop = wrapper.find({ type: 'primary' });
    stop.simulate('click');

    expect(await props.stopWatching.calledOnce).toStrictEqual(true);
    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });
});
