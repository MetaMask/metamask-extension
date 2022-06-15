import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Button from '../../ui/button';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import ColorIndicator from '../../ui/color-indicator';
import { LOCALHOST_RPC_URL } from '../../../../shared/constants/network';
import NetworkDropdown from './network-dropdown';
import { DropdownMenuItem } from './dropdown';

describe('Network Dropdown', () => {
  let wrapper;
  const createMockStore = configureMockStore([thunk]);

  describe('NetworkDropdown in appState in false', () => {
    const mockState = {
      metamask: {
        network: '1',
        provider: {
          type: 'test',
        },
        showTestnetMessageInDropdown: false,
        preferences: {
          showTestNetworks: true,
        },
      },
      appState: {
        networkDropdownOpen: false,
      },
    };

    const store = createMockStore(mockState);

    beforeEach(() => {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />);
    });

    it('checks for network droppo class', () => {
      expect(wrapper.find('.network-droppo')).toHaveLength(1);
    });

    it('renders only one child when networkDropdown is false in state', () => {
      expect(wrapper.children()).toHaveLength(1);
    });
  });

  describe('NetworkDropdown in appState is true and show test networks is true', () => {
    const mockState = {
      metamask: {
        network: '1',
        provider: {
          type: 'test',
        },
        showTestnetMessageInDropdown: false,
        preferences: {
          showTestNetworks: true,
        },
        frequentRpcListDetail: [
          { chainId: '0x1a', rpcUrl: 'http://localhost:7545' },
          { rpcUrl: 'http://localhost:7546' },
          { rpcUrl: LOCALHOST_RPC_URL, nickname: 'localhost' },
        ],
      },
      appState: {
        networkDropdownOpen: true,
      },
    };

    global.platform = {
      openExtensionInBrowser: jest.fn(),
    };

    const store = createMockStore(mockState);

    let testNetworkIndex = 1;

    const findTestNetworkFirstIndex = (_wrapper) => {
      let i = 1;
      let found = false;
      while (!found) {
        if (
          _wrapper.find(ColorIndicator).at(i).prop('color') === 'icon-muted'
        ) {
          i += 1;
        } else {
          found = true;
        }
      }

      testNetworkIndex = i;
    };

    beforeAll(() => {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />);
      findTestNetworkFirstIndex(wrapper);
    });

    it('checks background color for first ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(0);
      expect(colorIndicator.prop('color')).toStrictEqual('mainnet');
    });

    it('checks background color for second ColorIndicator', () => {
      // find where test networks start in case there are custom RPCs
      const colorIndicator = wrapper.find(ColorIndicator).at(testNetworkIndex);
      expect(colorIndicator.prop('color')).toStrictEqual('ropsten');
    });

    it('checks background color for third ColorIndicator', () => {
      const colorIndicator = wrapper
        .find(ColorIndicator)
        .at(testNetworkIndex + 1);
      expect(colorIndicator.prop('color')).toStrictEqual('kovan');
    });

    it('checks background color for fourth ColorIndicator', () => {
      const colorIndicator = wrapper
        .find(ColorIndicator)
        .at(testNetworkIndex + 2);
      expect(colorIndicator.prop('color')).toStrictEqual('rinkeby');
    });

    it('checks background color for fifth ColorIndicator', () => {
      const colorIndicator = wrapper
        .find(ColorIndicator)
        .at(testNetworkIndex + 3);
      expect(colorIndicator.prop('color')).toStrictEqual('goerli');
    });

    it('checks background color for sixth ColorIndicator', () => {
      const colorIndicator = wrapper
        .find(ColorIndicator)
        .at(testNetworkIndex + 4);
      expect(colorIndicator.prop('color')).toStrictEqual('localhost');
      expect(
        wrapper
          .find(DropdownMenuItem)
          .at(testNetworkIndex + 4)
          .text(),
      ).toStrictEqual('✓localhost');
    });

    it('checks that Add Network button is rendered', () => {
      expect(wrapper.find(Button).at(0).children().text()).toStrictEqual(
        'addNetwork',
      );
    });

    it('shows test networks in the dropdown', () => {
      expect(wrapper.find('.network-dropdown-list li')).toHaveLength(8);
    });
  });

  describe('NetworkDropdown in appState is true and show test networks is false', () => {
    const mockState = {
      metamask: {
        network: '1',
        provider: {
          type: 'test',
        },
        showTestnetMessageInDropdown: false,
        preferences: {
          showTestNetworks: false,
        },
        frequentRpcListDetail: [
          { chainId: '0x1a', rpcUrl: 'http://localhost:7545' },
          { rpcUrl: 'http://localhost:7546' },
        ],
      },
      appState: {
        networkDropdownOpen: true,
      },
    };

    global.platform = {
      openExtensionInBrowser: jest.fn(),
    };

    const store = createMockStore(mockState);

    beforeAll(() => {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />);
    });

    it('checks background color for first ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(0);
      expect(colorIndicator.prop('color')).toStrictEqual('mainnet');
      expect(wrapper.find(DropdownMenuItem).at(0).text()).toStrictEqual(
        '✓mainnet',
      );
    });

    it('checks that Add Network button is rendered', () => {
      expect(wrapper.find(Button).at(0).children().text()).toStrictEqual(
        'addNetwork',
      );
    });

    it('does not show test networks in the dropdown', () => {
      expect(wrapper.find('.network-dropdown-list li')).toHaveLength(3);
    });
  });
});
