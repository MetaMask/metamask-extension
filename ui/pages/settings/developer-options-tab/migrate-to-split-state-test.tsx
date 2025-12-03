import { Text } from '@metamask/design-system-react';
import TextField from '../../../components/ui/text-field';
import browser from 'webextension-polyfill';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { migrateToSplitState } from '../../../store/actions';

const MigrateToSplitStateTest = () => {
  const dispatch = useDispatch();

  const [enabled, setEnabled] = useState<string | null>(null);
  const [maxAccounts, setMaxAccounts] = useState<string>('');
  const [maxNetworks, setMaxNetworks] = useState<string>('');
  const [storageKind, setStorageKind] = useState<string>('unknown');

  const toEnabledString = (value: unknown): string | null => {
    if (value === undefined || value === null) {
      return null;
    }

    const stringValue = String(value);
    if (stringValue === 'false') {
      return '0';
    }
    if (stringValue === 'true') {
      return '1';
    }
    return stringValue;
  };

  useEffect(() => {
    let isMounted = true;

    const loadFromStorage = async () => {
      const {
        splitStateMigrationEnabled,
        splitStateMigrationMaxAccounts,
        splitStateMigrationMaxNetworks,
        meta,
      } = await browser.storage.local.get([
        'splitStateMigrationEnabled',
        'splitStateMigrationMaxAccounts',
        'splitStateMigrationMaxNetworks',
        'meta',
      ]);

      if (!isMounted) {
        return;
      }

      setEnabled(toEnabledString(splitStateMigrationEnabled));
      setStorageKind(
        typeof meta?.storageKind === 'string' ? meta.storageKind : 'unknown',
      );
      setMaxAccounts(
        splitStateMigrationMaxAccounts === undefined
          ? ''
          : String(splitStateMigrationMaxAccounts),
      );
      setMaxNetworks(
        splitStateMigrationMaxNetworks === undefined
          ? ''
          : String(splitStateMigrationMaxNetworks),
      );
    };

    const handleStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') {
        return;
      }

      if (changes.splitStateMigrationEnabled) {
        const newValue = changes.splitStateMigrationEnabled.newValue;
        setEnabled(toEnabledString(newValue));
      }

      if (changes.meta) {
        const newValue = changes.meta.newValue as
          | { storageKind?: string }
          | undefined;
        setStorageKind(
          typeof newValue?.storageKind === 'string'
            ? newValue.storageKind
            : 'unknown',
        );
      }

      if (changes.splitStateMigrationMaxAccounts) {
        const newValue = changes.splitStateMigrationMaxAccounts.newValue;
        setMaxAccounts(newValue === undefined ? '' : String(newValue));
      }

      if (changes.splitStateMigrationMaxNetworks) {
        const newValue = changes.splitStateMigrationMaxNetworks.newValue;
        setMaxNetworks(newValue === undefined ? '' : String(newValue));
      }
    };

    void loadFromStorage();
    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      isMounted = false;
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleEnabledChange = async (value: string | null) => {
    setEnabled(value);
    if (value === null) {
      await browser.storage.local.remove('splitStateMigrationEnabled');
    } else {
      await browser.storage.local.set({
        splitStateMigrationEnabled: value,
      });
    }
  };

  const handleMaxAccountsChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setMaxAccounts(value);
    if (value === '') {
      await browser.storage.local.remove('splitStateMigrationMaxAccounts');
    } else {
      await browser.storage.local.set({
        splitStateMigrationMaxAccounts: value,
      });
    }
  };

  const handleMaxNetworksChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setMaxNetworks(value);
    if (value === '') {
      await browser.storage.local.remove('splitStateMigrationMaxNetworks');
    } else {
      await browser.storage.local.set({
        splitStateMigrationMaxNetworks: value,
      });
    }
  };

  const handleMigrate = async () => {
    if (
      // eslint-disable-next-line no-alert
      confirm(
        "Are you sure you want to migrate to split state? You can't undo this action.",
      )
    ) {
      await dispatch(migrateToSplitState());
    }
  };
  return (
    <div>
      <Text>Split State Migration</Text>
      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
        <strong>Current storage kind: {storageKind}</strong>
      </div>
      <hr></hr>
      <button
        className="button btn-primary"
        style={{ marginTop: '16px' }}
        onClick={handleMigrate}
      >
        Migrate to Split State
      </button>
      <hr />
      <h2>Split State Migration Flags</h2>
      <label>
        <span>Migration Enabled flag:</span>
        <div>
          <label>
            <input
              type="radio"
              name="split-state-migration-enabled"
              checked={enabled === null}
              onChange={() => handleEnabledChange(null)}
            />
            Unset (uses remote feature flags)
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="split-state-migration-enabled"
              checked={enabled === '0'}
              onChange={() => handleEnabledChange('0')}
            />
            0 (Off)
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="split-state-migration-enabled"
              checked={enabled === '1'}
              onChange={() => handleEnabledChange('1')}
            />
            1 (On)
          </label>
        </div>
      </label>
      <div>
        <label>
          <span>Max Accounts flag:</span>
          <TextField
            min="0"
            max="99999999"
            type="number"
            value={maxAccounts}
            onChange={handleMaxAccountsChange}
          />
        </label>
      </div>
      <div>
        <label>
          <span>Max Networks flag:</span>
          <TextField
            min="0"
            max="99999999"
            type="number"
            value={maxNetworks}
            onChange={handleMaxNetworksChange}
          />
        </label>
      </div>
    </div>
  );
};

export default MigrateToSplitStateTest;
