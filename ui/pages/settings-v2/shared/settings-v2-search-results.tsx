import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { REQUEST_SETTING_URL } from '../../../../shared/lib/ui-utils';
import type { SettingsV2SearchResult } from '../useSettingsV2Search';
import { Divider } from './divider';

type SettingsV2SearchResultsProps = {
  results: SettingsV2SearchResult[];
  onClickResult: (item: SettingsV2SearchResult) => void;
};

export const SettingsV2SearchResults = ({
  results,
  onClickResult,
}: SettingsV2SearchResultsProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex-1 overflow-y-auto"
      data-testid="settings-v2-search-results"
    >
      {results.map((item) => (
        <button
          key={`${item.tabRoute}-${item.titleKey}`}
          className="border-none bg-transparent w-full text-left hover:bg-background-default-hover"
          onClick={() => onClickResult(item)}
          data-testid="settings-v2-search-result-item"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            padding={4}
            gap={3}
          >
            <Icon
              name={item.iconName as IconName}
              size={IconSize.Lg}
              color={IconColor.IconAlternative}
            />
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              className="flex-1 min-w-0"
            >
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {item.parentTabLabelKey
                  ? `${t(item.parentTabLabelKey)} > ${t(item.tabLabelKey)} > ${t(item.titleKey)}`
                  : `${t(item.tabLabelKey)} > ${t(item.titleKey)}`}
              </Text>
            </Box>
          </Box>
        </button>
      ))}
      {results.length === 0 && (
        <Box flexDirection={BoxFlexDirection.Column} padding={4}>
          <Box className="pt-3 pb-3">
            <Text variant={TextVariant.BodyMd}>
              {t('settingsSearchMatchingNotFound')}
            </Text>
          </Box>
          <Divider />
          <Box className="pt-3 pb-3">
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('settingsSearchCantFindSetting', [
                <a
                  key="request-link"
                  href={REQUEST_SETTING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-default no-underline hover:underline"
                >
                  {t('settingsSearchRequestHere')}
                </a>,
              ])}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
