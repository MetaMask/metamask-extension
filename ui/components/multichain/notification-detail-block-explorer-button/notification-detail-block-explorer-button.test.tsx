import React from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { NotificationDetailBlockExplorerButton } from './notification-detail-block-explorer-button';

type Notification = NotificationServicesController.Types.INotification;

const mockStore = configureStore();
const store = mockStore({
  ...mockState,
});

const mockNotification = {
  createdAt: '2023-12-11T22:27:13.020176Z',
  isRead: false,
  block_number: 18765683,
  block_timestamp: '1702330595',
  chain_id: 1,
  created_at: '2023-12-11T22:27:13.020176Z',
  data: {
    to: '0xeae7380dd4cef6fbd1144f49e4d1e6964258a4f4',
    from: '0xdbf5e9c5206d0db70a90108bf936da60221dc080',
    kind: 'erc20_received',
    token: {
      usd: '1.00',
      name: 'Dai Stablecoin',
      image:
        'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/dai.svg',
      amount: '232708000000000000000000',
      symbol: 'DAI',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      decimals: '18',
    },
    network_fee: {
      gas_price: '40060432936',
      native_token_price_in_usd: '2192.74',
    },
  },
  id: '0441bf59-d211-5c55-91b5-c5d859a3d301',
  trigger_id: 'e6a9210c-f367-4c9f-8767-12a6153e5c37',
  tx_hash: '0xf8d58eb524e9ac1ba924599adef1df3b75a3dfa1de68d20918979934db4eb379',
  unread: true,
  type: 'ERC20_RECEIVED',
};

describe('NotificationDetailBlockExplorerButton', () => {
  it('renders correctly with a valid block explorer URL', () => {
    render(
      <Provider store={store}>
        <NotificationDetailBlockExplorerButton
          notification={mockNotification as Notification}
          chainId={1}
          txHash="0xf8d58eb524e9ac1ba924599adef1df3b75a3dfa1de68d20918979934db4eb379"
          id="button1"
        />
      </Provider>,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining(
        '/tx/0xf8d58eb524e9ac1ba924599adef1df3b75a3dfa1de68d20918979934db4eb379',
      ),
    );
  });
});
