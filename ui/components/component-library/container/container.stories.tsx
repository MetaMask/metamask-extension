import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { Box } from '../box';
import {
  Display,
  FlexDirection,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';

import { ContainerMaxWidth } from './container.types';
import { Container } from '.';

export default {
  title: 'Components/ComponentLibrary/Container',
  component: Container,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam aliquam, nisl eget aliquam ultrices, nunc nunc aliquam nunc, vitae aliquam nunc nunc eget nunc. Nullam aliquam, nisl eget aliquam ultrices, nunc nunc aliquam nunc, vitae aliquam nunc nunc eget nunc.',
    maxWidth: ContainerMaxWidth.Sm,
  },
} as Meta<typeof Container>;

const Template: StoryFn<typeof Container> = (args) => {
  return <Container {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const MaxWidth: StoryFn<typeof Container> = (args) => {
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={8}>
      <Container
        {...args}
        maxWidth={ContainerMaxWidth.Sm}
        backgroundColor={BackgroundColor.primaryMuted}
        padding={4}
      >
        Size "sm" container
      </Container>
      <Container
        {...args}
        maxWidth={ContainerMaxWidth.Md}
        backgroundColor={BackgroundColor.successMuted}
        padding={4}
      >
        Size "md" container
      </Container>
      <Container
        {...args}
        maxWidth={ContainerMaxWidth.Lg}
        backgroundColor={BackgroundColor.warningMuted}
        padding={4}
      >
        Size "lg" container
      </Container>
      <Container
        {...args}
        backgroundColor={BackgroundColor.errorMuted}
        padding={4}
      >
        no max-width container
      </Container>
    </Box>
  );
};
MaxWidth.args = {
  maxWidth: undefined,
};
