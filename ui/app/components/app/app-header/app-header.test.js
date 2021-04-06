import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import MetaFoxLogo from '../../ui/metafox-logo';
import NetworkDisplay from '../network-display';
import AppHeader from './app-header.container';

describe('App Header', function () {
  let wrapper;

  const props = {
    hideNetworkDropdown: sinon.spy(),
    showNetworkDropdown: sinon.spy(),
    toggleAccountMenu: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    network: 'test',
    provider: {},
    selectedAddress: '0xAddress',
    disabled: false,
    hideNetworkIndicator: false,
    networkDropdownOpen: false,
    isAccountMenuOpen: false,
    isUnlocked: true,
  };

  beforeEach(function () {
    wrapper = shallow(<AppHeader.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        metricsEvent: () => undefined,
      },
    });
  });

  afterEach(function () {
    props.toggleAccountMenu.resetHistory();
  });

  describe('App Header Logo', function () {
    it('routes to default route when logo is clicked', function () {
      const appLogo = wrapper.find(MetaFoxLogo);
      appLogo.simulate('click');
      assert(props.history.push.calledOnce);
      assert.strictEqual(props.history.push.getCall(0).args[0], '/');
    });
  });

  describe('Network', function () {
    it('shows network dropdown when networkDropdownOpen is false', function () {
      const network = wrapper.find(NetworkDisplay);

      network.simulate('click', {
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
      });

      assert(props.showNetworkDropdown.calledOnce);
    });

    it('hides network dropdown when networkDropdownOpen is true', function () {
      wrapper.setProps({ networkDropdownOpen: true });
      const network = wrapper.find(NetworkDisplay);

      network.simulate('click', {
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
      });

      assert(props.hideNetworkDropdown.calledOnce);
    });

    it('hides network indicator', function () {
      wrapper.setProps({ hideNetworkIndicator: true });
      const network = wrapper.find({ network: 'test' });
      assert.strictEqual(network.length, 0);
    });
  });

  describe('Account Menu', function () {
    it('toggles account menu', function () {
      const accountMenu = wrapper.find('.account-menu__icon');
      accountMenu.simulate('click');
      assert(props.toggleAccountMenu.calledOnce);
    });

    it('does not toggle account menu when disabled', function () {
      wrapper.setProps({ disabled: true });
      const accountMenu = wrapper.find('.account-menu__icon');
      accountMenu.simulate('click');
      assert(props.toggleAccountMenu.notCalled);
    });
  });
});
