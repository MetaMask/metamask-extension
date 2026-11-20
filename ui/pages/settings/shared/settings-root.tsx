import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  ContentVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { transitionForward } from '../../../components/ui/transition';
import { SETTINGS_ROOT_SECTIONS, SETTINGS_TABS } from '../settings-registry';

type RootListItem = {
  id: string;
  path: string;
  iconName: IconName;
  labelKey: string;
};

type SettingsRootProps = {
  /** Called before navigating. Return `true` to prevent navigation. */
  onBeforeNavigate?: (path: string) => boolean | void;
};

export const SettingsRoot = ({ onBeforeNavigate }: SettingsRootProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const groupedItems = useMemo(() => {
    const rootItems: RootListItem[] = SETTINGS_TABS.map((item) => ({
      id: item.id,
      path: item.path,
      iconName: item.iconName,
      labelKey: item.labelKey,
    }));

    return SETTINGS_ROOT_SECTIONS.map(({ titleKeys, paths }) => ({
      titleKeys,
      items: rootItems.filter((item) => paths.includes(item.path)),
    })).filter(({ items }) => items.length > 0);
  }, []);

  const handleSelectItem = (item: RootListItem) => {
    if (onBeforeNavigate?.(item.path) === true) {
      return;
    }
    transitionForward(() => navigate(item.path));
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="w-full h-full overflow-y-auto"
      data-testid="settings-root"
    >
      {groupedItems.map(({ titleKeys, items }, index) => {
        return (
          <Box
            key={titleKeys.join('-')}
            flexDirection={BoxFlexDirection.Column}
            className="w-full"
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="px-4 pt-3 pb-2"
            >
              {titleKeys.map((key) => t(key))}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} className="w-full">
              {items.map((item) => (
                <ListItem
                  key={item.id}
                  variant={ContentVariant.OneLine}
                  isInteractive
                  onClick={() => handleSelectItem(item)}
                  className="hover:bg-background-default-hover"
                  data-testid={`settings-root-item-${item.id}`}
                  accessoryGap={2}
                  startAccessory={
                    <Icon
                      name={item.iconName}
                      size={IconSize.Md}
                      color={IconColor.IconAlternative}
                    />
                  }
                  title={t(item.labelKey)}
                  endAccessory={
                    <Icon
                      name={IconName.ArrowRight}
                      size={IconSize.Sm}
                      color={IconColor.IconAlternative}
                    />
                  }
                />
              ))}
            </Box>
            {index === groupedItems.length - 1 ? null : (
              <Box className="w-full px-4 py-2">
                <div className="w-full border-t border-border-muted" />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
