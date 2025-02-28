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
import { useSample } from '../../../ducks/sample';

export function SampleCounterPane() {
  const counter = useSample();

  return (
    <Card data-testid="sample-counter-pane-card">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text
          variant={TextVariant.headingSm}
          data-testid="sample-counter-pane-title"
        >
          Counter
        </Text>
        <Text data-testid="sample-counter-pane-value">{`Value: ${counter.value}`}</Text>
        <Button
          onClick={() => counter.increment()}
          textAlign={TextAlign.Center}
          data-testid="sample-counter-pane-increment-button"
        >
          Increment Redux Counter
        </Button>
      </Box>
    </Card>
  );
}
