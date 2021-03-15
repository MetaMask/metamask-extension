import assert from 'assert';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import ColorIndicator from '../../ui/color-indicator';
import NetworkDropdown from './network-dropdown';
import { DropdownMenuItem } from './dropdown';

describe('Network Dropdown', function () {
  let wrapper;
  const createMockStore = configureMockStore([thunk]);

  describe('NetworkDropdown in appState in false', function () {
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

    beforeEach(function () {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />);
    });

    it('checks for network droppo class', function () {
      assert.strictEqual(wrapper.find('.network-droppo').length, 1);
    });

    it('renders only one child when networkDropdown is false in state', function () {
      assert.strictEqual(wrapper.children().length, 1);
    });
  });

  describe('NetworkDropdown in appState is true', function () {
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

    beforeEach(function () {
      wrapper = mountWithRouter(<NetworkDropdown store={store} />);
    });

    it('renders 8 DropDownMenuItems ', function () {
      assert.strictEqual(wrapper.find(DropdownMenuItem).length, 8);
    });

    it('checks background color for first ColorIndicator', function () {
      const colorIndicator = wrapper.find(ColorIndicator).at(0);
      assert.strictEqual(colorIndicator.prop('color'), 'mainnet');
      assert.strictEqual(colorIndicator.prop('borderColor'), 'mainnet');
    });

    it('checks background color for second ColorIndicator', function () {
      const colorIndicator = wrapper.find(ColorIndicator).at(1);
      assert.strictEqual(colorIndicator.prop('color'), 'ropsten');
      assert.strictEqual(colorIndicator.prop('borderColor'), 'ropsten');
    });

    it('checks background color for third ColorIndicator', function () {
      const colorIndicator = wrapper.find(ColorIndicator).at(2);
      assert.strictEqual(colorIndicator.prop('color'), 'kovan');
      assert.strictEqual(colorIndicator.prop('borderColor'), 'kovan');
    });

    it('checks background color for fourth ColorIndicator', function () {
      const colorIndicator = wrapper.find(ColorIndicator).at(3);
      assert.strictEqual(colorIndicator.prop('color'), 'rinkeby');
      assert.strictEqual(colorIndicator.prop('borderColor'), 'rinkeby');
    });

    it('checks background color for fifth ColorIndicator', function () {
      const colorIndicator = wrapper.find(ColorIndicator).at(4);
      assert.strictEqual(colorIndicator.prop('color'), 'goerli');
      assert.strictEqual(colorIndicator.prop('borderColor'), 'goerli');
    });

    it('checks background color for sixth ColorIndicator', function () {
      const colorIndicator = wrapper.find(ColorIndicator).at(5);
      const customNetworkGray = 'ui-2';
      assert.strictEqual(colorIndicator.prop('color'), customNetworkGray);
      assert.strictEqual(colorIndicator.prop('borderColor'), customNetworkGray);
    });

    it('checks dropdown for frequestRPCList from state', function () {
      assert.strictEqual(
        wrapper.find(DropdownMenuItem).at(6).text(),
        '✓http://localhost:7545',
      );
    });
  });
});
