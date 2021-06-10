import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import { ROPSTEN_CHAIN_ID } from '../../../../shared/constants/network';
import MenuBar from './menu-bar';

const initState = {
  activeTab: {},
  metamask: {
    provider: {
      chainId: ROPSTEN_CHAIN_ID,
    },
    selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    identities: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Account 1',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
    frequentRpcListDetail: [],
  },
};
const mockStore = configureStore();

describe('MenuBar', () => {
  it('opens account detail menu when account options is clicked', async () => {
    const store = mockStore(initState);
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar />
      </Provider>,
    );
    await waitFor(() =>
      expect(!wrapper.exists('AccountOptionsMenu')).toStrictEqual(true),
    );
    const accountOptions = wrapper.find('.menu-bar__account-options');
    accountOptions.simulate('click');
    wrapper.update();
    await waitFor(() =>
      expect(wrapper.exists('AccountOptionsMenu')).toStrictEqual(true),
    );
  });

  it('sets accountDetailsMenuOpen to false when closed', async () => {
    const store = mockStore(initState);
    const wrapper = mountWithRouter(
      <Provider store={store}>
        <MenuBar />
      </Provider>,
    );
    const accountOptions = wrapper.find('.menu-bar__account-options');
    accountOptions.simulate('click');
    wrapper.update();
    await waitFor(() =>
      expect(wrapper.exists('AccountOptionsMenu')).toStrictEqual(true),
    );
    const accountDetailsMenu = wrapper.find('AccountOptionsMenu');
    await waitFor(() => {
      accountDetailsMenu.prop('onClose')();
      wrapper.update();
      expect(!wrapper.exists('AccountOptionsMenu')).toStrictEqual(true);
    });
  });
});
