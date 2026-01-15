import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AccountOverviewTab } from '../../shared/constants/app-state';

/**
 * Manages active tab state via URL search params
 */
export function useTabState(defaultTab: AccountOverviewTab = 'tokens') {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  const activeTab = (tab as AccountOverviewTab) || defaultTab;

  const setActiveTab = useCallback(
    (tab: AccountOverviewTab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams],
  );

  return [activeTab, setActiveTab] as const;
}
