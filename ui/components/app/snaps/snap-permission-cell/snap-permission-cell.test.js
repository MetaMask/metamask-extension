import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/jest';
import mockState from '../../../../../test/data/mock-state.json';
import SnapPermissionCell from './snap-permission-cell';

describe('Snap Permission Cell', () => {
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
  const mockStore = configureMockStore([thunk])(mockState);

  it('renders permissions cell with permission', () => {
    renderWithProvider(
      <SnapPermissionCell
        snapId={mockSnapId}
        showOptions={false}
        permission={mockPermissionData}
        index={mockIndex}
        key={`permissionCellDisplay_${mockSnapId}_${mockIndex}`}
      />,
      mockStore,
    );
    expect(
      screen.getByText('Display dialog windows in MetaMask.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Requested now')).toBeInTheDocument();
  });

  it('renders permissions cell with connection', () => {
    renderWithProvider(
      <SnapPermissionCell
        snapId={mockSnapId}
        showOptions={false}
        connectionSubjectMetadata={
          mockTargetSubjectsMetadata[mockConnectionData.connection]
        }
        permission={mockConnectionData}
        index={mockIndex}
        key={`permissionCellDisplay_${mockSnapId}_${mockIndex}`}
      />,
      mockStore,
    );
    expect(
      screen.getByText('Connect to snaps.metamask.io'),
    ).toBeInTheDocument();
    expect(screen.getByText('Requested now')).toBeInTheDocument();
  });
});
