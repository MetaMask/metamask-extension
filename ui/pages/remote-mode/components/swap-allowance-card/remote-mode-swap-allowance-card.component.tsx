import React, { useCallback, useState } from 'react';

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
import { SwapAllowance, TokenInfo, TOKEN_DETAILS } from '../../remote.types';

/**
 * RemoteModeSwapAllowanceCard displays a card showing swap allowance details
 * for a specific token, including the token info, swap destination, and daily limit
 *
 * @param props - The component props
 * @param props.swapAllowance - The swap allowance configuration containing
 * token details, destination, and amount limits
 * @param props.onRemove - Callback function triggered when the remove button is clicked
 * @returns A card component displaying swap allowance info
 */
export default function RemoteModeSwapAllowanceCard({
  swapAllowance,
  onRemove,
}: {
  swapAllowance: SwapAllowance;
  onRemove: () => void;
}) {
  const [selectedToken] = useState<TokenInfo>(
    TOKEN_DETAILS[swapAllowance.from],
  );

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
            <img
              src={selectedToken.iconUrl}
              alt={selectedToken.name}
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            />
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              {selectedToken.symbol}
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
          <Text variant={TextVariant.bodyMd}>Swap to</Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {swapAllowance.to}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          gap={2}
        >
          <Text variant={TextVariant.bodyMd}>Daily limit</Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {swapAllowance.amount}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
