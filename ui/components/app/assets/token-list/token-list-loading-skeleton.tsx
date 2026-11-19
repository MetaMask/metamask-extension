import React from 'react';
import { Box, Skeleton } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ASSET_CELL_HEIGHT } from '../constants';

export const TOKEN_LIST_LOADING_ROW_COUNT = 5;

const loadingRowKeys = Array.from(
  { length: TOKEN_LIST_LOADING_ROW_COUNT },
  (_, index) => `token-list-loading-row-${index + 1}`,
);

/**
 * Placeholder rows shown while the selected account group's assets are still
 * loading. Replaces the native gas token and mUSD rows that would otherwise
 * render before the rest of the list is ready.
 */
export const TokenListLoadingSkeleton = () => {
  const t = useI18nContext();

  return (
    <Box aria-busy="true" data-testid="token-list-loading">
      <span className="sr-only">{t('loading')}</span>
      {loadingRowKeys.map((rowKey) => (
        <Box
          key={rowKey}
          className="flex items-center gap-4 px-4"
          style={{ height: ASSET_CELL_HEIGHT }}
          data-testid="token-list-loading-row"
        >
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Box className="flex min-w-0 flex-1 flex-col gap-2">
            <Box className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </Box>
            <Box className="flex items-center justify-between gap-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
