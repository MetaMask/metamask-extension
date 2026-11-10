import React from 'react';
import { OptionsMenu } from './options-menu';
import { RefreshItem } from './refresh-item';

type DeFiOptionsMenuProps = {
  onRefresh: () => void;
};

/**
 * DeFi tab options menu. Its only action refreshes the position list.
 *
 * @param props - The component props.
 * @param props.onRefresh - Called when Refresh list is chosen.
 */
export const DeFiOptionsMenu = ({ onRefresh }: DeFiOptionsMenuProps) => (
  <OptionsMenu>
    {(close) => (
      <RefreshItem
        onClick={() => {
          onRefresh();
          close();
        }}
      />
    )}
  </OptionsMenu>
);
