import React, { useEffect } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import Segment from './segment';
import { Box } from '../../../components/component-library';
import { StatusTypes } from '@metamask/bridge-controller';

export default {
  title: 'Pages/Bridge/TransactionDetails/Segment',
  component: Segment,
} as Meta<typeof Segment>;

const types = [StatusTypes.PENDING, StatusTypes.COMPLETE, null];

export const DefaultStory: StoryFn<typeof Segment> = () => {
  const [typeIndex, setType] = React.useState<StatusTypes | null>(
    StatusTypes.PENDING,
  );

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % types.length;
      setType(types[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={1}
      width={BlockSize.Full}
    >
      <Segment type={typeIndex} />
    </Box>
  );
};
DefaultStory.storyName = 'Default';
