import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { ConnectionPermissionsList } from './connection-permissions-list';

describe('ConnectionPermissionsList', () => {
  const renderComponent = () => {
    return renderWithLocalization(<ConnectionPermissionsList />);
  };

  it('renders the permissions header', () => {
    renderComponent();
    expect(screen.getByText(messages.permissions.message)).toBeInTheDocument();
  });

  it('renders see addresses permission item', () => {
    renderComponent();
    expect(
      screen.getByText(messages.permissionSeeAddresses.message),
    ).toBeInTheDocument();
  });

  it('renders send requests permission item', () => {
    renderComponent();
    expect(
      screen.getByText(messages.permissionSendRequests.message),
    ).toBeInTheDocument();
  });

  it('renders cannot move funds permission item', () => {
    renderComponent();
    expect(
      screen.getByText(messages.permissionCannotMoveFunds.message),
    ).toBeInTheDocument();
  });
});
