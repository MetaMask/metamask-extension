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
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Text } from '../text';
import README from './README.mdx';
import { Skeleton } from './skeleton';
import { Box } from '../box';
import { Button, ButtonVariant } from '../button';

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

export const IsLoading: Story = {
  args: {
    width: 'max-content',
  },
  render: function IsLoadingStory(args) {
    const [isLoading, setIsLoading] = React.useState(true);
    return (
      <Box>
        <Button
          onClick={() => setIsLoading(!isLoading)}
          variant={ButtonVariant.Secondary}
          marginBottom={4}
        >
          Toggle isLoading
        </Button>
        <Skeleton {...args} isLoading={isLoading}>
          <Text variant={TextVariant.headingMd}>Content that loads</Text>
        </Skeleton>
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

export const TokenListSkeleton: Story = {
  render: () => (
    <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
      <Skeleton
        width={32}
        height={32}
        borderRadius={BorderRadius.full}
        style={{
          minWidth: 32, // add classname with this style attached
        }}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={1}
        width={BlockSize.Full}
        paddingRight={12}
      >
        <Skeleton width="100%" height={16} />
        <Skeleton width="70%" height={16} />
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={1}
        width={BlockSize.OneThird}
      >
        <Skeleton width="100%" height={16} />
        <Skeleton width="100%" height={16} />
      </Box>
    </Box>
  ),
};
