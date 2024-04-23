import React, { createContext, useState } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import InlineAlert from '../../../confirmations/alerts/inline-alert/inline-alert';
import useAlerts from '../../../../../hooks/useAlerts';
import { MultipleAlertModal } from '../../../confirmations/alerts/multiple-alert-modal';
import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';

export type AlertRowProps = {
  alertKey: string;
  children?: React.ReactNode;
  label: string;
  ownerId: string;
  severity?: Severity;
  tooltip?: string;
  variant?: ConfirmInfoRowVariant;
};

function getTextColors(variant: ConfirmInfoRowVariant): string {
  switch (variant) {
    case ConfirmInfoRowVariant.Critical:
      return 'var(--color-error-default)';
    case ConfirmInfoRowVariant.Warning:
      return 'var(--color-warning-default)';
    default:
      return 'var(--color-info-default)';
  }
}

function getSeverityAlerts(variant: ConfirmInfoRowVariant): Severity {
  switch (variant) {
    case ConfirmInfoRowVariant.Critical:
      return Severity.Danger;
    case ConfirmInfoRowVariant.Warning:
      return Severity.Warning;
    default:
      return Severity.Info;
  }
}

export const InlineAlertContext = createContext<React.ReactNode | null>(null);

export const AlertRow = ({
  alertKey,
  children,
  label,
  ownerId,
  tooltip,
  variant = ConfirmInfoRowVariant.Default,
}: AlertRowProps) => {
  const { getFieldAlerts } = useAlerts(ownerId);
  const hasFieldAlert = getFieldAlerts(alertKey).length > 0;

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);

  const handleCloseModal = () => {
    setAlertModalVisible(false);
  };

  const handleOpenModal = () => {
    setAlertModalVisible(true);
  };

  const inlineAlert = hasFieldAlert ? (
    <InlineAlert
      onClick={handleOpenModal}
      severity={getSeverityAlerts(variant)}
    />
  ) : null;

  return (
    <InlineAlertContext.Provider value={inlineAlert}>
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={alertKey}
          ownerId={ownerId}
          onFinalAcknowledgeClick={handleCloseModal}
          onClose={handleCloseModal}
        />
      )}
      <ConfirmInfoRow
        label={label}
        variant={variant}
        style={{
          background: 'transparent',
          color: hasFieldAlert
            ? getTextColors(variant)
            : 'var(--color-text-default)',
        }}
        tooltip={tooltip}
        children={children}
      />
    </InlineAlertContext.Provider>
  );
};
