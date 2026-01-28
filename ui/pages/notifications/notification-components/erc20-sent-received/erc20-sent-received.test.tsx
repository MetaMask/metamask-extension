import React from 'react';
import { render } from '@testing-library/react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import type { INotification } from '@metamask/notification-services-controller/notification-services';
import { components } from './erc20-sent-received';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

// Mock the translate function
jest.mock('../../../../../shared/lib/translate', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      notificationItemSentTo: 'Sent to',
      notificationItemReceivedFrom: 'Received from',
      notificationItemInvalid: 'Invalid notification',
      notificationItemSent: 'Sent',
      notificationItemReceived: 'Received',
      notificationItemFrom: 'From',
      notificationItemTo: 'To',
      notificationItemStatus: 'Status',
      notificationItemConfirmed: 'Confirmed',
      notificationItemTransactionId: 'Transaction ID',
      asset: 'Asset',
      notificationDetailNetwork: 'Network',
      you: 'You',
    };
    return translations[key] || key;
  },
}));

// Mock notification utilities
jest.mock('../../../../helpers/utils/notification.util', () => ({
  createTextItems: jest.fn((texts: string[]) =>
    texts.map((text) => ({ text })),
  ),
  getAmount: jest.fn(() => '1.5'),
  getUsdAmount: jest.fn(() => '100.00'),
  formatIsoDateString: jest.fn(() => '2024-01-28'),
  getNetworkDetailsByChainId: jest.fn(() => ({
    nativeCurrencyLogo: 'eth-logo.png',
    nativeCurrencyName: 'Ethereum',
  })),
}));

// Mock util functions
jest.mock('../../../../helpers/utils/util', () => ({
  shortenAddress: jest.fn((address: string) => `${address.slice(0, 6)}...`),
}));

// Mock multichain components
jest.mock('../../../../components/multichain', () => ({
  NotificationListItem: ({
    title,
    description,
  }: {
    title: unknown;
    description: unknown;
  }) => (
    <div data-testid="notification-list-item">
      <div data-testid="title">{JSON.stringify(title)}</div>
      <div data-testid="description">{JSON.stringify(description)}</div>
    </div>
  ),
  NotificationDetailTitle: ({ title }: { title: string }) => (
    <div data-testid="notification-detail-title">{title}</div>
  ),
  NotificationDetailAddress: ({ address }: { address: string }) => (
    <div data-testid="notification-detail-address">{address}</div>
  ),
  NotificationDetailInfo: () => <div data-testid="notification-detail-info" />,
  NotificationDetailCopyButton: () => (
    <div data-testid="notification-detail-copy-button" />
  ),
  NotificationDetailAsset: ({ detail }: { detail: string }) => (
    <div data-testid="notification-detail-asset">{detail}</div>
  ),
  NotificationDetailNetworkFee: () => (
    <div data-testid="notification-detail-network-fee" />
  ),
  NotificationDetailBlockExplorerButton: () => (
    <div data-testid="notification-detail-block-explorer-button" />
  ),
}));

