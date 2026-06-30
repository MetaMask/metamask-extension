import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import SyncAccountsTab from './sync-accounts-tab';

jest.mock('./sync-accounts-settings', () => () => (
  <div data-testid="sync-accounts-settings" />
));

const renderTab = () => renderWithProvider(<SyncAccountsTab />);

describe('SyncAccountsTab', () => {
  it('renders without throwing', () => {
    expect(() => renderTab()).not.toThrow();
  });

  it('renders the sync accounts settings', () => {
    renderTab();

    expect(screen.getByTestId('sync-accounts-settings')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    renderTab();

    expect(screen.getByTestId('sync-accounts-back-button')).toBeInTheDocument();
  });
});
