import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import MetaFoxLogo from '../../ui/metafox-logo';
import NetworkDisplay from '../network-display';
import AppHeader from './app-header.container';

describe('App Header', () => {
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

  beforeEach(() => {
    wrapper = shallow(<AppHeader.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        metricsEvent: () => undefined,
      },
    });
  });

  afterEach(() => {
    props.toggleAccountMenu.resetHistory();
  });

  describe('App Header Logo', () => {
    it('routes to default route when logo is clicked', () => {
      const appLogo = wrapper.find(MetaFoxLogo);
      appLogo.simulate('click');
      expect(props.history.push.calledOnce).toStrictEqual(true);
      expect(props.history.push.getCall(0).args[0]).toStrictEqual('/');
    });
  });

  describe('Network', () => {
    it('shows network dropdown when networkDropdownOpen is false', () => {
      const network = wrapper.find(NetworkDisplay);
      network.simulate('click', {
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
      });

      expect(props.showNetworkDropdown.calledOnce).toStrictEqual(true);
    });

    it('hides network dropdown when networkDropdownOpen is true', () => {
      wrapper.setProps({ networkDropdownOpen: true });
      const network = wrapper.find(NetworkDisplay);

      network.simulate('click', {
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
      });

      expect(props.hideNetworkDropdown.calledOnce).toStrictEqual(true);
    });

    it('hides network indicator', () => {
      wrapper.setProps({ hideNetworkIndicator: true });
      const network = wrapper.find(NetworkDisplay);
      expect(network).toHaveLength(0);
    });
  });

  describe('Account Menu', () => {
    it('toggles account menu', () => {
      const accountMenu = wrapper.find('.account-menu__icon');
      accountMenu.simulate('click');
      expect(props.toggleAccountMenu.calledOnce).toStrictEqual(true);
    });

    it('does not toggle account menu when disabled', () => {
      wrapper.setProps({ disabled: true });
      const accountMenu = wrapper.find('.account-menu__icon');
      accountMenu.simulate('click');
      expect(props.toggleAccountMenu.notCalled).toStrictEqual(true);
    });
  });
});
