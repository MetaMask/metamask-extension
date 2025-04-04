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
import { DailyAllowance, DailyAllowanceTokenTypes } from '../../remote.types';

export default function RemoteModeDailyAllowanceCard({
  dailyAllowance,
  onRemove,
}: {
  dailyAllowance: DailyAllowance;
  onRemove: () => void;
}) {
  const [selectedToken] = useState<DailyAllowanceTokenTypes>(
    DailyAllowanceTokenTypes.ETH
  );

  const handleRemoveToken = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return (
    <Box
      width={BlockSize.Full}
      marginTop={4}
    >
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
            {/* <img
              src={selectedToken.iconUrl}
              alt={selectedToken.name}
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            /> */}
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
          <Text variant={TextVariant.bodyMd}>
            Daily limit
          </Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {dailyAllowance.amount}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
