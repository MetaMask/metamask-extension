import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import ColorIndicator from '../../ui/color-indicator';
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

  describe('NetworkDropdown in appState is true', () => {
    const mockState = {
      metamask: {
        network: '1',
        provider: {
          type: 'test',
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
    const store = createMockStore(mockState);

    beforeEach(() => {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />);
    });

    it('renders 8 DropDownMenuItems', () => {
      expect(wrapper.find(DropdownMenuItem)).toHaveLength(8);
    });

    it('checks background color for first ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(0);
      expect(colorIndicator.prop('color')).toStrictEqual('mainnet');
      expect(colorIndicator.prop('borderColor')).toStrictEqual('mainnet');
    });

    it('checks background color for second ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(1);
      expect(colorIndicator.prop('color')).toStrictEqual('ropsten');
      expect(colorIndicator.prop('borderColor')).toStrictEqual('ropsten');
    });

    it('checks background color for third ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(2);
      expect(colorIndicator.prop('color')).toStrictEqual('kovan');
      expect(colorIndicator.prop('borderColor')).toStrictEqual('kovan');
    });

    it('checks background color for fourth ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(3);
      expect(colorIndicator.prop('color')).toStrictEqual('rinkeby');
      expect(colorIndicator.prop('borderColor')).toStrictEqual('rinkeby');
    });

    it('checks background color for fifth ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(4);
      expect(colorIndicator.prop('color')).toStrictEqual('goerli');
      expect(colorIndicator.prop('borderColor')).toStrictEqual('goerli');
    });

    it('checks background color for sixth ColorIndicator', () => {
      const colorIndicator = wrapper.find(ColorIndicator).at(5);
      const customNetworkGray = 'ui-2';
      expect(colorIndicator.prop('color')).toStrictEqual(customNetworkGray);
      expect(colorIndicator.prop('borderColor')).toStrictEqual(
        customNetworkGray,
      );
    });

    it('checks dropdown for frequestRPCList from state', () => {
      expect(wrapper.find(DropdownMenuItem).at(6).text()).toStrictEqual(
        '✓http://localhost:7545',
      );
    });
  });
});
