import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import {
  TextColor,
  BackgroundColor,
  BorderColor,
  Display,
} from '../../../helpers/constants/design-system';

import { AvatarBaseSize } from './avatar-base.types';
import { AvatarBase } from './avatar-base';

const marginSizeKnobOptions = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  tags: ['autodocs'],
  title: 'Components/ComponentLibrary/AvatarBase (deprecated)',
  component: AvatarBase,
  parameters: {
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AvatarBaseSize),
    },
    children: {
      control: 'text',
    },
    color: {
      options: Object.values(TextColor),
      control: 'select',
    },
    backgroundColor: {
      options: Object.values(BackgroundColor),
      control: 'select',
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
    },
    display: {
      options: Object.values(Display),
      control: 'select',
      table: { category: 'box props' },
    },
    marginTop: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    size: AvatarBaseSize.Md,
    color: TextColor.textDefault,
    backgroundColor: BackgroundColor.backgroundAlternative,
    borderColor: BorderColor.borderDefault,
    children: 'B',
  },
} as Meta<typeof AvatarBase>;

export const DefaultStory: StoryFn<typeof AvatarBase> = (args) => (
  <AvatarBase {...args} />
);

DefaultStory.storyName = 'Default';
