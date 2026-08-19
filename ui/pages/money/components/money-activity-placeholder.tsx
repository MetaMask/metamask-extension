import React from 'react';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const PLACEHOLDER_ROW_COUNT = 3;

export function MoneyActivityPlaceholder() {
  const t = useI18nContext();

  return (
    <section
      className="px-4 py-3"
      aria-labelledby="money-activity-heading"
      data-testid="money-activity-placeholder"
    >
      <div id="money-activity-heading">
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('moneyActivity')}
        </Text>
      </div>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        className="mt-1"
      >
        {t('moneyActivityPlaceholderDescription')}
      </Text>
      <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
          <div
            key={`money-activity-placeholder-${index}`}
            className="flex items-center gap-3 rounded-xl bg-background-muted px-3 py-3"
            data-testid="money-activity-placeholder-row"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-background-alternative" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-3 w-28 rounded bg-background-alternative" />
              <div className="h-2 w-20 rounded bg-background-alternative" />
            </div>
            <div className="h-3 w-16 rounded bg-background-alternative" />
          </div>
        ))}
      </div>
    </section>
  );
}
