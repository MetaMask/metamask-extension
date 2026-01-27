import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ButtonBaseSize } from './button-base.types';
import { ButtonBase } from './button-base';

const marginSizeControlOptions = [
  undefined,
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
  title: 'Components/ComponentLibrary/ButtonBase (deprecated)',

  component: ButtonBase,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/HKpPKij9V3TpsyMV1TpV7C/DS-Components?type=design&node-id=9970-48395&mode=design&t=K6JSdtG11z2wzcXG-4',
    },
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
    block: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(ButtonBaseSize),
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    children: 'Button Base',
  },
} as Meta<typeof ButtonBase>;

export const DefaultStory: StoryFn<typeof ButtonBase> = (args) => (
  <ButtonBase {...args} />
);

DefaultStory.storyName = 'Default';
