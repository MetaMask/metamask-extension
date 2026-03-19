import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
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

type SettingsSelectItemProps = {
  label: string;
  /** Text value to display, or a ReactNode for custom content (e.g., icon + text) */
  value: string | ReactNode;
  /** Route to navigate to when the item is selected */
  to: string;
  /** Ref for settings search scroll handling */
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export const SettingsSelectItem = ({
  label,
  value,
  to,
  sectionRef,
}: SettingsSelectItemProps) => {
  return (
    <Box
      ref={sectionRef}
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      paddingVertical={3}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {label}
      </Text>
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
        <Link to={to} className="flex ml-1">
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        </Link>
      </Box>
    </Box>
  );
};
