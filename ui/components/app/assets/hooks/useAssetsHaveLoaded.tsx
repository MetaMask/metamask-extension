import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSelector } from 'react-redux';
import { selectAssetsHaveLoadedForSelectedAccountGroup } from '../../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../../selectors/multichain-accounts/account-tree';

const AssetsHaveLoadedContext = createContext<boolean | undefined>(undefined);

const createSettledAccountGroupsStore = () => {
  const settledAccountGroups = new Set<string>();
  const listeners = new Set<() => void>();

  return {
    add(accountGroupId: string) {
      if (settledAccountGroups.has(accountGroupId)) {
        return;
      }

      settledAccountGroups.add(accountGroupId);
      listeners.forEach((listener) => listener());
    },
    has(accountGroupId: string | null | undefined) {
      return Boolean(
        accountGroupId && settledAccountGroups.has(accountGroupId),
      );
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
  const currentLoadHasSettled = useSelector(
    selectAssetsHaveLoadedForSelectedAccountGroup,
  );
  const [settledAccountGroups] = useState(createSettledAccountGroupsStore);
  const getSnapshot = useCallback(
    () => settledAccountGroups.has(selectedAccountGroup),
    [selectedAccountGroup, settledAccountGroups],
  );
  const selectedGroupHasSettled = useSyncExternalStore(
    settledAccountGroups.subscribe,
    getSnapshot,
    getSnapshot,
  );

  useEffect(() => {
    if (!selectedAccountGroup || !currentLoadHasSettled) {
      return;
    }

    settledAccountGroups.add(selectedAccountGroup);
  }, [currentLoadHasSettled, selectedAccountGroup, settledAccountGroups]);

  const assetsHaveLoaded = currentLoadHasSettled || selectedGroupHasSettled;

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
