import React from 'react';
import {
  PRIMARY_SECONDARY_BUTTON_SIZES,
  ALIGN_ITEMS,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

import { BaseIcon } from '../base-icon/base-icon';
import { ButtonPrimary } from './button-primary';
import README from './README.mdx';

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
  title: 'Components/ComponentLibrary/Button/ButtonPrimary',
  id: __filename,
  component: ButtonPrimary,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(PRIMARY_SECONDARY_BUTTON_SIZES),
    },
    className: {
      control: 'text',
    },
    isBlock: {
      control: 'boolean',
    },
    isDanger: {
      control: 'boolean',
    },
    isDisabled: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
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
    children: 'Click Me',
  },
};

export const DefaultStory = (args) => (
  <>
    <ButtonPrimary
      {...args}
      leftIcon={
        <BaseIcon>
          <path d="M259 16l204 112 3 3c1 1 2 2 2 3 1 1 1 3 1 4 1 1 1 2 1 3l-2 224c0 5-3 10-7 13L261 496c-3 1-5 2-8 2h-1c-3 0-5-1-8-2L49 380c-5-2-7-7-7-12V141c0-5 2-10 7-13 1 0 1-1 2-1L245 16c5-2 10-2 14 0zm182 150l-175 97 1 195 172-101zm-370 0v190l2 2c0 1 1 2 1 3l163 97V261zm331 170c3-5 9-7 14-4l6 3c5 3 6 9 4 14-2 4-6 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-305-4c5-3 12-1 14 4 3 4 2 11-3 14l-6 3c-2 1-3 1-5 1-4 0-7-2-9-5-3-5-1-11 4-14zm265-18c3-5 9-7 14-4l6 3c5 3 7 9 4 14-2 3-6 5-9 5-2 0-4 0-5-1l-6-3c-5-3-7-9-4-14zm-226-5c5-3 11-1 14 4s1 11-4 14l-5 4c-2 0-4 1-5 1-4 0-7-2-9-5-3-5-1-12 3-14zm186-18c3-5 9-7 14-4l6 3c5 3 7 10 4 14-2 4-5 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-147-4c5-3 11-1 14 4s1 11-4 14l-5 3c-2 1-4 2-6 2-3 0-7-2-9-6-2-5-1-11 4-14zm107-18c3-5 10-7 14-4l6 3c5 3 7 9 4 14-2 3-5 5-9 5-2 0-3 0-5-1l-6-3c-5-3-6-9-4-14zm-69-4c5-3 12-2 15 3 2 5 1 12-4 15l-6 3c-1 1-3 1-5 1-3 0-7-2-9-5-3-5-1-11 4-14zm39-220L87 140l166 95 173-94zm0 150c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-6 5-10 10-10zm0-45c6 0 11 5 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-5 5-10 10-10z" />
        </BaseIcon>
      }
    />
    {/* Test Anchor tag to match exactly as button */}
    <ButtonPrimary
      as="a"
      {...args}
      href="#"
      rightIcon={
        <BaseIcon>
          <path d="M259 16l204 112 3 3c1 1 2 2 2 3 1 1 1 3 1 4 1 1 1 2 1 3l-2 224c0 5-3 10-7 13L261 496c-3 1-5 2-8 2h-1c-3 0-5-1-8-2L49 380c-5-2-7-7-7-12V141c0-5 2-10 7-13 1 0 1-1 2-1L245 16c5-2 10-2 14 0zm182 150l-175 97 1 195 172-101zm-370 0v190l2 2c0 1 1 2 1 3l163 97V261zm331 170c3-5 9-7 14-4l6 3c5 3 6 9 4 14-2 4-6 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-305-4c5-3 12-1 14 4 3 4 2 11-3 14l-6 3c-2 1-3 1-5 1-4 0-7-2-9-5-3-5-1-11 4-14zm265-18c3-5 9-7 14-4l6 3c5 3 7 9 4 14-2 3-6 5-9 5-2 0-4 0-5-1l-6-3c-5-3-7-9-4-14zm-226-5c5-3 11-1 14 4s1 11-4 14l-5 4c-2 0-4 1-5 1-4 0-7-2-9-5-3-5-1-12 3-14zm186-18c3-5 9-7 14-4l6 3c5 3 7 10 4 14-2 4-5 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-147-4c5-3 11-1 14 4s1 11-4 14l-5 3c-2 1-4 2-6 2-3 0-7-2-9-6-2-5-1-11 4-14zm107-18c3-5 10-7 14-4l6 3c5 3 7 9 4 14-2 3-5 5-9 5-2 0-3 0-5-1l-6-3c-5-3-6-9-4-14zm-69-4c5-3 12-2 15 3 2 5 1 12-4 15l-6 3c-1 1-3 1-5 1-3 0-7-2-9-5-3-5-1-11 4-14zm39-220L87 140l166 95 173-94zm0 150c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-6 5-10 10-10zm0-45c6 0 11 5 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-5 5-10 10-10z" />
        </BaseIcon>
      }
    />

    <ButtonPrimary {...args} display={DISPLAY.BLOCK} />
  </>
);

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <ButtonPrimary {...args} size={PRIMARY_SECONDARY_BUTTON_SIZES.SM} />
    <ButtonPrimary {...args} size={PRIMARY_SECONDARY_BUTTON_SIZES.MD} />
    <ButtonPrimary {...args} size={PRIMARY_SECONDARY_BUTTON_SIZES.LG} />
  </Box>
);

