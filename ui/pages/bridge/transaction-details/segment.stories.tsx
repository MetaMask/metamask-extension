import React, { useEffect } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Segment from './segment';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { StatusTypes } from '@metamask/bridge-controller';

export default {
  title: 'pages/bridge/transaction-details/Segment',
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
      className="flex w-full"
      flexDirection={BoxFlexDirection.Column}
      gap={1}
    >
      <Segment type={typeIndex} />
    </Box>
  );
};
DefaultStory.storyName = 'Default';
