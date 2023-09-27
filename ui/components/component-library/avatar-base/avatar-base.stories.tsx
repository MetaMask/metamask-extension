import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import {
  AlignItems,
  Display,
  TextColor,
  BackgroundColor,
  BorderColor,
  IconColor,
} from '../../../helpers/constants/design-system';

import { AvatarBase, Icon, IconName, Box } from '..';
import { AvatarBaseSize } from './avatar-base.types';
import README from './README.mdx';

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

export const Size: StoryFn<typeof AvatarBase> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarBase {...args} size={AvatarBaseSize.Xs} />
    <AvatarBase {...args} size={AvatarBaseSize.Sm} />
    <AvatarBase {...args} size={AvatarBaseSize.Md} />
    <AvatarBase {...args} size={AvatarBaseSize.Lg} />
    <AvatarBase {...args} size={AvatarBaseSize.Xl} />
  </Box>
);

export const Children: StoryFn<typeof AvatarBase> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <AvatarBase {...args}>
      <img src="./images/eth_logo.png" />
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
      <Icon name={IconName.User} color={IconColor.infoDefault} />
    </AvatarBase>
  </Box>
);

export const ColorBackgroundColorAndBorderColor: StoryFn<typeof AvatarBase> = (
  args,
) => (
  <Box display={Display.Flex} gap={1}>
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
