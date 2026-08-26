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

export const MAX_PREVIEW_ITEMS = 5;

export type MoneyActivityListProps = {
  items: MoneyActivityItem[];
  privacyMode?: boolean;
};

export function MoneyActivityList({
  items,
  privacyMode = false,
}: MoneyActivityListProps) {
  const t = useI18nContext();
  const previewItems = items.slice(0, MAX_PREVIEW_ITEMS);
  const hasMoreItems = items.length > MAX_PREVIEW_ITEMS;

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
        {items.length === 0 ? (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="mt-1"
          >
            {t('moneyActivityPlaceholderDescription')}
          </Text>
        ) : null}
      </Box>
      {previewItems.map((item) => (
        <MoneyActivityRow key={item.id} item={item} privacyMode={privacyMode} />
      ))}
      {hasMoreItems ? (
        <Box paddingLeft={4} paddingRight={4} paddingTop={3} paddingBottom={3}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            disabled
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
