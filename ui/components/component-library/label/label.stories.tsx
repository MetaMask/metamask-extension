import React, { useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import {
  Display,
  FlexDirection,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';

import { Box, Icon, IconName, IconSize, TextField } from '..';
import { Label } from './label';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/Label',

  component: Label,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    htmlFor: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Label',
  },
} as ComponentMeta<typeof Label>;

const Template: ComponentStory<typeof Label> = (args) => <Label {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children: ComponentStory<typeof Label> = (args) => (
  <Box
    display={Display.InlineFlex}
    flexDirection={FlexDirection.Column}
    gap={2}
  >
    <Label {...args}>Plain text</Label>
    <Label {...args} display={Display.Flex} alignItems={AlignItems.flexStart}>
      Text and icon
      <Icon
        color={IconColor.iconAlternative}
        name={IconName.Info}
        size={IconSize.Inherit}
      />
    </Label>
    <Label
      {...args}
      display={Display.InlineFlex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
    >
      Label that wraps an input
      <TextField placeholder="Click label to focus" />
    </Label>
  </Box>
);

export const HtmlFor: ComponentStory<typeof Label> = (args) => {
  const [value, setValue] = useState('');
  const handleOnChange = (e) => {
    setValue(e.target.value);
  };
  return (
    <Box display={Display.InlineFlex} flexDirection={FlexDirection.Column}>
      <Label {...args} />
      <TextField
        id="add-network"
        value={value}
        onChange={handleOnChange}
        placeholder="Enter network name"
      />
    </Box>
  );
};
HtmlFor.args = {
  children: 'Network name',
  htmlFor: 'add-network',
};
