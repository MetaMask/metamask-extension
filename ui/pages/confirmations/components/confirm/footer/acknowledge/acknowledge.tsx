import React from 'react';
import { useIsUpgradeTransaction } from '../../info/hooks/useIsUpgradeTransaction';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { Checkbox } from '../../../../../../components/component-library';
import { AlignItems } from '../../../../../../helpers/constants/design-system';

export type AcknowledgeProps = {
  isAcknowledged: boolean;
  onAcknowledgeToggle: (acknowledged: boolean) => void;
};

export function Acknowledge(props: AcknowledgeProps) {
  const t = useI18nContext();
  const isUpgradeTransaction = useIsUpgradeTransaction();
  const { isAcknowledged, onAcknowledgeToggle } = props;

  if (!isUpgradeTransaction) {
    return null;
  }

  return (
    <Checkbox
      data-testid="confirm-upgrade-acknowledge"
      label={t('confirmUpgradeAcknowledge')}
      isChecked={isAcknowledged}
      onChange={() => onAcknowledgeToggle(!isAcknowledged)}
      alignItems={AlignItems.flexStart}
    />
  );
}
