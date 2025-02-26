import React from 'react';
import { Box, Button, Text } from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  TextVariant,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useGasPrices } from '../../../ducks/sample/gas-prices';
import { useAsyncResult } from '../../../hooks/useAsyncResult';

export function SampleGasPrices() {
  const gasPrices = useGasPrices();

  const gasPricesUpdateResult = useAsyncResult(async () => {
    await gasPrices.updateGasPrices();
  }, [gasPrices]);

  return (
    <Card>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>Gas Prices</Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          style={{ width: '100%', minWidth: '200px' }}
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            padding={2}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.LG}
          >
            <Text>Low:</Text>
            <Text>{gasPrices.low}</Text>
          </Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            padding={2}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.LG}
          >
            <Text>Average:</Text>
            <Text>{gasPrices.average}</Text>
          </Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            padding={2}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.LG}
          >
            <Text>High:</Text>
            <Text>{gasPrices.high}</Text>
          </Box>
        </Box>
        <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
          {gasPrices.fetchedDate
            ? `Last updated: ${new Date(
                gasPrices.fetchedDate,
              ).toLocaleString()}`
            : 'Not fetched yet'}
        </Text>
        <Button
          onClick={() => {
            if (!gasPricesUpdateResult.pending) {
              gasPrices.updateGasPrices();
            }
          }}
          disabled={gasPricesUpdateResult.pending}
        >
          {gasPricesUpdateResult.pending ? 'Updating...' : 'Update Gas Prices'}
        </Button>
      </Box>
    </Card>
  );
}
