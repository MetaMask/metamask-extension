import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SensitiveText } from '.';
import { SensitiveLengths } from './sensitive-text.types';
import { Box } from '../box';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

export default {
  title: 'Components/ComponentLibrary/SensitiveText',
  component: SensitiveText,
  args: {
    children: 'Sensitive information',
    isHidden: false,
    length: SensitiveLengths.Short,
  },
} as Meta<typeof SensitiveText>;

const Template: StoryFn<typeof SensitiveText> = (args) => {
  return <SensitiveText {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const HiddenText: StoryFn<typeof SensitiveText> = (args) => {
  return <SensitiveText {...args} />;
};
HiddenText.args = {
  isHidden: true,
};

export const LengthVariants: StoryFn<typeof SensitiveText> = (args) => {
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <SensitiveText {...args} length={SensitiveLengths.Short}>
        Length "short" (4 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveLengths.Medium}>
        Length "medium" (8 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveLengths.Long}>
        Length "long" (12 characters)
      </SensitiveText>
    </Box>
  );
};
LengthVariants.args = {
  isHidden: true,
};
