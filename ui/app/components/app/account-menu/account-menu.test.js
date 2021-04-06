import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import AccountMenu from '.';

describe('Account Menu', function () {
  let wrapper;

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
  };

  const store = configureMockStore()(mockStore);

  const props = {
    isAccountMenuOpen: true,
    addressConnectedDomainMap: {},
    accounts: [
      {
        address: '0xAddress',
        name: 'Account 1',
        balance: '0x0',
      },
      {
        address: '0xImportedAddress',
        name: 'Imported Account 1',
        balance: '0x0',
      },
    ],
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0xAdress'],
      },
      {
        type: 'Simple Key Pair',
        accounts: ['0xImportedAddress'],
      },
    ],
    prevIsAccountMenuOpen: false,
    lockMetamask: sinon.spy(),
    showAccountDetail: sinon.spy(),
    showRemoveAccountConfirmationModal: sinon.spy(),
    toggleAccountMenu: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
  };

  before(function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <AccountMenu.WrappedComponent {...props} />
      </Provider>,
      store,
    );
  });

  afterEach(function () {
    props.toggleAccountMenu.resetHistory();
    props.history.push.resetHistory();
  });

  describe('Render Content', function () {
    it('returns account name from identities', function () {
      const accountName = wrapper.find('.account-menu__name');
      assert.strictEqual(accountName.length, 2);
    });

    it('renders user preference currency display balance from account balance', function () {
      const accountBalance = wrapper.find(
        '.currency-display-component.account-menu__balance',
      );
      assert.strictEqual(accountBalance.length, 2);
    });

    it('simulate click', function () {
      const click = wrapper.find(
        '.account-menu__account.account-menu__item--clickable',
      );
      click.first().simulate('click');

      assert(props.showAccountDetail.calledOnce);
      assert.strictEqual(
        props.showAccountDetail.getCall(0).args[0],
        '0xAddress',
      );
    });

    it('render imported account label', function () {
      const importedAccount = wrapper.find('.keyring-label.allcaps');
      assert.strictEqual(importedAccount.text(), 'imported');
    });
  });

  describe('Log Out', function () {
    let logout;

    it('logout', function () {
      logout = wrapper.find('.account-menu__lock-button');
      assert.strictEqual(logout.length, 1);
    });

    it('simulate click', function () {
      logout.simulate('click');
      assert(props.lockMetamask.calledOnce);
      assert.strictEqual(props.history.push.getCall(0).args[0], '/');
    });
  });

  describe('Create Account', function () {
    let createAccount;

    it('renders create account item', function () {
      createAccount = wrapper.find({ text: 'createAccount' });
      assert.strictEqual(createAccount.length, 1);
    });

    it('calls toggle menu and push new-account route to history', function () {
      createAccount.simulate('click');
      assert(props.toggleAccountMenu.calledOnce);
      assert.strictEqual(props.history.push.getCall(0).args[0], '/new-account');
    });
  });

  describe('Import Account', function () {
    let importAccount;

    it('renders import account item', function () {
      importAccount = wrapper.find({ text: 'importAccount' });
      assert.strictEqual(importAccount.length, 1);
    });

    it('calls toggle menu and push /new-account/import route to history', function () {
      importAccount.simulate('click');
      assert(props.toggleAccountMenu.calledOnce);
      assert(props.history.push.getCall(0).args[0], '/new-account/import');
    });
  });

  describe('Connect Hardware Wallet', function () {
    let connectHardwareWallet;

    it('renders import account item', function () {
      connectHardwareWallet = wrapper.find({ text: 'connectHardwareWallet' });
      assert.strictEqual(connectHardwareWallet.length, 1);
    });

    it('calls toggle menu and push /new-account/connect route to history', function () {
      connectHardwareWallet.simulate('click');
      assert(props.toggleAccountMenu.calledOnce);
      assert.strictEqual(
        props.history.push.getCall(0).args[0],
        '/new-account/connect',
      );
    });
  });

  describe('Info & Help', function () {
    let infoHelp;

    it('renders import account item', function () {
      infoHelp = wrapper.find({ text: 'infoHelp' });
      assert.strictEqual(infoHelp.length, 1);
    });

    it('calls toggle menu and push /new-account/connect route to history', function () {
      infoHelp.simulate('click');
      assert(props.toggleAccountMenu.calledOnce);
      assert.strictEqual(
        props.history.push.getCall(0).args[0],
        '/settings/about-us',
      );
    });
  });

  describe('Settings', function () {
    let settings;

    it('renders import account item', function () {
      settings = wrapper.find({ text: 'settings' });
      assert.strictEqual(settings.length, 1);
    });

    it('calls toggle menu and push /new-account/connect route to history', function () {
      settings.simulate('click');
      assert(props.toggleAccountMenu.calledOnce);
      assert.strictEqual(props.history.push.getCall(0).args[0], '/settings');
    });
  });
});
