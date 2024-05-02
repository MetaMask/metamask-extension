import React, { createContext } from 'react';
import {
  Severity,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import InlineAlert from '../../../../confirmations/alerts/inline-alert/inline-alert';
import useAlerts from '../../../../../../hooks/useAlerts';
import {
  ConfirmInfoRow,
  ConfirmInfoRowProps,
  ConfirmInfoRowVariant,
} from '../row';

export type AlertRowProps = ConfirmInfoRowProps & {
  alertKey: string;
  alertOwnerId: string;
};

export function getAlertTextColors(variant: ConfirmInfoRowVariant): TextColor {
  switch (variant) {
    case ConfirmInfoRowVariant.Critical:
      return TextColor.errorDefault;
    case ConfirmInfoRowVariant.Warning:
      return TextColor.warningDefault;
    case ConfirmInfoRowVariant.Default:
      return TextColor.infoDefault;
    default:
      return TextColor.textDefault;
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
  style,
}: AlertRowProps) => {
  const { getFieldAlerts } = useAlerts(alertOwnerId);
  const hasFieldAlert = getFieldAlerts(alertKey).length > 0;

  const confirmInfoRowProps = {
    children,
    label,
    variant,
    tooltip,
    style: {
      background: 'transparent',
      ...style,
    },
  };

  const inlineAlert = hasFieldAlert ? (
    <InlineAlert
      onClick={() => {
        // intentionally empty
      }}
      severity={getSeverityAlerts(variant)}
      style={{ marginLeft: '4px' }}
    />
  ) : null;

  return (
    <ConfirmInfoRow {...confirmInfoRowProps} labelEndChildren={inlineAlert} />
  );
};
