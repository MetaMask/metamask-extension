import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  getMultichainAccountGroupById,
  getSelectedAccountGroup,
} from '../selectors/multichain-accounts/account-tree';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';

import { HOME_SHELL_SNAPSHOT_KEY } from '../../shared/constants/home-shell';

/**
 * Shape read by `app/scripts/load/home-shell.js`, which cannot import this
 * file. Keep the two in sync.
 */

export type HomeShellSnapshot = {
  version: 1;
  accountName: string;
  // null while privacy mode is on, so the shell never reveals the balance.
  balance: string | null;
  theme: string | null;
};

/**
 * Saves what the home shell needs to paint the next load early. Only writes
 * while the wallet is unlocked; the background removes the snapshot on lock.
 *
 * @param options - The values to save.
 * @param options.balance - The formatted total balance, if known.
 * @param options.privacyMode - Whether the balance is currently hidden.
 */
export function useHomeShellSnapshot({
  balance,
  privacyMode,
}: {
  balance: string | null;
  privacyMode: boolean;
}) {
  const isUnlocked = useSelector(getIsUnlocked);
  const groupId = useSelector(getSelectedAccountGroup);
  const accountName = useSelector(
    (state) => getMultichainAccountGroupById(state, groupId)?.metadata.name,
  );

  useEffect(() => {
    if (!isUnlocked || !accountName || (balance === null && !privacyMode)) {
      return;
    }
    const snapshot: HomeShellSnapshot = {
      version: 1,
      accountName,
      balance: privacyMode ? null : balance,
      theme: document.documentElement.getAttribute('data-theme'),
    };
    browser.storage?.session
      ?.set({ [HOME_SHELL_SNAPSHOT_KEY]: snapshot })
      .catch(() => undefined);
  }, [isUnlocked, accountName, balance, privacyMode]);
}
