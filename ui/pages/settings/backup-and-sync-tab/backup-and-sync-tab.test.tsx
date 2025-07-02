import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { backupAndSyncFeaturesTogglesTestIds } from '../../../components/app/identity/backup-and-sync-features-toggles/backup-and-sync-features-toggles';
import { backupAndSyncToggleTestIds } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import BackupAndSyncTab from './backup-and-sync-tab.component';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  const comp = <BackupAndSyncTab />;
  return renderWithProvider(
    <MetamaskIdentityProvider>{comp}</MetamaskIdentityProvider>,
    store,
  );
};

describe('BackupAndSyncTab', () => {
  it('renders BackupAndSyncTab component without error', () => {
    expect(() => {
      render();
    }).not.toThrow();
  });

  it('contains the main setting section', () => {
    const { getByTestId } = render();
    expect(
      getByTestId(backupAndSyncToggleTestIds.container),
    ).toBeInTheDocument();
  });

  it('contains the features toggles section', () => {
    const { getByTestId } = render();
    expect(
      getByTestId(backupAndSyncFeaturesTogglesTestIds.container),
    ).toBeInTheDocument();
  });
});
