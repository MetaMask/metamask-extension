import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  BackgroundColor,
  BorderColor,
  FontWeight,
  FontStyle,
  TextColor,
  TextAlign,
  OverflowWrap,
  TextTransform,
  BlockSize,
  FlexDirection,
  TextVariant,
  Color,
} from '../../../helpers/constants/design-system';

import { Box } from '..';

import README from './README.mdx';
import { Text } from './text';
import { TextDirection } from './text.types';

export default {
  title: 'Components/ComponentLibrary/Text',
  component: Text,
  parameters: {
    docs: {
      page: README,
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

export const Variant = (args) => (
  <>
    {Object.values(TextVariant).map((variant) => (
      <Text {...args} variant={variant} key={variant}>
        {args.children || variant}
      </Text>
    ))}
  </>
);

export const ColorStory: StoryFn<typeof Text> = (args) => {
  // Index of last valid color in TextColor array
  return (
    <>
      {Object.values(TextColor).map((color) => {
        return (
          <Text
            {...args}
            backgroundColor={renderBackgroundColor(color)}
            color={color}
            key={color}
          >
            {color}
          </Text>
        );
      })}
    </>
  );
};
ColorStory.storyName = 'Color';

export const FontWeightStory: StoryFn<typeof Text> = (args) => (
  <>
    {Object.values(FontWeight).map((weight) => (
      <Text {...args} fontWeight={weight} key={weight}>
        {weight}
      </Text>
    ))}
  </>
);

FontWeightStory.storyName = 'Font Weight';

export const FontStyleStory: StoryFn<typeof Text> = (args) => (
  <>
    {Object.values(FontStyle).map((style) => (
      <Text {...args} fontStyle={style} key={style}>
        {style}
      </Text>
    ))}
  </>
);

FontStyleStory.storyName = 'Font Style';

export const TextTransformStory: StoryFn<typeof Text> = (args) => (
  <>
    {Object.values(TextTransform).map((transform) => (
      <Text {...args} textTransform={transform} key={transform}>
        {transform}
      </Text>
    ))}
  </>
);

TextTransformStory.storyName = 'Text Transform';

export const TextAlignStory: StoryFn<typeof Text> = (args) => (
  <>
    {Object.values(TextAlign).map((align) => (
      <Text {...args} textAlign={align} key={align}>
        {align}
      </Text>
    ))}
  </>
);

TextAlignStory.storyName = 'Text Align';

export const OverflowWrapStory: StoryFn<typeof Text> = (args) => (
  <Box
    borderColor={BorderColor.warningDefault}
    display={Display.Block}
    style={{ width: 200 }}
  >
    <Text {...args} overflowWrap={OverflowWrap.Normal}>
      {OverflowWrap.Normal}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
    <Text {...args} overflowWrap={OverflowWrap.BreakWord}>
      {OverflowWrap.BreakWord}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
  </Box>
);

OverflowWrapStory.storyName = 'Overflow Wrap';

export const Ellipsis: StoryFn<typeof Text> = (args) => (
  <Box
    borderColor={BorderColor.primaryDefault}
    display={Display.Block}
    width={BlockSize.OneThird}
  >
    <Text {...args} ellipsis>
      Ellipsis: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
    <Text {...args}>
      No Ellipsis: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
  </Box>
);

export const As: StoryFn<typeof Text> = (args) => (
  <>
    <Text {...args} as="dd">
      dd
    </Text>
    <Text {...args} as="div">
      div
    </Text>
    <Text {...args} as="dt">
      dt
    </Text>
    <Text {...args} as="em">
      em
    </Text>
    <Text {...args} as="h1">
      h1
    </Text>
    <Text {...args} as="h2">
      h2
    </Text>
    <Text {...args} as="h3">
      h3
    </Text>
    <Text {...args} as="h4">
      h4
    </Text>
    <Text {...args} as="h5">
      h5
    </Text>
    <Text {...args} as="h6">
      h6
    </Text>
    <Text {...args} as="li">
      li
    </Text>
    <Text {...args} as="p">
      p
    </Text>
    <Text {...args} display={Display.Block} as="span">
      span
    </Text>
    <Text {...args} display={Display.Block} as="strong">
      strong
    </Text>
    <Text {...args} as="ul">
      ul
    </Text>
    <Text {...args} as="label">
      label
    </Text>
    <Text {...args} as="header">
      header
    </Text>
    <Text {...args} as="input" placeholder="input" />
  </>
);

export const TextDirectionStory: StoryFn<typeof Text> = (args) => (
  <Box
    style={{ maxWidth: 300 }}
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    gap={4}
  >
    <Text {...args} textDirection={TextDirection.LeftToRight}>
      This is left to right (ltr) for English and most languages
    </Text>
    <Text {...args} textDirection={TextDirection.RightToLeft}>
      This is right to left (rtl) for use with other languages such as Arabic.
      This English example is incorrect usage.
    </Text>
    <Text {...args} textDirection={TextDirection.Auto}>
      Let the user agent decide with the auto option
    </Text>
  </Box>
);

export const Strong: StoryFn<typeof Text> = (args) => (
  <>
    <Text {...args} as="strong">
      Text as="strong" tag
    </Text>
    <Text {...args}>
      This is a <strong>strong tag</strong> as a child inside of Text
    </Text>
  </>
);
