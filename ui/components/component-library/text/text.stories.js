import React from 'react';
import {
  DISPLAY,
  BackgroundColor,
  BorderColor,
  FONT_WEIGHT,
  FONT_STYLE,
  TextColor,
  TEXT_ALIGN,
  OVERFLOW_WRAP,
  TEXT_TRANSFORM,
  FRACTIONS,
  FLEX_DIRECTION,
  TextVariant,
  Color,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import { ValidTags, Text } from './text';
import { TEXT_DIRECTIONS } from './text.constants';

import README from './README.mdx';

const sizeKnobOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/ComponentLibrary/Text',

  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: Object.values(TextVariant),
    },
    color: {
      control: { type: 'select' },
      options: Object.values(TextColor),
    },
    fontWeight: {
      control: { type: 'select' },
      options: Object.values(FONT_WEIGHT),
    },
    fontStyle: {
      control: { type: 'select' },
      options: Object.values(FONT_STYLE),
    },
    textTransform: {
      control: { type: 'select' },
      options: Object.values(TEXT_TRANSFORM),
    },
    align: {
      control: { type: 'select' },
      options: Object.values(TEXT_ALIGN),
    },
    overflowWrap: {
      control: { type: 'select' },
      options: Object.values(OVERFLOW_WRAP),
    },
    ellipsis: {
      control: { type: 'boolean' },
    },
    as: {
      control: { type: 'select' },
      options: ValidTags,
    },
    textDirection: {
      control: { type: 'select' },
      options: Object.values(TEXT_DIRECTIONS),
    },
    className: {
      control: { type: 'text' },
    },
    children: {
      control: { type: 'text' },
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      table: { category: 'box props' },
    },
    backgroundColor: {
      options: Object.values(BackgroundColor),
      control: 'select',
      table: { category: 'box props' },
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
      table: { category: 'box props' },
    },
    padding: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    margin: {
      options: marginSizeKnobOptions,
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
};

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

export const DefaultStory = (args) => <Text {...args}>{args.children}</Text>;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  children: 'The quick orange fox jumped over the lazy dog.',
};

export const Variant = (args) => (
  <>
    {Object.values(TextVariant).map((variant) => (
      <Text {...args} variant={variant} key={variant}>
        {args.children || variant}
      </Text>
    ))}
  </>
);

export const ColorStory = (args) => {
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

export const FontWeight = (args) => (
  <>
    {Object.values(FONT_WEIGHT).map((weight) => (
      <Text {...args} fontWeight={weight} key={weight}>
        {weight}
      </Text>
    ))}
  </>
);

export const FontStyle = (args) => (
  <>
    {Object.values(FONT_STYLE).map((style) => (
      <Text {...args} fontStyle={style} key={style}>
        {style}
      </Text>
    ))}
  </>
);

export const TextTransform = (args) => (
  <>
    {Object.values(TEXT_TRANSFORM).map((transform) => (
      <Text {...args} textTransform={transform} key={transform}>
        {transform}
      </Text>
    ))}
  </>
);

export const TextAlign = (args) => (
  <>
    {Object.values(TEXT_ALIGN).map((align) => (
      <Text {...args} textAlign={align} key={align}>
        {align}
      </Text>
    ))}
  </>
);

export const OverflowWrap = (args) => (
  <Box
    borderColor={BorderColor.warningDefault}
    display={DISPLAY.BLOCK}
    width={FRACTIONS.ONE_THIRD}
  >
    <Text {...args} overflowWrap={OVERFLOW_WRAP.NORMAL}>
      {OVERFLOW_WRAP.NORMAL}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
    <Text {...args} overflowWrap={OVERFLOW_WRAP.BREAK_WORD}>
      {OVERFLOW_WRAP.BREAK_WORD}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
  </Box>
);

export const Ellipsis = (args) => (
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

export const As = (args) => (
  <>
    {ValidTags.map((tag) => {
      if (tag === 'input') {
        return <Text key={tag} {...args} as={tag} placeholder={tag} />;
      }
      return (
        <div key={tag}>
          <Text {...args} as={tag}>
            {tag}
          </Text>
        </div>
      );
    })}
  </>
);

export const TextDirection = (args) => (
  <Box
    style={{ maxWidth: 300 }}
    display={DISPLAY.FLEX}
    flexDirection={FLEX_DIRECTION.COLUMN}
    gap={4}
  >
    <Text {...args} textDirection={TEXT_DIRECTIONS.LEFT_TO_RIGHT}>
      This is left to right (ltr) for English and most languages
    </Text>
    <Text {...args} textDirection={TEXT_DIRECTIONS.RIGHT_TO_LEFT}>
      This is right to left (rtl) for use with other laguanges such as Arabic.
      This Enlgish example is incorrect usage.
    </Text>
    <Text {...args} textDirection={TEXT_DIRECTIONS.AUTO}>
      Let the user agent decide with the auto option
    </Text>
  </Box>
);
