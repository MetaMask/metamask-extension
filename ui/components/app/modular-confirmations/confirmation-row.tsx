import React from 'react';
import Tooltip from '../../ui/tooltip/tooltip';
import { Box, Icon, IconName, Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

export type ConfirmationRowProps = {
  label: string;
  children: React.ReactNode | string;
  tooltip?: string;
  variant?: 'default' | 'error' | 'warning';
};

const BACKGROUND_COLORS = {
  default: undefined,
  error: BackgroundColor.errorMuted,
  warning: BackgroundColor.warningMuted,
};

const TEXT_COLORS = {
  default: TextColor.textAlternative,
  error: Color.errorAlternative,
  warning: Color.warningAlternative,
};

const TOOLTIP_ICONS = {
  default: IconName.Question,
  error: IconName.Warning,
  warning: IconName.Warning,
};

export const ConfirmationRow = ({
  label,
  children,
  variant = 'default',
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
      <Text variant={TextVariant.bodyMdMedium} color={TEXT_COLORS[variant]}>
        {label}
      </Text>
      {tooltip && tooltip.length > 0 && (
        <Tooltip title={tooltip} style={{ display: 'flex' }}>
          <Icon
            name={TOOLTIP_ICONS[variant]}
            marginLeft={1}
            color={TEXT_COLORS[variant]}
          />
        </Tooltip>
      )}
    </Box>
    {typeof children === 'string' ? (
      <Text color={TEXT_COLORS[variant]}>{children}</Text>
    ) : (
      children
    )}
  </Box>
);
