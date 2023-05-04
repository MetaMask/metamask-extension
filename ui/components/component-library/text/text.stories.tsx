import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  DISPLAY,
  BackgroundColor,
  BorderColor,
  FontWeight,
  FontStyle,
  TextColor,
  TextAlign,
  OverflowWrap,
  TextTransform,
  FRACTIONS,
  FLEX_DIRECTION,
  TextVariant,
  Color,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import README from './README.mdx';
import { Text } from './text';
import { ValidTag, TextDirection } from './text.types';

export default {
  title: 'Components/ComponentLibrary/Text',
  component: Text,

  parameters: {
    docs: {
      page: README,
    },
  },
} as ComponentMeta<typeof Text>;

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
    case Color.lineaTestnetInverse:
      bgColor = BackgroundColor.lineaTestnet;
      break;
    default:
      bgColor = null;
      break;
  }

  return bgColor;
}

const Template: ComponentStory<typeof Text> = (args) => (
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

export const ColorStory: ComponentStory<typeof Text> = (args) => {
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

export const FontWeightStory: ComponentStory<typeof Text> = (args) => (
  <>
    {Object.values(FontWeight).map((weight) => (
      <Text {...args} fontWeight={weight} key={weight}>
        {weight}
      </Text>
    ))}
  </>
);

FontWeightStory.storyName = 'Font Weight';

export const FontStyleStory: ComponentStory<typeof Text> = (args) => (
  <>
    {Object.values(FontStyle).map((style) => (
      <Text {...args} fontStyle={style} key={style}>
        {style}
      </Text>
    ))}
  </>
);

FontStyleStory.storyName = 'Font Style';

export const TextTransformStory: ComponentStory<typeof Text> = (args) => (
  <>
    {Object.values(TextTransform).map((transform) => (
      <Text {...args} textTransform={transform} key={transform}>
        {transform}
      </Text>
    ))}
  </>
);

TextTransformStory.storyName = 'Text Transform';

export const TextAlignStory: ComponentStory<typeof Text> = (args) => (
  <>
    {Object.values(TextAlign).map((align) => (
      <Text {...args} textAlign={align} key={align}>
        {align}
      </Text>
    ))}
  </>
);

TextAlignStory.storyName = 'Text Align';

export const OverflowWrapStory: ComponentStory<typeof Text> = (args) => (
  <Box
    borderColor={BorderColor.warningDefault}
    display={DISPLAY.BLOCK}
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

export const Ellipsis: ComponentStory<typeof Text> = (args) => (
  <Box
    borderColor={BorderColor.primaryDefault}
    display={DISPLAY.BLOCK}
    width={FRACTIONS.ONE_THIRD}
  >
    <Text {...args} ellipsis>
      Ellipsis: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
    <Text {...args}>
      No Ellipsis: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
  </Box>
);

export const As: ComponentStory<typeof Text> = (args) => (
  <>
    {Object.keys(ValidTag).map((tag) => {
      if (ValidTag[tag] === ValidTag.Input) {
        return (
          <Text
            key={ValidTag[tag]}
            {...args}
            as={ValidTag[tag]}
            placeholder={ValidTag[tag]}
          />
        );
      }
      return (
        <div key={ValidTag[tag]}>
          <Text {...args} as={ValidTag[tag]}>
            {ValidTag[tag]}
          </Text>
        </div>
      );
    })}
  </>
);

export const TextDirectionStory: ComponentStory<typeof Text> = (args) => (
  <Box
    style={{ maxWidth: 300 }}
    display={DISPLAY.FLEX}
    flexDirection={FLEX_DIRECTION.COLUMN}
    gap={4}
  >
    <Text {...args} textDirection={TextDirection.LeftToRight}>
      This is left to right (ltr) for English and most languages
    </Text>
    <Text {...args} textDirection={TextDirection.RightToLeft}>
      This is right to left (rtl) for use with other laguanges such as Arabic.
      This Enlgish example is incorrect usage.
    </Text>
    <Text {...args} textDirection={TextDirection.Auto}>
      Let the user agent decide with the auto option
    </Text>
  </Box>
);

export const Strong: ComponentStory<typeof Text> = (args) => (
  <>
    <Text {...args} as="strong">
      This is an as="strong" demo.
    </Text>
    <Text {...args}>
      This is a <strong>strong element</strong> demo.
    </Text>
  </>
);
