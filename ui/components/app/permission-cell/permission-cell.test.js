import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import PermissionCell from './permission-cell';

describe('Permission Cell', () => {
  const mockPermissionData = {
    label: messages.permission_ethereumProvider.message,
    description:
      'Allow the snap to communicate with MetaMask direct…blockchain and suggest messages and transactions.',
    weight: 1,
    leftIcon: 'ethereum',
    permissionValue: {
      date: 1680185432326,
    },
    permissionName: 'ethereum-provider',
  };
  const mockStore = configureMockStore([thunk])(mockState);

  it('renders approved permission cell', () => {
    renderWithProvider(
      <PermissionCell
        permissionName={mockPermissionData.permissionName}
        title={mockPermissionData.label}
        description={mockPermissionData.description}
        weight={mockPermissionData.weight}
        avatarIcon={mockPermissionData.leftIcon}
        dateApproved={mockPermissionData?.permissionValue?.date}
        key={`${mockPermissionData.permissionName}-${1}`}
      />,
      mockStore,
    );
    expect(
      screen.getByText(messages.permission_ethereumProvider.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Approved on 2023-03-30')).toBeInTheDocument();
  });

  it('renders revoked permission cell', () => {
    renderWithProvider(
      <PermissionCell
        permissionName={mockPermissionData.permissionName}
        title={mockPermissionData.label}
        description={mockPermissionData.description}
        weight={mockPermissionData.weight}
        avatarIcon={mockPermissionData.leftIcon}
        dateApproved={mockPermissionData?.permissionValue?.date}
        key={`${mockPermissionData.permissionName}-${1}`}
        revoked
      />,
      mockStore,
    );
    expect(
      screen.getByText(messages.permission_ethereumProvider.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.permissionRevoked.message),
    ).toBeInTheDocument();
  });

  it('renders requested permission cell', () => {
    renderWithProvider(
      <PermissionCell
        permissionName={mockPermissionData.permissionName}
        title={mockPermissionData.label}
        description={mockPermissionData.description}
        weight={mockPermissionData.weight}
        avatarIcon={mockPermissionData.leftIcon}
        key={`${mockPermissionData.permissionName}-${1}`}
      />,
      mockStore,
    );
    expect(
      screen.getByText(messages.permission_ethereumProvider.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.permissionRequested.message),
    ).toBeInTheDocument();
  });
});
