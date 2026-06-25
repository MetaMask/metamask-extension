import React from 'react';
import { render, screen } from '@testing-library/react';
import SyncAccountsTab from './sync-accounts-tab';

jest.mock('./sync-accounts-settings', () => () => (
  <div data-testid="sync-accounts-settings" />
));

describe('SyncAccountsTab', () => {
  it('renders without throwing', () => {
    expect(() => render(<SyncAccountsTab />)).not.toThrow();
  });

  it('renders the sync accounts settings', () => {
    render(<SyncAccountsTab />);

    expect(screen.getByTestId('sync-accounts-settings')).toBeInTheDocument();
  });
});
