import React, { useState } from 'react';
import {
  Severity,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import InlineAlert from '../../../../alert-system/inline-alert/inline-alert';
import useAlerts from '../../../../../../hooks/useAlerts';
import {
  ConfirmInfoRow,
  ConfirmInfoRowProps,
  ConfirmInfoRowVariant,
} from '../row';
import { Box } from '../../../../../component-library';
import { MultipleAlertModal } from '../../../../alert-system/multiple-alert-modal';

export type ConfirmInfoAlertRowProps = ConfirmInfoRowProps & {
  alertKey: string;
  ownerId: string;
};

function getAlertTextColors(
  variant?: ConfirmInfoRowVariant | Severity,
): TextColor {
  switch (variant) {
    case ConfirmInfoRowVariant.Critical:
    case Severity.Danger:
      return TextColor.errorDefault;
    case ConfirmInfoRowVariant.Warning:
    case Severity.Warning:
      return TextColor.warningDefault;
    case ConfirmInfoRowVariant.Default:
    case Severity.Info:
      return TextColor.infoDefault;
    default:
      return TextColor.textDefault;
  }
}

export const ConfirmInfoAlertRow = ({
  alertKey,
  ownerId,
  variant,
  ...rowProperties
}: ConfirmInfoAlertRowProps) => {
  const { getFieldAlerts } = useAlerts(ownerId);
  const fieldAlerts = getFieldAlerts(alertKey);
  const hasFieldAlert = fieldAlerts.length > 0;
  const selectedAlertSeverity = fieldAlerts[0]?.severity;

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);

  const handleCloseModal = () => {
    setAlertModalVisible(false);
  };

  const handleOpenModal = () => {
    setAlertModalVisible(true);
  };

  const confirmInfoRowProps = {
    ...rowProperties,
    style: { background: 'transparent', ...rowProperties.style },
    color: getAlertTextColors(variant ?? selectedAlertSeverity),
    variant,
  };

  const inlineAlert = hasFieldAlert ? (
    <Box marginLeft={1}>
      <InlineAlert onClick={handleOpenModal} severity={selectedAlertSeverity} />
    </Box>
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
      <ConfirmInfoRow {...confirmInfoRowProps} labelChildren={inlineAlert} />
    </>
  );
};
