import React, { useCallback } from 'react';

import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../../components/component-library';
import {
  FontWeight,
  TextVariant,
  BackgroundColor,
  Display,
  JustifyContent,
  FlexDirection,
  BlockSize,
  TextColor,
  BorderColor,
  BorderRadius,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { DailyAllowance } from '../../remote.types';

/**
 * A card component that displays and manages a single daily allowance entry in remote mode.
 * Shows the token type and daily limit amount, with the ability to remove the allowance.
 *
 * @param props - The component props
 * @param props.dailyAllowance - The daily allowance configuration to display
 * @param props.onRemove - Callback function triggered when the allowance is removed
 * @returns A card component displaying the daily allowance information
 */
export default function RemoteModeDailyAllowanceCard({
  dailyAllowance,
  onRemove,
}: {
  dailyAllowance: DailyAllowance;
  onRemove: () => void;
}) {
  const handleRemoveToken = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return (
    <Box width={BlockSize.Full} marginTop={4}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
        padding={4}
        backgroundColor={BackgroundColor.backgroundMuted}
        borderRadius={BorderRadius.LG}
        borderColor={BorderColor.borderDefault}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          borderRadius={BorderRadius.MD}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              {dailyAllowance.tokenType}
            </Text>
          </Box>
          <Button variant={ButtonVariant.Link} onClick={handleRemoveToken}>
            Remove
          </Button>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          gap={2}
        >
          <Text variant={TextVariant.bodyMd}>Daily limit</Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {dailyAllowance.amount}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
