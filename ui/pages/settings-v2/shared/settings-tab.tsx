import React from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { SettingItemConfig } from '../types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Divider } from './divider';

type SettingsTabProps = {
  items: SettingItemConfig[];
  subHeaderKey?: string;
};

export const SettingsTab = ({ items, subHeaderKey }: SettingsTabProps) => {
  const t = useI18nContext();
  return (
    <Box paddingHorizontal={4} paddingBottom={4}>
      {subHeaderKey && (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="py-2"
        >
          {t(subHeaderKey)}
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
