import React from 'react';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import { ValidBackgroundColors, ValidBorderColors } from '../../ui/box';
import Box from '../../ui/box/box';

import README from './README.mdx';
import { AvatarBadge } from './avatar-badge';

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
  title: 'Components/ComponentLibrary/AvatarBadge',
  id: __filename,
  component: AvatarBadge,
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
    backgroundColor: {
      options: ValidBackgroundColors,
      control: 'select',
    },
    borderColor: {
      options: ValidBorderColors,
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
    backgroundColor: COLORS.BACKGROUND_ALTERNATIVE,
    borderColor: COLORS.BORDER_DEFAULT,
  },
};

export const DefaultStory = (args) => <AvatarBadge {...args}>B</AvatarBadge>;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarBadge {...args} marginBottom={2} size={SIZES.XS} />
    <AvatarBadge {...args} marginBottom={2} size={SIZES.SM} />
    <AvatarBadge {...args} marginBottom={2} size={SIZES.MD} />
    <AvatarBadge {...args} marginBottom={2} size={SIZES.LG} />
    <AvatarBadge {...args} marginBottom={2} size={SIZES.XL} />
  </Box>
);

export const Children = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarBadge {...args}>
      <img src="./images/eth_logo.svg" />
    </AvatarBadge>
    <AvatarBadge {...args}>
      <img width="100%" src="./images/arbitrum.svg" />
    </AvatarBadge>
    <AvatarBadge {...args}>
      <img width="100%" src="./images/avax-token.png" />
    </AvatarBadge>
    <AvatarBadge {...args}>A</AvatarBadge>
    <AvatarBadge
      {...args}
      backgroundColor={COLORS.INFO_MUTED}
      borderColor={COLORS.INFO_MUTED}
    >
      <i
        className="fa fa-user"
        style={{ color: 'var(--color-info-default)' }}
      />
    </AvatarBadge>
  </Box>
);

export const BackgroundAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarBadge {...args}>B</AvatarBadge>
    <AvatarBadge
      {...args}
      backgroundColor={COLORS.KOVAN}
      borderColor={COLORS.KOVAN}
    >
      K
    </AvatarBadge>
    <AvatarBadge
      {...args}
      backgroundColor={COLORS.RINKEBY}
      borderColor={COLORS.RINKEBY}
    >
      R
    </AvatarBadge>
    <AvatarBadge
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
    >
      G
    </AvatarBadge>
    <AvatarBadge
      {...args}
      backgroundColor={COLORS.ROPSTEN}
      borderColor={COLORS.ROPSTEN}
    >
      R
    </AvatarBadge>
  </Box>
);
