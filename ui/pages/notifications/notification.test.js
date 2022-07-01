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
            origin: 'test',
            createdDate: 1652967897732,
            readDate: null,
            message: 'foo',
          },
          test2: {
            id: 'test2',
            origin: 'test',
            createdDate: 1652967897732,
            readDate: null,
            message: 'bar',
          },
        },
        snaps: {
          test: {
            enabled: true,
            id: 'test',
            manifest: {
              proposedName: 'Notification Example Snap',
              description: 'A notification example snap.',
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

    const { getByText } = render(mockStore);

    expect(getByText('Nothing to see here.')).toBeDefined();
  });
});

describe('NotificationItem', () => {
  const render = (props) => renderWithProvider(<NotificationItem {...props} />);
  it('can render notification item', () => {
    const props = {
      notification: {
        id: 'test',
        origin: 'test',
        createdDate: 1652967897732,
        readDate: null,
        message: 'Hello, http://localhost:8086!',
      },
      snaps: [
        {
          id: 'test',
          tabMessage: () => 'test snap name',
          descriptionMessage: () => 'test description',
          sectionMessage: () => 'test section Message',
          route: '/test',
          icon: 'test',
        },
      ],
      onItemClick: jest.fn(),
    };
    const { getByText } = render(props);

    expect(getByText(props.notification.message)).toBeDefined();
  });
});
