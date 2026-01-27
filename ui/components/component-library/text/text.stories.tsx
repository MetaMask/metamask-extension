import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  BackgroundColor,
  BorderColor,
  FontWeight,
  FontStyle,
  FontFamily,
  TextColor,
  TextAlign,
  OverflowWrap,
  TextTransform,
  BlockSize,
  FlexDirection,
  TextVariant,
  Color,
} from '../../../helpers/constants/design-system';

import { Box } from '../box';

import { Text } from './text';
import { TextDirection } from './text.types';

export default {
  title: 'Components/ComponentLibrary/Text (deprecated)',
  component: Text,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
} as Meta<typeof Text>;

function renderBackgroundColor(color) {
  let bgColor;
  switch (color) {
    case Color.overlayInverse:
      bgColor = BackgroundColor.overlayDefault;
      break;
    case Color.primaryInverse:
      bgColor = BackgroundColor.primaryDefault;
      break;
    case Color.errorInverse:
      bgColor = BackgroundColor.errorDefault;
      break;
    case Color.warningInverse:
      bgColor = BackgroundColor.warningDefault;
      break;
    case Color.successInverse:
      bgColor = BackgroundColor.successDefault;
      break;
    case Color.infoInverse:
      bgColor = BackgroundColor.infoDefault;
      break;
    case Color.goerliInverse:
      bgColor = BackgroundColor.goerli;
      break;
    case Color.sepoliaInverse:
      bgColor = BackgroundColor.sepolia;
      break;
    case Color.lineaGoerliInverse:
      bgColor = BackgroundColor.lineaGoerli;
      break;
    case Color.lineaSepoliaInverse:
      bgColor = BackgroundColor.lineaSepolia;
      break;
    case Color.lineaMainnetInverse:
      bgColor = BackgroundColor.lineaMainnet;
      break;
    default:
      bgColor = null;
      break;
  }

  return bgColor;
}

const Template: StoryFn<typeof Text> = (args) => (
  <Text {...args}>{args.children}</Text>
);

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  children: 'The quick orange fox jumped over the lazy dog.',
};

DefaultStory.storyName = 'Default';
