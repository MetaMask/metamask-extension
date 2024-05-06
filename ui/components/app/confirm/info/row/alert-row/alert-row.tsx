import React, { useState } from 'react';
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
import { Box } from '../../../../../component-library';
import { MultipleAlertModal } from '../../../../confirmations/alerts/multiple-alert-modal';
import useConfirmationAlertActions from '../../../../../../pages/confirmations/hooks/useConfirmationAlertActions';

export type AlertRowProps = ConfirmInfoRowProps & {
  alertKey: string;
  ownerId: string;
};

export function getAlertTextColors(variant?: ConfirmInfoRowVariant): TextColor {
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

function getSeverityAlerts(variant?: ConfirmInfoRowVariant): Severity {
  switch (variant) {
    case ConfirmInfoRowVariant.Critical:
      return Severity.Danger;
    case ConfirmInfoRowVariant.Warning:
      return Severity.Warning;
    default:
      return Severity.Info;
  }
}

export const AlertRow = (props: AlertRowProps) => {
  const { alertKey, ownerId, style, variant, ...rowProperties } = props;
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
    ...rowProperties,
    style: {
      background: 'transparent',
      ...style,
    },
    color: getAlertTextColors(variant),
  };

  const inlineAlert = hasFieldAlert ? (
    <Box marginLeft={1}>
      <InlineAlert
        onClick={handleOpenModal}
        severity={getSeverityAlerts(variant)}
      />
    </Box>
  ) : null;

  return (
    <>
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={alertKey}
          onActionClick={(actionKey) => {
            processAlertAction(actionKey);
          }}
          ownerId={ownerId}
          onFinalAcknowledgeClick={handleCloseModal}
          onClose={handleCloseModal}
        />
      )}
      <ConfirmInfoRow {...confirmInfoRowProps} labelChildren={inlineAlert} />
    </>
  );
};
