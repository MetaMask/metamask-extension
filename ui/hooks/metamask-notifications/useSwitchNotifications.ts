import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-api';
import {
  setSnapNotificationsEnabled,
  setFeatureAnnouncementsEnabled,
  checkAccountsPresence,
  deleteOnChainTriggersByAccount,
  updateOnChainTriggersByAccount,
} from '../../store/actions';
import {
  selectIsSnapNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { getInternalAccounts } from '../../selectors';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';

// Define KeyringType interface
type KeyringType = {
  type: string;
};

// Define AccountType interface
type AccountType = InternalAccount & {
  balance: string;
  keyring: KeyringType;
  label: string;
};

export function useSwitchSnapNotifications(): {
  data: boolean;
} {
  const isSnapNotificationsEnabled = useSelector(
    selectIsSnapNotificationsEnabled,
  );

  return {
    data: isSnapNotificationsEnabled,
  };
}

export function useSwitchSnapNotificationsChange(): {
  onChange: (state: boolean) => Promise<void>;
  isLoading: boolean;
  error: unknown;
} {
  const dispatch = useDispatch();

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const onChange = useCallback(
    async (state: boolean) => {
      setLoading(true);
      setError(null);

      try {
        await dispatch(setSnapNotificationsEnabled(state));
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
      setLoading(false);
    },
    [dispatch],
  );

  return {
    onChange,
    isLoading,
    error,
  };
}

export function useSwitchFeatureAnnouncements(): {
  data: boolean;
} {
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );

  return {
    data: isFeatureAnnouncementsEnabled,
  };
}

export function useSwitchFeatureAnnouncementsChange(): {
  onChange: (state: boolean) => Promise<void>;
  isLoading: boolean;
  error: unknown;
} {
  const dispatch = useDispatch();

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const onChange = useCallback(
    async (state: boolean) => {
      setLoading(true);
      setError(null);

      try {
        await dispatch(setFeatureAnnouncementsEnabled(state));
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
      setLoading(false);
    },
    [dispatch],
  );

  return {
    onChange,
    isLoading,
    error,
  };
}

export function useSwitchAccountNotifications(): {
  data: (addresses: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();
  const accounts: AccountType[] = useSelector(getInternalAccounts);
  const checksumAddresses = accounts.map((account: AccountType) =>
    toChecksumHexAddress(account.address),
  );

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useCallback(
    async (addresses: string[]) => {
      setLoading(true);
      try {
        await dispatch(checkAccountsPresence(addresses));
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
      setLoading(false);
    },
    [checksumAddresses, dispatch], // Ensure dependencies are correctly listed
  );

  return {
    data,
    isLoading,
    error,
  };
}

export function useSwitchAccountNotificationsChange(): {
  onChange: (address: string, state: boolean) => Promise<void>;
  isLoading: boolean;
  error: unknown;
} {
  const dispatch = useDispatch();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const onChange = useCallback(
    async (address: string, state: boolean) => {
      setLoading(true);
      try {
        if (state) {
          await dispatch(updateOnChainTriggersByAccount([address]));
        } else {
          await dispatch(deleteOnChainTriggersByAccount([address]));
        }
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
      setLoading(false);
    },
    [dispatch],
  );

  return {
    onChange,
    isLoading,
    error,
  };
}
