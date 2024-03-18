import React from 'react';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import configureStore from '../../store/store';
import Notifications, { NotificationItem } from './notifications';

describe('Notifications', () => {
  const render = (params) => {
    const store = configureStore({
      ...params,
    });

    return renderWithProvider(<Notifications />, store);
  };

  it('can render a list of notifications', () => {
    const mockStore = {
      metamask: {
        notifications: {
          test: {
            id: 'test',
            origin: 'npm:@metamask/notifications-example-snap',
            createdDate: 1652967897732,
            readDate: null,
            message: 'foo',
          },
          test2: {
            id: 'test2',
            origin: 'npm:@metamask/notifications-example-snap',
            createdDate: 1652967897732,
            readDate: null,
            message: 'bar',
          },
        },
        subjectMetadata: {
          'npm:@metamask/notifications-example-snap': {
            name: 'Notifications Example Snap',
            version: '1.2.3',
            subjectType: 'snap',
          },
        },
        snaps: {
          'npm:@metamask/notifications-example-snap': {
            id: 'npm:@metamask/notifications-example-snap',
            version: '1.2.3',
            manifest: {
              proposedName: 'Notifications Example Snap',
              description: 'A snap',
            },
          },
        },
      },
    };

    const { getByText } = render(mockStore);

    expect(
      getByText(mockStore.metamask.notifications.test.message),
    ).toBeDefined();

    expect(
      getByText(mockStore.metamask.notifications.test2.message),
    ).toBeDefined();
  });

  it('can render an empty list of notifications', () => {
    const mockStore = {
      metamask: {
        notifications: {},
        snaps: {},
      },
    };

    const { getByText, getByRole } = render(mockStore);

    expect(
      getByText(
        'This is where you can find notifications from your installed snaps.',
      ),
    ).toBeDefined();
    expect(getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });
});

describe('NotificationItem', () => {
  const render = (params, props) => {
    const store = configureStore({
      ...params,
    });

    return renderWithProvider(<NotificationItem {...props} />, store);
  };

  it('can render notification item', () => {
    const mockStore = {
      metamask: {
        subjectMetadata: {
          'npm:@metamask/notifications-example-snap': {
            name: 'Notifications Example Snap',
            version: '1.2.3',
            subjectType: 'snap',
          },
        },
        snaps: {
          'npm:@metamask/notifications-example-snap': {
            id: 'npm:@metamask/notifications-example-snap',
            version: '1.2.3',
            manifest: {
              proposedName: 'Notifications Example Snap',
              description: 'A snap',
            },
          },
        },
      },
    };
    const props = {
      notification: {
        id: 'test',
        origin: 'npm:@metamask/notifications-example-snap',
        createdDate: 1652967897732,
        readDate: null,
        message: 'Hello, http://localhost:8086!',
      },
      onItemClick: jest.fn(),
    };
    const { getByText } = render(mockStore, props);

    expect(getByText(props.notification.message)).toBeDefined();
  });
});
