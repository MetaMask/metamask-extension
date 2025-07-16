import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { ButtonVariant } from '../../component-library';
import { NotificationDetailButton } from './notification-detail-button';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type Notification = NotificationServicesController.Types.INotification;

describe('NotificationDetailButton', () => {
  const defaultProps = {
    variant: ButtonVariant.Primary,
    text: 'Click Me',
    href: 'http://example.com',
    id: 'test-button',
    isExternal: true,
    notification: {
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
      tx_hash:
        '0xf8d58eb524e9ac1ba924599adef1df3b75a3dfa1de68d20918979934db4eb379',
      unread: true,
      type: TRIGGER_TYPES.ERC20_RECEIVED,
    } as Notification,
  };

  it('renders without crashing', () => {
    render(<NotificationDetailButton {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: defaultProps.text });
    expect(button).toHaveAttribute('href', defaultProps.href);
  });
});
