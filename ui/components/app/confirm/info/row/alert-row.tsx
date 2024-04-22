import React, { createContext } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import InlineAlert from '../../../confirmations/alerts/inline-alert/inline-alert';
import useAlerts from '../../../../../hooks/useAlerts';
import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';

export type AlertRowProps = {
  alertKey: string;
  alertOwnerId: string;
  children?: React.ReactNode;
  label: string;
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
  alertOwnerId,
  children,
  label,
  tooltip,
  variant = ConfirmInfoRowVariant.Default,
}: AlertRowProps) => {
  const { getFieldAlerts } = useAlerts(alertOwnerId);
  const hasFieldAlert = getFieldAlerts(alertKey).length > 0;

  const inlineAlert = hasFieldAlert ? (
    <InlineAlert
      onClick={() => {
        // intentionally empty
      }}
      severity={getSeverityAlerts(variant)}
    />
  ) : null;

  return (
    <InlineAlertContext.Provider value={inlineAlert}>
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
