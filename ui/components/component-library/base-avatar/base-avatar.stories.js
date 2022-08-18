import React from 'react';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  SIZES,
  TEXT_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import README from './README.mdx';
import { BaseAvatar } from './base-avatar';

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
  title: 'Components/ComponentLibrary/BaseAvatar',
  id: __filename,
  component: BaseAvatar,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    color: {
      options: Object.values(TEXT_COLORS),
      control: 'select',
    },
    backgroundColor: {
      options: Object.values(BACKGROUND_COLORS),
      control: 'select',
    },
    borderColor: {
      options: Object.values(BORDER_COLORS),
      control: 'select',
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      defaultValue: DISPLAY.FLEX,
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
    size: SIZES.MD,
    color: COLORS.TEXT_DEFAULT,
    backgroundColor: COLORS.BACKGROUND_ALTERNATIVE,
    borderColor: COLORS.BORDER_DEFAULT,
  },
};

export const DefaultStory = (args) => <BaseAvatar {...args}>B</BaseAvatar>;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <BaseAvatar {...args} size={SIZES.XS} />
    <BaseAvatar {...args} size={SIZES.SM} />
    <BaseAvatar {...args} size={SIZES.MD} />
    <BaseAvatar {...args} size={SIZES.LG} />
    <BaseAvatar {...args} size={SIZES.XL} />
  </Box>
);

export const Children = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <BaseAvatar {...args}>
      <img src="./images/eth_logo.svg" />
    </BaseAvatar>
    <BaseAvatar {...args}>
      <img width="100%" src="./images/arbitrum.svg" />
    </BaseAvatar>
    <BaseAvatar {...args}>
      <img width="100%" src="./images/avax-token.png" />
    </BaseAvatar>
    <BaseAvatar {...args}>A</BaseAvatar>
    <BaseAvatar
      {...args}
      backgroundColor={COLORS.INFO_MUTED}
      borderColor={COLORS.INFO_MUTED}
    >
      <i
        className="fa fa-user"
        style={{ color: 'var(--color-info-default)' }}
      />
    </BaseAvatar>
  </Box>
);

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <BaseAvatar {...args}>B</BaseAvatar>
    <BaseAvatar
      {...args}
      backgroundColor={COLORS.KOVAN}
      borderColor={COLORS.KOVAN}
      color={COLORS.PRIMARY_INVERSE} // TO DO: Update once test network colors have been added to design tokens
    >
      K
    </BaseAvatar>
    <BaseAvatar
      {...args}
      backgroundColor={COLORS.RINKEBY}
      borderColor={COLORS.RINKEBY}
    >
      R
    </BaseAvatar>
    <BaseAvatar
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      color={COLORS.PRIMARY_INVERSE} // TO DO: Update once test network colors have been added to design tokens
    >
      G
    </BaseAvatar>
    <BaseAvatar
      {...args}
      backgroundColor={COLORS.ROPSTEN}
      borderColor={COLORS.ROPSTEN}
      color={COLORS.PRIMARY_INVERSE} // TO DO: Update once test network colors have been added to design tokens
    >
      R
    </BaseAvatar>
  </Box>
);
