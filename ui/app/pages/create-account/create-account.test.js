import React from 'react';
import sinon from 'sinon';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import CreateAccountPage from '.';

describe('Create Account Page', () => {
  let wrapper;

  const props = {
    history: {
      push: sinon.spy(),
    },
    location: {
      pathname: '/new-account',
    },
  };

  beforeAll(() => {
    wrapper = mountWithRouter(<CreateAccountPage {...props} />);
  });

  afterEach(() => {
    props.history.push.resetHistory();
  });

  it('clicks create account and routes to new-account path', () => {
    const createAccount = wrapper.find('.new-account__tabs__tab').at(0);
    createAccount.simulate('click');
    expect(props.history.push.getCall(0).args[0]).toStrictEqual('/new-account');
  });

  it('clicks import account and routes to import new account path', () => {
    const importAccount = wrapper.find('.new-account__tabs__tab').at(1);
    importAccount.simulate('click');
    expect(props.history.push.getCall(0).args[0]).toStrictEqual(
      '/new-account/import',
    );
  });

  it('clicks connect HD Wallet and routes to connect new account path', () => {
    const connectHdWallet = wrapper.find('.new-account__tabs__tab').at(2);
    connectHdWallet.simulate('click');
    expect(props.history.push.getCall(0).args[0]).toStrictEqual(
      '/new-account/connect',
    );
  });
});