describe('ERC20SentReceived Component', () => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const validNotification = {
    id: '123',
    type: TRIGGER_TYPES.ERC20_RECEIVED,
    isRead: false,
    createdAt: '2024-01-28T10:00:00Z',
    payload: {
      data: {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        token: {
          name: 'Test Token',
          symbol: 'TEST',
          image: 'test-token.png',
          amount: '1500000000000000000',
          decimals: 18,
          usd: '100',
        },
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: '1',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_hash: '0xabcdef1234567890',
    },
  };

  describe('item component', () => {
    it('renders valid notification without crashing', () => {
      const ItemComponent = components.item;
      const { getByTestId } = render(
        <ItemComponent
          notification={validNotification as INotification}
          onClick={jest.fn()}
        />,
      );

      expect(getByTestId('notification-list-item')).toBeInTheDocument();
    });

    it('handles notification with undefined payload gracefully', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const ItemComponent = components.item;
      const { getByTestId } = render(
        <ItemComponent
          notification={invalidNotification as INotification}
          onClick={jest.fn()}
        />,
      );

      expect(getByTestId('notification-list-item')).toBeInTheDocument();
      const title = getByTestId('title');
      expect(title.textContent).toContain('Invalid notification');
    });

    it('handles notification with missing payload.data gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const invalidNotification = {
        ...validNotification,
        payload: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          tx_hash: '0xabcdef',
        },
      };

      const ItemComponent = components.item;
      const { getByTestId } = render(
        <ItemComponent
          notification={invalidNotification as INotification}
          onClick={jest.fn()}
        />,
      );

      expect(getByTestId('notification-list-item')).toBeInTheDocument();
      const title = getByTestId('title');
      expect(title.textContent).toContain('Invalid notification');
    });

    it('handles notification with missing token data gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const invalidNotification = {
        ...validNotification,
        payload: {
          data: {
            from: '0x1234',
            to: '0x5678',
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          tx_hash: '0xabcdef',
        },
      };

      const ItemComponent = components.item;
      const { getByTestId } = render(
        <ItemComponent
          notification={invalidNotification as INotification}
          onClick={jest.fn()}
        />,
      );

      expect(getByTestId('notification-list-item')).toBeInTheDocument();
      const title = getByTestId('title');
      expect(title.textContent).toContain('Invalid notification');
    });

    it('handles notification with missing from address gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const invalidNotification = {
        ...validNotification,
        payload: {
          data: {
            to: '0x5678',
            token: {
              name: 'Test',
              symbol: 'TEST',
              image: 'test.png',
            },
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          tx_hash: '0xabcdef',
        },
      };

      const ItemComponent = components.item;
      const { getByTestId } = render(
        <ItemComponent
          notification={invalidNotification as INotification}
          onClick={jest.fn()}
        />,
      );

      expect(getByTestId('notification-list-item')).toBeInTheDocument();
      const title = getByTestId('title');
      expect(title.textContent).toContain('Invalid notification');
    });
  });

  describe('details.title component', () => {
    it('renders title for valid notification', () => {
      const TitleComponent = components.details.title;
      const { getByTestId } = render(
        <TitleComponent notification={validNotification as INotification} />,
      );

      const title = getByTestId('notification-detail-title');
      expect(title.textContent).toContain('TEST');
    });

    it('renders title with empty symbol for invalid notification', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const TitleComponent = components.details.title;
      const { getByTestId } = render(
        <TitleComponent notification={invalidNotification as INotification} />,
      );

      const title = getByTestId('notification-detail-title');
      expect(title).toBeInTheDocument();
    });
  });

  describe('details.body components', () => {
    it('From component renders for valid notification', () => {
      const FromComponent = components.details.body.From;
      const { getByTestId } = render(
        <FromComponent notification={validNotification as INotification} />,
      );

      expect(getByTestId('notification-detail-address')).toBeInTheDocument();
    });

    it('From component returns null for invalid notification', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const FromComponent = components.details.body.From;
      const { container } = render(
        <FromComponent notification={invalidNotification as INotification} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('To component renders for valid notification', () => {
      const ToComponent = components.details.body.To;
      const { getByTestId } = render(
        <ToComponent notification={validNotification as INotification} />,
      );

      expect(getByTestId('notification-detail-address')).toBeInTheDocument();
    });

    it('To component returns null for invalid notification', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const ToComponent = components.details.body.To;
      const { container } = render(
        <ToComponent notification={invalidNotification as INotification} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('Status component renders for valid notification', () => {
      const StatusComponent = components.details.body.Status;
      const { getByTestId } = render(
        <StatusComponent notification={validNotification as INotification} />,
      );

      expect(getByTestId('notification-detail-info')).toBeInTheDocument();
    });

    it('Status component returns null for invalid notification', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const StatusComponent = components.details.body.Status;
      const { container } = render(
        <StatusComponent notification={invalidNotification as INotification} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('Asset component renders for valid notification', () => {
      const AssetComponent = components.details.body.Asset;
      const { getByTestId } = render(
        <AssetComponent notification={validNotification as INotification} />,
      );

      expect(getByTestId('notification-detail-asset')).toBeInTheDocument();
    });

    it('Asset component returns null for invalid notification', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const AssetComponent = components.details.body.Asset;
      const { container } = render(
        <AssetComponent notification={invalidNotification as INotification} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('Network component renders for valid notification', () => {
      const NetworkComponent = components.details.body.Network;
      const { getByTestId } = render(
        <NetworkComponent notification={validNotification as INotification} />,
      );

      expect(getByTestId('notification-detail-asset')).toBeInTheDocument();
    });

    it('Network component returns null when chain_id is missing', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const invalidNotification = {
        ...validNotification,
        payload: {
          ...validNotification.payload,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: undefined,
        },
      };

      const NetworkComponent = components.details.body.Network;
      const { container } = render(
        <NetworkComponent
          notification={invalidNotification as INotification}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('NetworkFee component renders for valid notification', () => {
      const NetworkFeeComponent = components.details.body.NetworkFee;
      const { getByTestId } = render(
        <NetworkFeeComponent
          notification={validNotification as INotification}
        />,
      );

      expect(
        getByTestId('notification-detail-network-fee'),
      ).toBeInTheDocument();
    });

    it('NetworkFee component returns null for invalid notification', () => {
      const invalidNotification = {
        ...validNotification,
        payload: undefined,
      };

      const NetworkFeeComponent = components.details.body.NetworkFee;
      const { container } = render(
        <NetworkFeeComponent
          notification={invalidNotification as INotification}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('details.footer components', () => {
    it('ScanLink component renders for valid notification', () => {
      const ScanLinkComponent = components.details.footer.ScanLink;
      const { getByTestId } = render(
        <ScanLinkComponent notification={validNotification as INotification} />,
      );

      expect(
        getByTestId('notification-detail-block-explorer-button'),
      ).toBeInTheDocument();
    });

    it('ScanLink component returns null when chain_id is missing', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const invalidNotification = {
        ...validNotification,
        payload: {
          ...validNotification.payload,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: undefined,
        },
      };

      const ScanLinkComponent = components.details.footer.ScanLink;
      const { container } = render(
        <ScanLinkComponent
          notification={invalidNotification as INotification}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('ScanLink component returns null when tx_hash is missing', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const invalidNotification = {
        ...validNotification,
        payload: {
          ...validNotification.payload,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          tx_hash: undefined,
        },
      };

      const ScanLinkComponent = components.details.footer.ScanLink;
      const { container } = render(
        <ScanLinkComponent
          notification={invalidNotification as INotification}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
