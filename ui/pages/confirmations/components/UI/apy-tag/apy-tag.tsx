import React from 'react';
import { Tag, TagSeverity } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type ApyTagProps = {
  /**
   * Vault APY already formatted as a percentage, e.g. `4.2%`.
   */
  apyPercentFormatted: string;
  testId?: string;
};

/**
 * Success tag for the vault APY a Perps withdrawal earns in the Money Account.
 *
 * @param props - Component props.
 * @param props.apyPercentFormatted - Formatted percentage, including the `%`.
 * @param props.testId - Optional test id override.
 */
export function ApyTag({
  apyPercentFormatted,
  testId = 'apy-tag',
}: ApyTagProps) {
  const t = useI18nContext();

  return (
    <Tag
      severity={TagSeverity.Success}
      data-testid={testId}
      className="shrink-0 whitespace-nowrap"
    >
      {t('moneyApy', [apyPercentFormatted])}
    </Tag>
  );
}
