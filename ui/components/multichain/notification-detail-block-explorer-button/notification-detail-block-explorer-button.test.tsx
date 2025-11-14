import React from 'react';
import { createMockNotificationERC20Sent } from '@metamask/notification-services-controller/notification-services/mocks';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { NotificationDetailBlockExplorerButton } from './notification-detail-block-explorer-button';

const mockStore = configureStore();
const store = mockStore({
  ...mockState,
});

const mockNotification = processNotification(createMockNotificationERC20Sent());
if (
  'notification_type' in mockNotification &&
  mockNotification.notification_type === 'on-chain' &&
  mockNotification.payload?.tx_hash
) {
  mockNotification.payload.tx_hash =
    '0xf8d58eb524e9ac1ba924599adef1df3b75a3dfa1de68d20918979934db4eb379';
}

describe('NotificationDetailBlockExplorerButton', () => {
  it('renders correctly with a valid block explorer URL', () => {
    render(
      <Provider store={store}>
        <NotificationDetailBlockExplorerButton
          notification={mockNotification}
          chainId={1}
          txHash="0xf8d58eb524e9ac1ba924599adef1df3b75a3dfa1de68d20918979934db4eb379"
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
