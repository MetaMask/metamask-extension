import React from 'react';
import {
  ALIGN_ITEMS,
  DISPLAY,
  FLEX_DIRECTION,
  SIZES,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
import { BUTTON_ICON_SIZES } from './button-icon.constants';
import { ButtonIcon } from './button-icon';
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
  title: 'Components/ComponentLibrary/ButtonIcon',
  id: __filename,
  component: ButtonIcon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
    className: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    icon: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    loading: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(BUTTON_ICON_SIZES),
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
    // children: 'Button Icon',
  },
};

export const DefaultStory = (args) => (
  <ButtonIcon {...args} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
);

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box
    display={DISPLAY.FLEX}
    alignItems={ALIGN_ITEMS.BASELINE}
    gap={1}
    marginBottom={2}
  >
    <ButtonIcon {...args} size={SIZES.SM} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
    <ButtonIcon {...args} size={SIZES.MD} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
    <ButtonIcon {...args} size={SIZES.LG} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
  </Box>
);

export const As = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} gap={2}>
    <ButtonIcon {...args} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
    <ButtonIcon as="a" href="#" {...args} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
  </Box>
);

export const Disabled = (args) => (
  <ButtonIcon {...args} icon={ICON_NAMES.ADD_SQUARE_FILLED} />
);

Disabled.args = {
  disabled: true,
};
