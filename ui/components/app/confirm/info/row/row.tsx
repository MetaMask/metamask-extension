import React, { createContext, useState } from 'react';
import { useSelector } from 'react-redux';
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
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../pages/confirmations/hooks/useAlerts';
import { InlineAlert } from '../../../../../pages/confirmations/components/alerts/inline-alert';
import { AlertModal } from '../../../../../pages/confirmations/components/alerts/alert-modal/alert-modal';
import { currentConfirmationSelector } from '../../../../../selectors';
import useConfirmationAlertActions from '../../../../../pages/confirmations/hooks/useConfirmationAlertActions';

export enum ConfirmInfoRowVariant {
  Default = 'default',
  Critical = 'critical',
  Warning = 'warning',
}

export type ConfirmInfoRowProps = {
  alertKey?: string;
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

export const ConfirmInfoRowContext = createContext({
  variant: ConfirmInfoRowVariant.Default,
});

function Alert({ alertKey }: { alertKey: string | undefined }) {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const alertOwnerId = currentConfirmation?.id as string;
  const { getFieldAlerts } = useAlerts(alertOwnerId);
  const processAlertAction = useConfirmationAlertActions();
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const hasFieldAlert = getFieldAlerts(alertKey).length > 0;

  if (!hasFieldAlert) {
    return null;
  }

  return (
    <>
      {alertModalVisible && (
        <AlertModal
          ownerId={alertOwnerId}
          onActionClick={(actionKey) => {
            processAlertAction(actionKey);
          }}
          onButtonClick={() => {
            setAlertModalVisible(false);
          }}
        />
      )}
      <InlineAlert
        onClick={() => {
          setAlertModalVisible(true);
        }}
      />
    </>
  );
}

export const ConfirmInfoRow = ({
  alertKey,
  label,
  children,
  variant = ConfirmInfoRowVariant.Default,
  tooltip,
  style,
}: ConfirmInfoRowProps) => {
  return (
    <ConfirmInfoRowContext.Provider value={{ variant }}>
      <Box
        className="confirm-info-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        flexWrap={FlexWrap.Wrap}
        backgroundColor={BACKGROUND_COLORS[variant]}
        borderRadius={BorderRadius.LG}
        marginTop={2}
        marginBottom={2}
        paddingLeft={2}
        paddingRight={2}
        color={TEXT_COLORS[variant] as TextColor}
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
        >
          <Text variant={TextVariant.bodyMdMedium} color={TextColor.inherit}>
            {label}
          </Text>
          <Alert alertKey={alertKey} />
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
        {typeof children === 'string' ? (
          <Text color={TextColor.inherit}>{children}</Text>
        ) : (
          children
        )}
      </Box>
    </ConfirmInfoRowContext.Provider>
  );
};
