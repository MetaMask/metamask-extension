import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import ConnectedAccountsPermissions from './connected-accounts-permissions';

jest.mock('../../../helpers/utils/permission', () => ({
  getPermissionDescription: jest.fn(
    ({ permissionName }: { permissionName: string }) => [
      { label: `Permission: ${permissionName}` },
    ],
  ),
}));

describe('ConnectedAccountsPermissions', () => {
  const mockStore = configureMockStore()(mockState);
  const permissionsListTestId = 'connected-accounts-permissions-list';

  it('renders nothing when permissions is empty', () => {
    const { container } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={[]} />,
      mockStore,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when permissions prop is not provided', () => {
    const { container } = renderWithProvider(
      <ConnectedAccountsPermissions />,
      mockStore,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the permissions header when permissions are provided', () => {
    const permissions = [{ key: 'eth_accounts', value: {} }];
    const { getByText } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={permissions} />,
      mockStore,
    );
    expect(getByText(messages.permissions.message)).toBeInTheDocument();
  });

  it('does not show permission list when collapsed (default state)', () => {
    const permissions = [{ key: 'eth_accounts', value: {} }];
    const { queryByTestId } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={permissions} />,
      mockStore,
    );
    expect(queryByTestId(permissionsListTestId)).not.toBeInTheDocument();
  });

  it('shows permission list when expanded', () => {
    const permissions = [{ key: 'eth_accounts', value: {} }];
    const { getByText, getByTestId } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={permissions} />,
      mockStore,
    );

    const header = getByText(messages.permissions.message).closest('button');
    fireEvent.click(header as HTMLElement);

    expect(getByTestId(permissionsListTestId)).toBeInTheDocument();
  });

  it('shows permission labels when expanded', () => {
    const permissions = [{ key: 'eth_accounts', value: {} }];
    const { getByText } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={permissions} />,
      mockStore,
    );

    const header = getByText(messages.permissions.message).closest('button');
    fireEvent.click(header as HTMLElement);

    expect(getByText('Permission: eth_accounts')).toBeInTheDocument();
  });

  it('collapses the permission list when clicked again', () => {
    const permissions = [{ key: 'eth_accounts', value: {} }];
    const { getByText, getByTestId, queryByTestId } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={permissions} />,
      mockStore,
    );

    const header = getByText(messages.permissions.message).closest('button');
    fireEvent.click(header as HTMLElement);
    expect(getByTestId(permissionsListTestId)).toBeInTheDocument();

    fireEvent.click(header as HTMLElement);
    expect(queryByTestId(permissionsListTestId)).not.toBeInTheDocument();
  });

  it('renders multiple permissions when expanded', () => {
    const permissions = [
      { key: 'eth_accounts', value: {} },
      { key: 'snap_getBip44Entropy', value: {} },
    ];
    const { getByText } = renderWithProvider(
      <ConnectedAccountsPermissions permissions={permissions} />,
      mockStore,
    );

    const header = getByText(messages.permissions.message).closest('button');
    fireEvent.click(header as HTMLElement);

    expect(getByText('Permission: eth_accounts')).toBeInTheDocument();
    expect(getByText('Permission: snap_getBip44Entropy')).toBeInTheDocument();
  });
});
