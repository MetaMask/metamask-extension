import React from 'react';
import {
  FontWeight,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TooltipText } from '../../../components/app/money/tooltip-text'
import { PopoverPosition } from '../../../components/component-library';

const POSITION_ROWS = [
  { key: 'monthly', labelKey: 'monthly', tooltipText: 'moneyMonthlyTooltipText' },
  { key: 'lifetime', labelKey: 'moneyLifetime', tooltipText: 'moneyLifetimeTooltipText' },
] as const;

type MoneyPositionPlaceholderProps = {
  monthlyEarnings: string;
  lifetimeEarnings: string;
  isMonthlyLoading: boolean;
  isLifetimeLoading: boolean;
};

// TODO: rename this file to MoneyEarnings - update all tests and use sites.
export function MoneyPositionPlaceholder({
  monthlyEarnings,
  lifetimeEarnings,
  isMonthlyLoading,
  isLifetimeLoading,
}: MoneyPositionPlaceholderProps) {
  const t = useI18nContext();
  const earnings = {
    monthly: monthlyEarnings,
    lifetime: lifetimeEarnings,
  };
  const loading = {
    monthly: isMonthlyLoading,
    lifetime: isLifetimeLoading,
  };

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
        {POSITION_ROWS.map(({ key, labelKey, tooltipText }) => (
          <div
            key={key}
            className="flex min-h-6 items-center justify-between gap-4"
            data-testid={`money-position-${key}`}
          >
            <TooltipText
              text={t(labelKey)}
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              position={PopoverPosition.Auto}
            >
              {t(tooltipText)}
            </TooltipText>
            {loading[key] ? (
              <Skeleton
                className="h-6 w-20"
                data-testid={`money-position-${key}-skeleton`}
              />
            ) : (
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                className={
                  earnings[key].startsWith('+')
                    ? 'text-success-default'
                    : undefined
                }
                data-testid={`money-position-${key}-value`}
              >
                {earnings[key]}
              </Text>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
