import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
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

  it('renders permissions list for snaps', () => {
    renderWithProvider(
      <SnapPermissionsList
        permissions={mockPermissionData}
        targetSubjectMetadata={mockTargetSubjectMetadata}
      />,
    );
    expect(
      screen.getByText('Display dialog windows in MetaMask.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Approved on 2023-04-05')).toBeInTheDocument();
  });
});