export const WithIcon = (args) => (
  <>
    <ButtonPrimary
      {...args}
      leftIcon={
        <BaseIcon>
          <path d="M259 16l204 112 3 3c1 1 2 2 2 3 1 1 1 3 1 4 1 1 1 2 1 3l-2 224c0 5-3 10-7 13L261 496c-3 1-5 2-8 2h-1c-3 0-5-1-8-2L49 380c-5-2-7-7-7-12V141c0-5 2-10 7-13 1 0 1-1 2-1L245 16c5-2 10-2 14 0zm182 150l-175 97 1 195 172-101zm-370 0v190l2 2c0 1 1 2 1 3l163 97V261zm331 170c3-5 9-7 14-4l6 3c5 3 6 9 4 14-2 4-6 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-305-4c5-3 12-1 14 4 3 4 2 11-3 14l-6 3c-2 1-3 1-5 1-4 0-7-2-9-5-3-5-1-11 4-14zm265-18c3-5 9-7 14-4l6 3c5 3 7 9 4 14-2 3-6 5-9 5-2 0-4 0-5-1l-6-3c-5-3-7-9-4-14zm-226-5c5-3 11-1 14 4s1 11-4 14l-5 4c-2 0-4 1-5 1-4 0-7-2-9-5-3-5-1-12 3-14zm186-18c3-5 9-7 14-4l6 3c5 3 7 10 4 14-2 4-5 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-147-4c5-3 11-1 14 4s1 11-4 14l-5 3c-2 1-4 2-6 2-3 0-7-2-9-6-2-5-1-11 4-14zm107-18c3-5 10-7 14-4l6 3c5 3 7 9 4 14-2 3-5 5-9 5-2 0-3 0-5-1l-6-3c-5-3-6-9-4-14zm-69-4c5-3 12-2 15 3 2 5 1 12-4 15l-6 3c-1 1-3 1-5 1-3 0-7-2-9-5-3-5-1-11 4-14zm39-220L87 140l166 95 173-94zm0 150c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-6 5-10 10-10zm0-45c6 0 11 5 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-5 5-10 10-10z" />
        </BaseIcon>
      }
    />
    {/* Test Anchor tag to match exactly as button */}
    <ButtonPrimary
      as="a"
      {...args}
      href="#"
      rightIcon={
        <BaseIcon>
          <path d="M259 16l204 112 3 3c1 1 2 2 2 3 1 1 1 3 1 4 1 1 1 2 1 3l-2 224c0 5-3 10-7 13L261 496c-3 1-5 2-8 2h-1c-3 0-5-1-8-2L49 380c-5-2-7-7-7-12V141c0-5 2-10 7-13 1 0 1-1 2-1L245 16c5-2 10-2 14 0zm182 150l-175 97 1 195 172-101zm-370 0v190l2 2c0 1 1 2 1 3l163 97V261zm331 170c3-5 9-7 14-4l6 3c5 3 6 9 4 14-2 4-6 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-305-4c5-3 12-1 14 4 3 4 2 11-3 14l-6 3c-2 1-3 1-5 1-4 0-7-2-9-5-3-5-1-11 4-14zm265-18c3-5 9-7 14-4l6 3c5 3 7 9 4 14-2 3-6 5-9 5-2 0-4 0-5-1l-6-3c-5-3-7-9-4-14zm-226-5c5-3 11-1 14 4s1 11-4 14l-5 4c-2 0-4 1-5 1-4 0-7-2-9-5-3-5-1-12 3-14zm186-18c3-5 9-7 14-4l6 3c5 3 7 10 4 14-2 4-5 6-9 6-2 0-4-1-5-2l-6-3c-5-3-7-9-4-14zm-147-4c5-3 11-1 14 4s1 11-4 14l-5 3c-2 1-4 2-6 2-3 0-7-2-9-6-2-5-1-11 4-14zm107-18c3-5 10-7 14-4l6 3c5 3 7 9 4 14-2 3-5 5-9 5-2 0-3 0-5-1l-6-3c-5-3-6-9-4-14zm-69-4c5-3 12-2 15 3 2 5 1 12-4 15l-6 3c-1 1-3 1-5 1-3 0-7-2-9-5-3-5-1-11 4-14zm39-220L87 140l166 95 173-94zm0 150c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v6c0 6-5 11-11 11-5 0-10-5-10-11v-6c0-6 5-10 10-10zm0-45c6 0 11 4 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-6 5-10 10-10zm0-45c6 0 11 5 11 10v7c0 5-5 10-11 10-5 0-10-5-10-10v-7c0-5 5-10 10-10z" />
        </BaseIcon>
      }
    />
  </>
);
