import React, { createContext } from 'react';
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

export enum ConfirmInfoRowVariant {
  Default = 'default',
  Critical = 'critical',
  Warning = 'warning',
}

export type ConfirmInfoRowProps = {
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

export const ConfirmInfoRow = ({
  label,
  children,
  variant = ConfirmInfoRowVariant.Default,
  tooltip,
  style,
}: ConfirmInfoRowProps) => (
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
