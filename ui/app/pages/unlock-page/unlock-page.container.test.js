import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import UnlockPage from './unlock-page.container';

describe('Unlock Page', () => {
  let wrapper;

  const props = {
    history: {
      push: sinon.spy(),
    },
    isUnlocked: false,
    onRestore: sinon.spy(),
    onSubmit: sinon.spy(),
    forceUpdateMetamaskState: sinon.spy(),
    showOptInModal: sinon.spy(),
  };

  beforeEach(() => {
    wrapper = mount(<UnlockPage.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterAll(() => {
    sinon.restore();
  });

  it('renders', () => {
    expect(wrapper).toHaveLength(1);
  });

  it('changes password and submits', () => {
    const passwordField = wrapper.find({ type: 'password', id: 'password' });
    const loginButton = wrapper.find({ type: 'submit' }).last();

    const event = { target: { value: 'password' } };
    expect(wrapper.instance().state.password).toStrictEqual('');
    passwordField.last().simulate('change', event);
    expect(wrapper.instance().state.password).toStrictEqual('password');

    loginButton.simulate('click');
    expect(props.onSubmit.calledOnce).toStrictEqual(true);
  });
});
