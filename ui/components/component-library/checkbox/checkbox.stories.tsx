import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import React from 'react';
import README from "./README.mdx";

import {
  BorderColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

import { Checkbox } from './checkbox';
import { Box } from '../box';

export default {
  title: 'Components/ComponentLibrary/Checkbox (deprecated)',
  component: Checkbox,
  parameters: {
    docs: {
      page: README,
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
    },
  argTypes: {
    label: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
  },
} as Meta<typeof Checkbox>;

const Template: StoryFn<typeof Checkbox> = (args) => {
  const [{ isChecked }, updateArgs] = useArgs();
  return (
    <Checkbox
      {...args}
      onChange={() =>
        updateArgs({
          isChecked: !isChecked,
        })
      }
      isChecked={isChecked}
    />
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
