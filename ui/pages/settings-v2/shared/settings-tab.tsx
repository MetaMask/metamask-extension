import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { handleSettingsRefs } from '../../../helpers/utils/settings-search';
import { SettingItemConfig } from '../types';
import { Divider } from './divider';

type SettingsTabProps = {
  items: SettingItemConfig[];
  subHeader?: string;
  /** Tab message key for settings search (e.g., 'developerOptions'). If provided, handles scroll-to-setting automatically. */
  tabMessageKey?: string;
};

export const SettingsTab = ({
  items,
  subHeader,
  tabMessageKey,
}: SettingsTabProps) => {
  const t = useI18nContext();
  const { hash } = useLocation();

  const itemCount = items.length;
  const settingsRefs = useMemo(
    () =>
      Array.from({ length: itemCount }, () =>
        React.createRef<HTMLDivElement>(),
      ),
    [itemCount],
  );

  useEffect(() => {
    if (tabMessageKey) {
      handleSettingsRefs(t, t(tabMessageKey), settingsRefs);
    }
  }, [t, tabMessageKey, settingsRefs]);

  useEffect(() => {
    if (!hash) {
      return;
    }
    const targetId = hash.slice(1);
    const index = items.findIndex((item) => item.id === targetId);
    if (index !== -1) {
      settingsRefs[index]?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [hash, items, settingsRefs]);

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
      {items.map(({ id, component: Component, hasDividerBefore }, index) => (
        <React.Fragment key={id}>
          {hasDividerBefore && <Divider />}
          <div ref={settingsRefs[index]}>
            <Component />
          </div>
        </React.Fragment>
      ))}
    </Box>
  );
};
