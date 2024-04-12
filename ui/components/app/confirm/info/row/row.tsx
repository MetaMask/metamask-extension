import React, { createContext, useState } from 'react';
import Tooltip from '../../../../ui/tooltip/tooltip';
import { Box, Icon, IconName, Text } from '../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  JustifyContent,
  OverflowWrap,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import InlineAlert from '../../../confirmations/alerts/inline-alert/inline-alert';
import useAlerts from '../../../../../hooks/useAlerts';
import { MultipleAlertModal } from '../../../confirmations/alerts/multiple-alert-modal';

export enum ConfirmInfoRowVariant {
  Default = 'default',
  Critical = 'critical',
  Warning = 'warning',
}

export type ConfirmInfoRowProps = {
  alertKey?: string;
  alertOwnerId?: string;
  label: string;
  children: React.ReactNode | string;
  tooltip?: string;
  variant?: ConfirmInfoRowVariant;
  style?: React.CSSProperties;
};

const BACKGROUND_COLORS = {
  [ConfirmInfoRowVariant.Default]: undefined,
  [ConfirmInfoRowVariant.Critical]: BackgroundColor.errorMuted,
  [ConfirmInfoRowVariant.Warning]: BackgroundColor.warningMuted,
};

const TEXT_COLORS = {
  [ConfirmInfoRowVariant.Default]: TextColor.textDefault,
  [ConfirmInfoRowVariant.Critical]: Color.errorAlternative,
  [ConfirmInfoRowVariant.Warning]: Color.warningAlternative,
};

const TOOLTIP_ICONS = {
  [ConfirmInfoRowVariant.Default]: IconName.Question,
  [ConfirmInfoRowVariant.Critical]: IconName.Warning,
  [ConfirmInfoRowVariant.Warning]: IconName.Warning,
};

const TOOLTIP_ICON_COLORS = {
  [ConfirmInfoRowVariant.Default]: Color.iconMuted,
  [ConfirmInfoRowVariant.Critical]: Color.errorAlternative,
  [ConfirmInfoRowVariant.Warning]: Color.warningAlternative,
};

const SEVERITY_ALERTS = {
  [ConfirmInfoRowVariant.Default]: Severity.Info,
  [ConfirmInfoRowVariant.Critical]: Severity.Danger,
  [ConfirmInfoRowVariant.Warning]: Severity.Warning,
};

export const ConfirmInfoRowContext = createContext({
  variant: ConfirmInfoRowVariant.Default,
});

function getAlertTextColors(variant: ConfirmInfoRowVariant) {
  switch (variant) {
    case ConfirmInfoRowVariant.Critical:
      return Color.errorDefault;
    case ConfirmInfoRowVariant.Warning:
      return Color.warningDefault;
    default:
      return Color.infoDefault;
  }
}

function RowAlert({
  alertKey,
  alertOwnerId,
  severity,
}: {
  alertKey?: string;
  alertOwnerId?: string;
  severity?: Severity;
}) {
  if (!alertOwnerId || !alertKey) {
    return null;
  }

  const { getFieldAlerts } = useAlerts(alertOwnerId);
  const hasFieldAlert = getFieldAlerts(alertKey).length > 0;

  if (!hasFieldAlert) {
    return null;
  }

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const handleCloseModal = () => {
    setAlertModalVisible(false);
  };

  return (
    <>
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={alertKey}
          ownerId={alertOwnerId}
          onFinalAcknowledgeClick={handleCloseModal}
          onClose={handleCloseModal}
        />
      )}
      <InlineAlert
        onClick={() => {
          setAlertModalVisible(true);
        }}
        severity={severity}
      />
    </>
  );
}

export const ConfirmInfoRow = ({
  alertKey,
  alertOwnerId,
  label,
  children,
  variant = ConfirmInfoRowVariant.Default,
  tooltip,
  style,
}: ConfirmInfoRowProps) => {
  const textColor = alertKey
    ? getAlertTextColors(variant)
    : TEXT_COLORS[variant];
  return (
    <ConfirmInfoRowContext.Provider value={{ variant }}>
      <Box
        className="confirm-info-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        flexWrap={FlexWrap.Wrap}
        borderRadius={BorderRadius.LG}
        backgroundColor={
          alertKey
            ? BACKGROUND_COLORS[ConfirmInfoRowVariant.Default]
            : BACKGROUND_COLORS[variant]
        }
        marginTop={2}
        marginBottom={2}
        paddingLeft={2}
        paddingRight={2}
        color={textColor as TextColor}
        style={{
          overflowWrap: OverflowWrap.Anywhere,
          minHeight: '24px',
          ...style,
        }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          gap={1}
        >
          <Text variant={TextVariant.bodyMdMedium} color={TextColor.inherit}>
            {label}
          </Text>
          <RowAlert
            alertKey={alertKey}
            alertOwnerId={alertOwnerId}
            severity={SEVERITY_ALERTS[variant]}
          />
          {tooltip && tooltip.length > 0 && (
            <Tooltip title={tooltip} style={{ display: 'flex' }}>
              <Icon
                name={TOOLTIP_ICONS[variant]}
                marginLeft={1}
                color={TOOLTIP_ICON_COLORS[variant] as unknown as IconColor}
              />
            </Tooltip>
          )}
        </Box>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </Box>
    </ConfirmInfoRowContext.Provider>
  );
};
