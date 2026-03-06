import React from 'react';
import { Box } from '@metamask/design-system-react';
import { SettingItemConfig } from '../types';
import { Divider } from './divider';

export const SettingsTab = ({ items }: { items: SettingItemConfig[] }) => {
  return (
    <Box paddingHorizontal={4} paddingBottom={4}>
      {items.map(({ id, component: Component, hasDividerBefore }) => (
        <React.Fragment key={id}>
          {hasDividerBefore && <Divider />}
          <Component />
        </React.Fragment>
      ))}
    </Box>
  );
};
