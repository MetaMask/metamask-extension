import React, { createContext, useState } from 'react';
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
import { MultipleAlertModal } from '../../../../confirmations/alerts/multiple-alert-modal';

export type AlertRowProps = ConfirmInfoRowProps & {
  alertKey: string;
  ownerId: string;
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
  ownerId,
  children,
  label,
  tooltip,
  variant = ConfirmInfoRowVariant.Default,
  style,
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
      onClick={handleOpenModal}
      severity={getSeverityAlerts(variant)}
      style={{ marginLeft: '4px' }}
    />
  ) : null;

  return (
    <>
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={alertKey}
          ownerId={ownerId}
          onFinalAcknowledgeClick={handleCloseModal}
          onClose={handleCloseModal}
        />
      )}
      <ConfirmInfoRow {...confirmInfoRowProps} labelEndChildren={inlineAlert} />
    </>
  );
};
