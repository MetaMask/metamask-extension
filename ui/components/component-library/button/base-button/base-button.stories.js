import React from 'react';
import {
  BUTTON_SIZES,
  ALIGN_ITEMS,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';

import { BaseButton } from './base-button';
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
  title: 'Components/ComponentLibrary/Button/BaseButton',
  id: __filename,
  component: BaseButton,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(BUTTON_SIZES),
    },
    className: {
      control: 'text',
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
    size: BUTTON_SIZES.MD,
    children: 'Click Me',
  },
};

export const DefaultStory = (args) => (
  <>
    <BaseButton {...args} />
    {/* <BaseButton as="a" {...args} /> */}
  </>
);

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <BaseButton {...args} size={BUTTON_SIZES.XS} />
    <BaseButton {...args} size={BUTTON_SIZES.SM} />
    <BaseButton {...args} size={BUTTON_SIZES.MD} />
    <BaseButton {...args} size={BUTTON_SIZES.LG} />
  </Box>
);
