import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { SettingsV2SearchResult } from '../useSettingsV2Search';

const MAX_RESULTS = 5;

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
      className="settings-v2-search-results"
      padding={2}
      paddingLeft={4}
      paddingRight={4}
      data-testid="settings-v2-search-results"
    >
      {results.slice(0, MAX_RESULTS).map((item) => (
        <button
          key={`${item.tabRoute}-${item.titleKey}`}
          className="settings-v2-search-results__item"
          onClick={() => onClickResult(item)}
          data-testid="settings-v2-search-result-item"
          type="button"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
            padding={3}
          >
            <Icon name={item.iconName as IconName} size={IconSize.Sm} />
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t(item.tabLabelKey)}
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Xs}
              color={IconColor.IconAlternative}
            />
            <Text variant={TextVariant.BodySm}>{t(item.titleKey)}</Text>
          </Box>
        </button>
      ))}
      {results.length === 0 && (
        <Box padding={3}>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
          >
            {t('settingsSearchMatchingNotFound')}
          </Text>
        </Box>
      )}
    </Box>
  );
};
