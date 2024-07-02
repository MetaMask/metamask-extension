import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import { PermissionWeightThreshold } from '../../../../../shared/constants/permissions';
import SnapPermissionAdapter from './snap-permission-adapter';

describe('Snap Permission List', () => {
  const mockSnapId = 'mock-snap-id';
  const mockSnapName = 'Snap Name';
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
  const mockWeightedPermissions = [
    {
      leftIcon: 'hierarchy',
      weight: 3,
      label: 'Allow websites to communicate directly with Dialog Example Snap.',
      description: {},
      permissionName: 'endowment:rpc',
      permissionValue: {
        caveats: [
          {
            type: 'rpcOrigin',
            value: {
              dapps: true,
            },
          },
        ],
      },
    },
    {
      label: 'Display dialog windows in MetaMask.',
      description: {},
      leftIcon: 'messages',
      weight: 4,
      permissionName: 'snap_dialog',
      permissionValue: {},
    },
  ];

  const store = configureStore(mockState);

  it('renders only permissions with weight less than or equal to 3', () => {
    renderWithProvider(
      <SnapPermissionAdapter
        snapId={mockSnapId}
        snapName={mockSnapName}
        permissions={mockWeightedPermissions}
        targetSubjectsMetadata={{ ...mockTargetSubjectMetadata }}
        weightThreshold={PermissionWeightThreshold.snapInstall}
      />,
      store,
    );
    expect(
      screen.queryByText('Display dialog windows in MetaMask.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Allow websites to communicate directly with Dialog Example Snap.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Requested now')).toBeInTheDocument();
  });
});
