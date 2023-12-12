import React from 'react';
import type { Meta } from '@storybook/react';
import {
  BlockSize,
  BorderRadius,
  Display,
} from '../../../helpers/constants/design-system';
import { Box } from '../box';
import README from './README.mdx';
import { Skeleton } from '.';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/ComponentLibrary/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: {},
};

export default meta;

const Template = (args) => {
  return (
    <Box display={Display.Flex} gap={2}>
      <Skeleton
        {...args}
        borderRadius={BorderRadius.full}
        style={{ maxWidth: 48, height: 48 }}
      />
      <Box width={BlockSize.Full}>
        <Skeleton
          marginBottom={2}
          style={{ height: 32, width: '30%' }}
          {...args}
        />
        <Skeleton style={{ height: 48, width: '70%' }} {...args} />
      </Box>
    </Box>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
