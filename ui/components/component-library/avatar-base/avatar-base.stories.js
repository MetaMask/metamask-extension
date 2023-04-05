import React from 'react';
import {
  AlignItems,
  DISPLAY,
  TextColor,
  BackgroundColor,
  BorderColor,
  Color,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { Icon, ICON_NAMES } from '../icon/deprecated';
import README from './README.mdx';
import { AvatarBase } from './avatar-base';
import { AVATAR_BASE_SIZES } from './avatar-base.constants';

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
  title: 'Components/ComponentLibrary/AvatarBase',

  component: AvatarBase,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AVATAR_BASE_SIZES),
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
      options: Object.values(DISPLAY),
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
    size: AVATAR_BASE_SIZES.MD,
    color: TextColor.textDefault,
    backgroundColor: BackgroundColor.backgroundAlternative,
    borderColor: BorderColor.borderDefault,
    children: 'B',
  },
};

export const DefaultStory = (args) => <AvatarBase {...args} />;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarBase {...args} size={AVATAR_BASE_SIZES.XS} />
    <AvatarBase {...args} size={AVATAR_BASE_SIZES.SM} />
    <AvatarBase {...args} size={AVATAR_BASE_SIZES.MD} />
    <AvatarBase {...args} size={AVATAR_BASE_SIZES.LG} />
    <AvatarBase {...args} size={AVATAR_BASE_SIZES.XL} />
  </Box>
);

export const Children = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarBase {...args}>
      <img src="./images/eth_logo.svg" />
    </AvatarBase>
    <AvatarBase {...args}>
      <img width="100%" src="./images/arbitrum.svg" />
    </AvatarBase>
    <AvatarBase {...args}>
      <img width="100%" src="./images/avax-token.png" />
    </AvatarBase>
    <AvatarBase {...args}>A</AvatarBase>
    <AvatarBase
      {...args}
      backgroundColor={BackgroundColor.infoMuted}
      borderColor={BorderColor.infoMuted}
    >
      <Icon name={ICON_NAMES.USER} color={Color.infoDefault} />
    </AvatarBase>
  </Box>
);

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarBase {...args}>B</AvatarBase>
    <AvatarBase
      {...args}
      backgroundColor={BackgroundColor.goerli}
      borderColor={BorderColor.goerli}
      color={TextColor.primaryInverse}
    >
      G
    </AvatarBase>
    <AvatarBase
      {...args}
      backgroundColor={BackgroundColor.sepolia}
      borderColor={BorderColor.sepolia}
      color={TextColor.primaryInverse}
    >
      S
    </AvatarBase>
  </Box>
);
