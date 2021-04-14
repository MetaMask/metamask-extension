import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import AccountMenu from '.';

describe('Account Menu', () => {
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

  beforeAll(() => {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <AccountMenu.WrappedComponent {...props} />
      </Provider>,
      store,
    );
  });

  afterEach(() => {
    props.toggleAccountMenu.resetHistory();
    props.history.push.resetHistory();
  });

  describe('Render Content', () => {
    it('returns account name from identities', () => {
      const accountName = wrapper.find('.account-menu__name');
      expect(accountName).toHaveLength(2);
    });

    it('renders user preference currency display balance from account balance', () => {
      const accountBalance = wrapper.find(
        '.currency-display-component.account-menu__balance',
      );
      expect(accountBalance).toHaveLength(2);
    });

    it('simulate click', () => {
      const click = wrapper.find(
        '.account-menu__account.account-menu__item--clickable',
      );
      click.first().simulate('click');

      expect(props.showAccountDetail.calledOnce).toStrictEqual(true);
      expect(props.showAccountDetail.getCall(0).args[0]).toStrictEqual(
        '0xAddress',
      );
    });

    it('render imported account label', () => {
      const importedAccount = wrapper.find('.keyring-label.allcaps');
      expect(importedAccount.text()).toStrictEqual('imported');
    });
  });

  describe('Log Out', () => {
    let logout;

    it('logout', () => {
      logout = wrapper.find('.account-menu__lock-button');
      expect(logout).toHaveLength(1);
    });

    it('simulate click', () => {
      logout.simulate('click');
      expect(props.lockMetamask.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual('/');
    });
  });

  describe('Create Account', () => {
    let createAccount;

    it('renders create account item', () => {
      createAccount = wrapper.find({ text: 'createAccount' });
      expect(createAccount).toHaveLength(1);
    });

    it('calls toggle menu and push new-account route to history', () => {
      createAccount.simulate('click');
      expect(props.toggleAccountMenu.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual(
        '/new-account',
      );
    });
  });

  describe('Import Account', () => {
    let importAccount;

    it('renders import account item', () => {
      importAccount = wrapper.find({ text: 'importAccount' });
      expect(importAccount).toHaveLength(1);
    });

    it('calls toggle menu and push /new-account/import route to history', () => {
      importAccount.simulate('click');
      expect(props.toggleAccountMenu.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual(
        '/new-account/import',
      );
    });
  });

  describe('Connect Hardware Wallet', () => {
    let connectHardwareWallet;

    it('renders import account item', () => {
      connectHardwareWallet = wrapper.find({ text: 'connectHardwareWallet' });
      expect(connectHardwareWallet).toHaveLength(1);
    });

    it('calls toggle menu and push /new-account/connect route to history', () => {
      connectHardwareWallet.simulate('click');
      expect(props.toggleAccountMenu.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual(
        '/new-account/connect',
      );
    });
  });

  describe('Info & Help', () => {
    let infoHelp;

    it('renders import account item', () => {
      infoHelp = wrapper.find({ text: 'infoHelp' });
      expect(infoHelp).toHaveLength(1);
    });

    it('calls toggle menu and push /new-account/connect route to history', () => {
      infoHelp.simulate('click');
      expect(props.toggleAccountMenu.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual(
        '/settings/about-us',
      );
    });
  });

  describe('Settings', () => {
    let settings;

    it('renders import account item', () => {
      settings = wrapper.find({ text: 'settings' });
      expect(settings).toHaveLength(1);
    });

    it('calls toggle menu and push /new-account/connect route to history', () => {
      settings.simulate('click');
      expect(props.toggleAccountMenu.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual('/settings');
    });
  });
});
