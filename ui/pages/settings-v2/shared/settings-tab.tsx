import React from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { SettingItemConfig } from '../types';
import { Divider } from './divider';

type SettingsTabProps = {
  items: SettingItemConfig[];
  subHeader?: string;
};

export const SettingsTab = ({ items, subHeader }: SettingsTabProps) => {
  return (
    <Box paddingHorizontal={4} paddingBottom={4}>
      {subHeader && (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="py-2"
        >
          {subHeader}
        </Text>
      )}
      {items.map(({ id, component: Component, hasDividerBefore }) => (
        <React.Fragment key={id}>
          {hasDividerBefore && <Divider />}
          <Component />
        </React.Fragment>
      ))}
    </Box>
  );
};
