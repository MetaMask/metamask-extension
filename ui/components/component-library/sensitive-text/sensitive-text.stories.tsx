import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SensitiveText } from '.';
import { SensitiveTextLength } from './sensitive-text.types';
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
    length: SensitiveTextLength.Short,
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
      <SensitiveText {...args} length={SensitiveTextLength.Short}>
        Length "short" (6 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveTextLength.Medium}>
        Length "medium" (9 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveTextLength.Long}>
        Length "long" (12 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveTextLength.ExtraLong}>
        Length "extra long" (20 characters)
      </SensitiveText>
    </Box>
  );
};
LengthVariants.args = {
  isHidden: true,
};
