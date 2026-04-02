import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  SETTINGS_V2_ROOT_SECTIONS,
  SETTINGS_V2_TABS,
} from '../settings-registry';

type RootListItem = {
  id: string;
  path: string;
  iconName: IconName;
  labelKey: string;
};

type SettingsV2RootProps = {
  /** Called before navigating. Return `true` to prevent navigation. */
  onBeforeNavigate?: (path: string) => boolean | void;
};

export const SettingsV2Root = ({ onBeforeNavigate }: SettingsV2RootProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const groupedItems = useMemo(() => {
    const rootItems: RootListItem[] = SETTINGS_V2_TABS.map((item) => ({
      id: item.id,
      path: item.path,
      iconName: item.iconName,
      labelKey: item.labelKey,
    }));

    return SETTINGS_V2_ROOT_SECTIONS.map(({ titleKeys, paths }) => ({
      titleKeys,
      items: rootItems.filter((item) => paths.includes(item.path)),
    })).filter(({ items }) => items.length > 0);
  }, []);

  const handleSelectItem = (item: RootListItem) => {
    if (onBeforeNavigate?.(item.path) === true) {
      return;
    }
    navigate(item.path);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="w-full h-full overflow-y-auto"
      data-testid="settings-v2-root"
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
                <button
                  key={item.id}
                  type="button"
                  className="w-full border-0 bg-transparent p-0 text-left text-inherit cursor-pointer hover:bg-background-default-hover"
                  onClick={() => handleSelectItem(item)}
                  data-testid={`settings-v2-root-item-${item.id}`}
                >
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    className="w-full gap-2 px-4 py-3"
                  >
                    <Icon
                      name={item.iconName}
                      size={IconSize.Md}
                      color={IconColor.IconAlternative}
                    />
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                      className="flex-1 min-w-0 text-left"
                    >
                      {t(item.labelKey)}
                    </Text>
                    <Icon
                      name={IconName.ArrowRight}
                      size={IconSize.Sm}
                      color={IconColor.IconAlternative}
                    />
                  </Box>
                </button>
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
