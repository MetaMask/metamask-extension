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

export enum ConfirmInfoRowState {
  Default = 'default',
  Critical = 'critical',
  Warning = 'warning',
}

export type ConfirmInfoRowProps = {
  label: string;
  children: React.ReactNode | string;
  tooltip?: string;
  state?: ConfirmInfoRowState;
  style?: React.CSSProperties;
};

const BACKGROUND_COLORS = {
  [ConfirmInfoRowState.Default]: undefined,
  [ConfirmInfoRowState.Critical]: BackgroundColor.errorMuted,
  [ConfirmInfoRowState.Warning]: BackgroundColor.warningMuted,
};

const TEXT_COLORS = {
  [ConfirmInfoRowState.Default]: TextColor.textDefault,
  [ConfirmInfoRowState.Critical]: Color.errorAlternative,
  [ConfirmInfoRowState.Warning]: Color.warningAlternative,
};

const TOOLTIP_ICONS = {
  [ConfirmInfoRowState.Default]: IconName.Question,
  [ConfirmInfoRowState.Critical]: IconName.Warning,
  [ConfirmInfoRowState.Warning]: IconName.Warning,
};

const TOOLTIP_ICON_COLORS = {
  [ConfirmInfoRowState.Default]: Color.iconMuted,
  [ConfirmInfoRowState.Critical]: Color.errorAlternative,
  [ConfirmInfoRowState.Warning]: Color.warningAlternative,
};

export const ConfirmInfoRowContext = createContext({
  state: ConfirmInfoRowState.Default,
});

export const ConfirmInfoRow = ({
  label,
  children,
  state = ConfirmInfoRowState.Default,
  tooltip,
  style,
}: ConfirmInfoRowProps) => (
  <ConfirmInfoRowContext.Provider value={{ state }}>
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      flexWrap={FlexWrap.Wrap}
      backgroundColor={BACKGROUND_COLORS[state]}
      borderRadius={BorderRadius.LG}
      marginTop={2}
      marginBottom={2}
      paddingLeft={2}
      paddingRight={2}
      color={TEXT_COLORS[state] as TextColor}
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
              name={TOOLTIP_ICONS[state]}
              marginLeft={1}
              color={TOOLTIP_ICON_COLORS[state] as unknown as IconColor}
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
