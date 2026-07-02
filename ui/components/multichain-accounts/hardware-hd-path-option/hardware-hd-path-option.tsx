import React, { useCallback } from 'react';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  Checkbox,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import type { HardwareHdPathOptionProps } from './hardware-hd-path-option.types';

/**
 * Selectable HD path option card for hardware wallet onboarding.
 *
 * @param options - Component props.
 * @param options.label - Display label for the HD path.
 * @param options.isSelected - Whether this path is currently selected.
 * @param options.onSelect - Called when the user selects this path.
 */
export const HardwareHdPathOption = ({
  label,
  isSelected,
  onSelect,
}: HardwareHdPathOptionProps) => {
  const handleSelect = useCallback(() => {
    onSelect();
  }, [onSelect]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      borderColor={BoxBorderColor.BorderMuted}
      borderWidth={isSelected ? 1 : 0}
      className="w-full cursor-pointer rounded-xl"
      data-testid="hardware-hd-path-option"
      data-selected={isSelected}
      onClick={handleSelect}
    >
      <AvatarIcon
        iconName={IconName.Hardware}
        size={AvatarIconSize.Lg}
        color={IconColor.IconAlternative}
      />
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        className="min-w-0 flex-1"
      >
        {label}
      </Text>
      {isSelected ? (
        <Checkbox
          id={`hardware-hd-path-${label}`}
          isSelected
          onChange={handleSelect}
          aria-label={label}
        />
      ) : null}
    </Box>
  );
};
