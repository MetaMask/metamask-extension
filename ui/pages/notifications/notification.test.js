import React from 'react';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import configureStore from '../../store/store';
import Notifications from './notifications';

const render = (params) => {
  const store = configureStore({
    ...params,
  });

  return renderWithProvider(<Notifications />, store);
};

describe('Notifications', () => {
  it('can render a list of notifications', () => {
    const mockStore = {
      metamask: {
        notifications: {
          test: {
            id: 'test',
            origin: 'local:http://localhost:8086/',
            createdDate: 1652967897732,
            readDate: null,
            message: 'Hello, http://localhost:8086!',
          },
          test2: {
            id: 'test2',
            origin: 'local:http://localhost:8086/',
            createdDate: 1652967897732,
            readDate: null,
            message: 'Hello, http://localhost:8086!',
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

    const { container } = render(mockStore);

    expect(
      container.getElementsByClassName('.notifications__item'),
    ).toHaveLength(2);
  });

  it('can render an empty list of notifications', () => {
    const mockStore = {
      metamask: {
        notifications: {},
        snaps: {},
      },
    };

    const { container } = render(mockStore);

    expect(container.getElementsByClassName('.empty')).toHaveLength(1);
  });
});
