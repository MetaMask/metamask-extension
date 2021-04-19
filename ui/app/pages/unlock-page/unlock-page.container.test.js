import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/dom';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
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

  it('clicks imports seed button', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      configureMockStore()({ metamask: { currentLocale: 'en' } }),
    );

    fireEvent(
      getByText('import using account seed phrase'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(props.onRestore.calledOnce).toStrictEqual(true);
  });
});
