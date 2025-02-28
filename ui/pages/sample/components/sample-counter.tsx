import React from 'react';
import { Box, Button, Text } from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useCounter } from '../../../ducks/sample/counter';

export function SampleCounter() {
  const counter = useCounter();

  return (
    <Card data-testid="sample-counter-card">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text
          variant={TextVariant.headingSm}
          data-testid="sample-counter-title"
        >
          Counter
        </Text>
        <Text data-testid="sample-counter-value">{`Value: ${counter.value}`}</Text>
        <Button
          onClick={() => counter.increment()}
          textAlign={TextAlign.Center}
          data-testid="sample-counter-increment-button"
        >
          Increment Redux Counter
        </Button>
      </Box>
    </Card>
  );
}
