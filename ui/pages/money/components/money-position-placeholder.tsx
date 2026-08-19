import React from 'react';
import {
  FontWeight,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const POSITION_ROWS = [
  { key: 'monthly', labelKey: 'monthly' },
  { key: 'lifetime', labelKey: 'moneyLifetime' },
] as const;

export function MoneyPositionPlaceholder() {
  const t = useI18nContext();

  return (
    <section
      className="px-4 py-3"
      aria-labelledby="money-position-heading"
      data-testid="money-position-placeholder"
    >
      <div id="money-position-heading">
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('moneyEarnings')}
        </Text>
      </div>
      <div className="mt-3 flex flex-col gap-4">
        {POSITION_ROWS.map(({ key, labelKey }) => (
          <div
            key={key}
            className="flex min-h-6 items-center justify-between gap-4"
            data-testid={`money-position-${key}`}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="border-b border-dotted border-border-default"
            >
              {t(labelKey)}
            </Text>
            <Skeleton
              className="h-6 w-20"
              data-testid={`money-position-${key}-skeleton`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
