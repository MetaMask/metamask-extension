import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MoneyActivityItem } from '../types/money-activity';
import { MoneyActivityRow } from './money-activity-row';
import { MoneyActivitySettlingSkeletons } from './money-activity-settling-skeletons';

export const MAX_PREVIEW_ITEMS = 5;

export type MoneyActivityListProps = {
  items: MoneyActivityItem[];
  privacyMode?: boolean;
  onViewAll?: () => void;
  onItemClick?: (item: MoneyActivityItem) => void;
  /** True when more Accounts API pages exist beyond the current preview. */
  hasMore?: boolean;
  /** True while the preview is still filling and should not show empty copy. */
  isSettling?: boolean;
};

export function MoneyActivityList({
  items,
  privacyMode = false,
  onViewAll,
  onItemClick,
  hasMore = false,
  isSettling = false,
}: MoneyActivityListProps) {
  const t = useI18nContext();
  const previewItems = items.slice(0, MAX_PREVIEW_ITEMS);
  const hasMoreItems = items.length > MAX_PREVIEW_ITEMS || hasMore;
  const showEmptyCopy = items.length === 0 && !isSettling;

  return (
    <section
      aria-labelledby="money-activity-heading"
      data-testid="money-activity-list"
    >
      <Box paddingLeft={4} paddingRight={4} paddingTop={3} paddingBottom={1}>
        <div id="money-activity-heading">
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
            {t('moneyActivity')}
          </Text>
        </div>
        {showEmptyCopy ? (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="mt-1"
          >
            {t('moneyActivityPlaceholderDescription')}
          </Text>
        ) : null}
      </Box>
      {isSettling && items.length === 0 ? (
        <MoneyActivitySettlingSkeletons />
      ) : (
        previewItems.map((item) => (
          <MoneyActivityRow
            key={item.id}
            item={item}
            privacyMode={privacyMode}
            onItemClick={onItemClick}
          />
        ))
      )}
      {hasMoreItems ? (
        <Box paddingLeft={4} paddingRight={4} paddingTop={3} paddingBottom={3}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onViewAll}
            className="w-full"
            data-testid="money-activity-view-all"
          >
            {t('moneyActivityViewAll')}
          </Button>
        </Box>
      ) : null}
    </section>
  );
}
