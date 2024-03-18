import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import SnapPermissionsList from './snap-permissions-list';

describe('Snap Permission List', () => {
  const mockPermissionData = {
    snap_dialog: {
      caveats: null,
      date: 1680709920602,
      id: '4dduR1BpsmS0ZJfeVtiAh',
      invoker: 'local:http://localhost:8080',
      parentCapability: 'snap_dialog',
    },
  };
  const mockTargetSubjectMetadata = {
    extensionId: null,
    iconUrl: null,
    name: 'TypeScript Example Snap',
    origin: 'local:http://localhost:8080',
    subjectType: 'snap',
    version: '0.2.2',
  };
  const mockState = {
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

  const store = configureStore(mockState);

  it('renders permissions list for snaps', () => {
    renderWithProvider(
      <SnapPermissionsList
        permissions={mockPermissionData}
        targetSubjectMetadata={mockTargetSubjectMetadata}
      />,
      store,
    );
    expect(
      screen.getByText('Display dialog windows in MetaMask.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Approved on 2023-04-05')).toBeInTheDocument();
  });
});
