import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithProvider } from '../../../../../test/jest';
import SnapPermissionCellDisplay from './snap-permission-cell-display';

describe('Snap Permission List', () => {
  const mockSnapId = 'mock-snap-id';
  const mockPermissionConnection = 'https://snaps.metamask.io';
  const mockIndex = 1;

  const mockPermissionData = {
    permissionName: 'snap_dialog',
    label: 'Display dialog windows in MetaMask.',
    leftIcon: 'messages',
  };
  const mockConnectionData = {
    permissionName: 'connection_permission',
    label: 'Connect to snaps.metamask.io',
    connection: mockPermissionConnection,
  };
  const mockTargetSubjectMetadata = {
    extensionId: null,
    iconUrl: null,
    name: 'TypeScript Example Snap',
    origin: 'local:http://localhost:8080',
    subjectType: 'snap',
    version: '0.2.2',
  };
  const mockTargetSubjectsMetadata = {
    [mockSnapId]: mockTargetSubjectMetadata,
    [mockPermissionConnection]: {
      iconUrl: null,
      name: 'TypeScript Example Snap',
      origin: 'https://snaps.metamask.io',
      subjectType: 'website',
    },
  };

  it('renders permissions cell with permission', () => {
    renderWithProvider(
      <SnapPermissionCellDisplay
        snapId={mockSnapId}
        showOptions={false}
        permission={mockPermissionData}
        index={mockIndex}
        key={`permissionCellDisplay_${mockSnapId}_${mockIndex}`}
      />,
    );
    expect(
      screen.getByText('Display dialog windows in MetaMask.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Requested now')).toBeInTheDocument();
  });

  it('renders permissions cell with connection', () => {
    renderWithProvider(
      <SnapPermissionCellDisplay
        snapId={mockSnapId}
        showOptions={false}
        subjectMetadata={
          mockTargetSubjectsMetadata[mockConnectionData.connection]
        }
        permission={mockConnectionData}
        index={mockIndex}
        key={`permissionCellDisplay_${mockSnapId}_${mockIndex}`}
      />,
    );
    expect(
      screen.getByText('Connect to snaps.metamask.io'),
    ).toBeInTheDocument();
    expect(screen.getByText('Requested now')).toBeInTheDocument();
  });
});
