import React, { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconName,
  Icon,
  IconSize,
  TextColor,
} from '@metamask/design-system-react';
import { transitionForward } from '../../../components/ui/transition';

type SettingsSelectItemProps = {
  label: string;
  /** Text value to display, or a ReactNode for custom content (e.g., icon + text) */
  value: string | ReactNode;
  /** Route to navigate to when the item is selected */
  to: string;
  /** Optional test id for the clickable navigation control */
  dataTestId?: string;
  /** Optional leading content (e.g., an icon) rendered before the label */
  startAccessory?: ReactNode;
};

export const SettingsSelectItem = ({
  label,
  value,
  to,
  dataTestId,
  startAccessory,
}: SettingsSelectItemProps) => {
  const navigate = useNavigate();

  return (
    <Link
      to={to}
      className="block hover:bg-background-default-hover"
      data-testid={dataTestId}
      onClick={(event) => {
        event.preventDefault();
        transitionForward(() => navigate(to));
      }}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingVertical={3}
        paddingHorizontal={4}
      >
        {startAccessory ? (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={4}
            className="min-w-0"
          >
            {startAccessory}
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {label}
            </Text>
          </Box>
        ) : (
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {label}
          </Text>
        )}
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          {typeof value === 'string' ? (
            <Text
              color={TextColor.TextAlternative}
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
            >
              {value}
            </Text>
          ) : (
            value
          )}
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        </Box>
      </Box>
    </Link>
  );
};
