import React from 'react';
import Tooltip from '../../../../../ui/tooltip/tooltip';
import { Box, Icon, IconName, Text } from '../../../../../component-library';
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
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';

export enum ConfirmationRowVariant {
  Default = 'default',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Error = 'error',
  Warning = 'warning',
}

export type ConfirmationRowProps = {
  label: string;
  children: React.ReactNode | string;
  tooltip?: string;
  variant?: ConfirmationRowVariant;
};

const BACKGROUND_COLORS = {
  [ConfirmationRowVariant.Default]: undefined,
  [ConfirmationRowVariant.Error]: BackgroundColor.errorMuted,
  [ConfirmationRowVariant.Warning]: BackgroundColor.warningMuted,
};

const TEXT_COLORS = {
  [ConfirmationRowVariant.Default]: TextColor.textAlternative,
  [ConfirmationRowVariant.Error]: Color.errorAlternative,
  [ConfirmationRowVariant.Warning]: Color.warningAlternative,
};

const TOOLTIP_ICONS = {
  [ConfirmationRowVariant.Default]: IconName.Question,
  [ConfirmationRowVariant.Error]: IconName.Warning,
  [ConfirmationRowVariant.Warning]: IconName.Warning,
};

export const ConfirmationRow = ({
  label,
  children,
  variant = ConfirmationRowVariant.Default,
  tooltip,
}: ConfirmationRowProps) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    justifyContent={JustifyContent.spaceBetween}
    flexWrap={FlexWrap.Wrap}
    backgroundColor={BACKGROUND_COLORS[variant]}
    borderRadius={BorderRadius.SM}
    marginTop={2}
    marginBottom={2}
    paddingLeft={1}
    paddingRight={1}
  >
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TEXT_COLORS[variant] as TextColor}
      >
        {label}
      </Text>
      {tooltip && tooltip.length > 0 && (
        <Tooltip title={tooltip} style={{ display: 'flex' }}>
          <Icon
            name={TOOLTIP_ICONS[variant]}
            marginLeft={1}
            color={TEXT_COLORS[variant] as unknown as IconColor}
          />
        </Tooltip>
      )}
    </Box>
    {typeof children === 'string' ? (
      <Text color={TEXT_COLORS[variant] as TextColor}>{children}</Text>
    ) : (
      children
    )}
  </Box>
);
