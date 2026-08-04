import React from 'react';
import { Tag, TagSeverity } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type NoFeeTagProps = {
  testId?: string;
};

/**
 * Info tag shown next to tokens that incur no Relay fixed-spread fee.
 *
 * @param props - Component props.
 * @param props.testId - Optional test id override.
 */
export function NoFeeTag({ testId = 'no-fee-tag' }: NoFeeTagProps = {}) {
  const t = useI18nContext();

  return (
    <Tag severity={TagSeverity.Info} data-testid={testId}>
      {t('noFee')}
    </Tag>
  );
}
