import React, { useState } from 'react';
import {
  JustifyContent,
  Severity,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../../hooks/useAlerts';
import { Box } from '../../../../../component-library';
import { useAlertMetrics } from '../../../../alert-system/contexts/alertMetricsContext';
import InlineAlert from '../../../../alert-system/inline-alert/inline-alert';
import { MultipleAlertModal } from '../../../../alert-system/multiple-alert-modal';
import {
  ConfirmInfoRow,
  ConfirmInfoRowProps,
  ConfirmInfoRowVariant,
} from '../row';
import { Skeleton } from '../../../../../component-library/skeleton';

export type ConfirmInfoAlertRowProps = ConfirmInfoRowProps & {
  alertKey: string;
  ownerId: string;
  /** Determines whether to display the row only when an alert is present. */
  isShownWithAlertsOnly?: boolean;
  /** Show skeleton loader if alert is not yet loaded. */
  showAlertLoader?: boolean;
};

export function getAlertTextColors(
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
    default:
      return TextColor.textDefault;
  }
}

export const ConfirmInfoAlertRow = ({
  alertKey,
  ownerId,
  variant,
  isShownWithAlertsOnly = false,
  showAlertLoader = false,
  ...rowProperties
}: ConfirmInfoAlertRowProps) => {
  const { trackInlineAlertClicked } = useAlertMetrics();
  const { getFieldAlerts } = useAlerts(ownerId);
  const fieldAlerts = getFieldAlerts(alertKey);
  const hasFieldAlert = fieldAlerts.length > 0;
  const selectedAlertSeverity = fieldAlerts[0]?.severity;
  const selectedAlertKey = fieldAlerts[0]?.key;
  const selectedAlertShowArrow = fieldAlerts[0]?.showArrow;
  const selectedAlertInlineAlertText = fieldAlerts[0]?.inlineAlertText;
  const selectedAlertIsOpenModalOnClick =
    fieldAlerts[0]?.isOpenModalOnClick ?? true;

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);

  const handleModalClose = () => {
    setAlertModalVisible(false);
  };

  const handleInlineAlertClick = () => {
    setAlertModalVisible(true);
    trackInlineAlertClicked(selectedAlertKey);
  };

  const onClickHandler =
    hasFieldAlert && selectedAlertIsOpenModalOnClick
      ? handleInlineAlertClick
      : undefined;
  const confirmInfoRowProps = {
    ...rowProperties,
    style: { background: 'transparent', ...rowProperties.style },
    color: getAlertTextColors(variant ?? selectedAlertSeverity),
    variant,
    onClick: onClickHandler,
    labelChildrenStyleOverride: rowProperties.labelChildren
      ? { justifyContent: JustifyContent.center }
      : {},
  };

  if (isShownWithAlertsOnly && !hasFieldAlert) {
    return null;
  }

  const inlineAlertLoader = showAlertLoader ? (
    <Box marginLeft={1} className="flex-grow justify-items-end">
      <Skeleton width="50%" height={26} />
    </Box>
  ) : null;

  const inlineAlert = hasFieldAlert ? (
    <Box marginLeft={1}>
      <InlineAlert
        severity={selectedAlertSeverity}
        showArrow={selectedAlertShowArrow}
        textOverride={selectedAlertInlineAlertText}
        onClick={onClickHandler}
      />
    </Box>
  ) : (
    inlineAlertLoader
  );

  let confirmInfoRow: React.ReactNode;
  if (confirmInfoRowProps.labelChildren) {
    confirmInfoRow = (
      <ConfirmInfoRow
        {...rowProperties}
        labelChildren={rowProperties.labelChildren}
      >
        {inlineAlert}
      </ConfirmInfoRow>
    );
  } else {
    confirmInfoRow = (
      <ConfirmInfoRow {...confirmInfoRowProps} labelChildren={inlineAlert} />
    );
  }

  return (
    <>
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={selectedAlertKey}
          ownerId={ownerId}
          onFinalAcknowledgeClick={handleModalClose}
          onClose={handleModalClose}
          showCloseIcon={false}
          skipAlertNavigation={true}
        />
      )}
      {confirmInfoRow}
    </>
  );
};
