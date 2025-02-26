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
    <Card>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>Counter</Text>
        <Text>{`Value: ${counter.value}`}</Text>
        <Button
          onClick={() => counter.increment()}
          textAlign={TextAlign.Center}
        >
          Increment Redux Counter
        </Button>
      </Box>
    </Card>
  );
}
