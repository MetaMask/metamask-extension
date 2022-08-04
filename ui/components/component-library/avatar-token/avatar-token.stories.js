import React from 'react';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import { ValidBackgroundColors, ValidBorderColors } from '../../ui/box';
import { BaseAvatar } from '../base-avatar';

import { AvatarToken } from './avatar-token';

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
  title: 'Components/ComponentLibrary/AvatarToken',
  id: __filename,
  component: AvatarToken,
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
      table: { category: 'BaseAvatar props' },
    },
    marginTop: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'BaseAvatar props' },
    },
    marginRight: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'BaseAvatar props' },
    },
    marginBottom: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'BaseAvatar props' },
    },
    marginLeft: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'BaseAvatar props' },
    },
  },
  args: {
    size: SIZES.MD,
    backgroundColor: COLORS.BACKGROUND_ALTERNATIVE,
    borderColor: COLORS.BORDER_DEFAULT,
  },
};

export const DefaultStory = (args) => <AvatarToken {...args}>B</AvatarToken>;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <BaseAvatar display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarToken {...args} marginBottom={2} size={SIZES.XS} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.SM} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.MD} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.LG} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.XL} />
  </BaseAvatar>
);

export const Children = (args) => (
  <BaseAvatar display={DISPLAY.FLEX} gap={1}>
    <AvatarToken {...args}>
      <img src="./images/eth_logo.svg" />
    </AvatarToken>
    <AvatarToken {...args}>
      <img width="100%" src="./images/arbitrum.svg" />
    </AvatarToken>
    <AvatarToken {...args}>
      <img width="100%" src="./images/avax-token.png" />
    </AvatarToken>
    <AvatarToken {...args}>A</AvatarToken>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.INFO_MUTED}
      borderColor={COLORS.INFO_MUTED}
    >
      <i
        className="fa fa-user"
        style={{ color: 'var(--color-info-default)' }}
      />
    </AvatarToken>
  </BaseAvatar>
);

export const BackgroundAndBorderColor = (args) => (
  <BaseAvatar display={DISPLAY.FLEX} gap={1}>
    <AvatarToken {...args}>B</AvatarToken>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.KOVAN}
      borderColor={COLORS.KOVAN}
    >
      K
    </AvatarToken>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.RINKEBY}
      borderColor={COLORS.RINKEBY}
    >
      R
    </AvatarToken>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
    >
      G
    </AvatarToken>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.ROPSTEN}
      borderColor={COLORS.ROPSTEN}
    >
      R
    </AvatarToken>
  </BaseAvatar>
);
