import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { backupAndSyncFeaturesTogglesTestIds } from '../../../components/app/identity/backup-and-sync-features-toggles/backup-and-sync-features-toggles';
import { backupAndSyncToggleTestIds } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import BackupAndSyncTab from './backup-and-sync-tab';

const defaultState = {
  metamask: {
    ...mockState.metamask,
  },
};

type StateOverrides = {
  metamask?: Record<string, unknown>;
};

const render = (stateOverrides: StateOverrides = {}) => {
  const store = configureStore({
    ...defaultState,
    ...stateOverrides,
    metamask: {
      ...defaultState.metamask,
      ...(stateOverrides.metamask ?? {}),
    },
  });
  const comp = <BackupAndSyncTab />;
  return renderWithProvider(
    <MetamaskIdentityProvider>{comp}</MetamaskIdentityProvider>,
    store,
  );
};

describe('BackupAndSyncTab', () => {
  it('renders without error', () => {
    expect(() => {
      render();
    }).not.toThrow();
  });

  it('renders the main backup and sync toggle section', () => {
    const { getByTestId } = render();
    expect(
      getByTestId(backupAndSyncToggleTestIds.container),
    ).toBeInTheDocument();
  });

  it('renders the features toggles section when backup and sync is enabled', () => {
    const { getByTestId } = render({
      metamask: { isBackupAndSyncEnabled: true },
    });
    expect(
      getByTestId(backupAndSyncFeaturesTogglesTestIds.container),
    ).toBeInTheDocument();
  });

  it('does not render the features toggles section when backup and sync is disabled', () => {
    const { queryByTestId } = render({
      metamask: { isBackupAndSyncEnabled: false },
    });
    expect(
      queryByTestId(backupAndSyncFeaturesTogglesTestIds.container),
    ).not.toBeInTheDocument();
  });

  it('renders layout with settings-page__body class', () => {
    const { container } = render();
    const body = container.querySelector('.settings-page__body');
    expect(body).toBeInTheDocument();
  });
});
