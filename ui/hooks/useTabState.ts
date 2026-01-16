import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AccountOverviewTab } from '../../shared/constants/app-state';

export function useTabState<TTab extends string = AccountOverviewTab>() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') as TTab;

  const setTab = useCallback(
    (value: TTab) => setSearchParams({ tab: value }),
    [setSearchParams],
  );

  return [tab, setTab] as const;
}
