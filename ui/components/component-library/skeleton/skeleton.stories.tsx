import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  BorderRadius,
  TextVariant,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { Box, Button, ButtonVariant, Text } from '..';
import README from './README.mdx';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/ComponentLibrary/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
  },
  args: {
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const DefaultStory: Story = {
  args: {
    height: 32,
    width: 300,
  },
};

DefaultStory.storyName = 'Default';

export const WidthHeight: Story = {
  render: () => (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
      <Skeleton height={32} width={300} />
      <Skeleton height={16} width={250} />
      <Skeleton height={16} width={250} />
    </Box>
  ),
};

export const Children: Story = {
  render: () => (
    <Skeleton
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={4}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.LG}
      padding={4}
    >
      <Skeleton height={32} width="100%" />
      <Skeleton height={16} width="95%" />
      <Skeleton height={16} width="95%" />
    </Skeleton>
  ),
};

export const HideChildren: Story = {
  args: {
    width: 'max-content',
    hideChildren: true,
  },
  render: (args) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    return (
      <Box>
        <Button
          onClick={() => setIsLoaded(!isLoaded)}
          variant={ButtonVariant.Secondary}
          marginBottom={4}
        >
          Toggle isLoading
        </Button>
        {isLoaded ? (
          <div>
            <Text variant={TextVariant.headingMd}>Content to load</Text>
          </div>
        ) : (
          <Skeleton {...args}>
            <Text variant={TextVariant.headingMd}>Hidden placeholder text</Text>
          </Skeleton>
        )}
      </Box>
    );
  },
};

export const BorderRadiusStory: Story = {
  render: () => (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <Text>BorderRadius.full</Text>
        <Skeleton borderRadius={BorderRadius.full} height={32} width={32} />
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <Text>BorderRadius.full</Text>
        <Skeleton borderRadius={BorderRadius.pill} height={32} width="100%" />
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <Text>BorderRadius.LG</Text>
        <Skeleton borderRadius={BorderRadius.LG} height={32} width="100%" />
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <Text>BorderRadius.MD</Text>
        <Skeleton borderRadius={BorderRadius.MD} height={32} width="100%" />
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <Text>BorderRadius.SM</Text>
        <Skeleton borderRadius={BorderRadius.SM} height={32} width="100%" />
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <Text>BorderRadius.XS</Text>
        <Skeleton borderRadius={BorderRadius.XS} height={32} width="100%" />
      </Box>
    </Box>
  ),
};

BorderRadiusStory.storyName = 'BorderRadius';
