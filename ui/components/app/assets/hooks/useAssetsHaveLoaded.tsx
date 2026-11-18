import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSelector } from 'react-redux';
import {
  selectAssetsHaveLoadedForSelectedAccountGroup,
  selectSelectedAccountGroupAccountIdsForLoading,
} from '../../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../../selectors/multichain-accounts/account-tree';

const AssetsHaveLoadedContext = createContext<boolean | undefined>(undefined);

const createSettledLoadsStore = () => {
  const settledLoads = new Set<string>();
  const listeners = new Set<() => void>();

  return {
    add(loadKey: string) {
      if (settledLoads.has(loadKey)) {
        return;
      }

      settledLoads.add(loadKey);
      listeners.forEach((listener) => listener());
    },
    has(loadKey: string | undefined) {
      return Boolean(loadKey && settledLoads.has(loadKey));
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const AssetsHaveLoadedProvider = ({
  children,
}: React.PropsWithChildren) => {
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const selectedAccountGroupAccountIds = useSelector(
    selectSelectedAccountGroupAccountIdsForLoading,
  );
  const currentLoadKey = useMemo(
    () =>
      selectedAccountGroup
        ? `${selectedAccountGroup}:${[...selectedAccountGroupAccountIds]
            .sort()
            .join(',')}`
        : undefined,
    [selectedAccountGroup, selectedAccountGroupAccountIds],
  );
  const currentLoadHasSettled = useSelector(
    selectAssetsHaveLoadedForSelectedAccountGroup,
  );
  const [settledLoads] = useState(createSettledLoadsStore);
  const getSnapshot = useCallback(
    () => settledLoads.has(currentLoadKey),
    [currentLoadKey, settledLoads],
  );
  const currentLoadPreviouslySettled = useSyncExternalStore(
    settledLoads.subscribe,
    getSnapshot,
    getSnapshot,
  );

  useEffect(() => {
    if (!currentLoadKey || !currentLoadHasSettled) {
      return;
    }

    settledLoads.add(currentLoadKey);
  }, [currentLoadHasSettled, currentLoadKey, settledLoads]);

  const assetsHaveLoaded =
    currentLoadHasSettled || currentLoadPreviouslySettled;

  return (
    <AssetsHaveLoadedContext.Provider value={assetsHaveLoaded}>
      {children}
    </AssetsHaveLoadedContext.Provider>
  );
};

export const useAssetsHaveLoaded = () => {
  const contextValue = useContext(AssetsHaveLoadedContext);
  const selectorValue = useSelector(
    selectAssetsHaveLoadedForSelectedAccountGroup,
  );

  return contextValue ?? selectorValue;
};
