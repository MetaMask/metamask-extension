import React from 'react';
import {
  COLORS,
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_ALIGN,
  TYPOGRAPHY,
  OVERFLOW_WRAP,
} from '../../../helpers/constants/design-system';

import { ValidColors, ValidTags } from './typography';

import README from './README.mdx';
import Typography from '.';

const sizeKnobOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/UI/Typography',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: Object.values(TYPOGRAPHY),
    },
    color: {
      control: { type: 'select' },
      options: ValidColors,
    },
    fontWeight: {
      control: { type: 'select' },
      options: Object.values(FONT_WEIGHT),
    },
    fontStyle: {
      control: { type: 'select' },
      options: Object.values(FONT_STYLE),
    },
    align: {
      control: { type: 'select' },
      options: Object.values(TEXT_ALIGN),
    },
    overflowWrap: {
      control: { type: 'select' },
      options: Object.values(OVERFLOW_WRAP),
    },
    tag: {
      control: { type: 'select' },
      options: ValidTags,
    },
    margin: {
      options: marginSizeKnobOptions,
      control: 'select',
    },
    boxProps: {
      control: 'object',
    },
    className: {
      control: { type: 'text' },
    },
    children: {
      control: { type: 'text' },
    },
  },
};

function renderBackgroundColor(color) {
  let bgColor;
  switch (color) {
    case COLORS.OVERLAY_INVERSE:
      bgColor = COLORS.OVERLAY_DEFAULT;
      break;
    case COLORS.PRIMARY_INVERSE:
      bgColor = COLORS.PRIMARY_DEFAULT;
      break;
    case COLORS.SECONDARY_INVERSE:
      bgColor = COLORS.SECONDARY_DEFAULT;
      break;
    case COLORS.ERROR_INVERSE:
      bgColor = COLORS.ERROR_DEFAULT;
      break;
    case COLORS.WARNING_INVERSE:
      bgColor = COLORS.WARNING_DEFAULT;
      break;
    case COLORS.SUCCESS_INVERSE:
      bgColor = COLORS.SUCCESS_DEFAULT;
      break;
    case COLORS.INFO_INVERSE:
      bgColor = COLORS.INFO_DEFAULT;
      break;
    default:
      bgColor = null;
      break;
  }

  return bgColor;
}

export const DefaultStory = (args) => (
  <Typography
    boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
    {...args}
  >
    {args.children}
  </Typography>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  children: 'The quick orange fox jumped over the lazy dog.',
};

export const Variant = (args) => (
  <>
    {Object.values(TYPOGRAPHY).map((variant) => (
      <Typography
        boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
        {...args}
        variant={variant}
        key={variant}
      >
        {args.children || variant}
      </Typography>
    ))}
  </>
);

export const Color = (args) => {
  // Index of last valid color in ValidColors array
  const LAST_VALID_COLORS_ARRAY_INDEX = 16;
  return (
    <>
      {Object.values(ValidColors).map((color, index) => {
        if (index === LAST_VALID_COLORS_ARRAY_INDEX) {
          return (
            <React.Fragment key={color}>
              <Typography
                color={COLORS.TEXT_DEFAULT}
                align={TEXT_ALIGN.CENTER}
                boxProps={{
                  backgroundColor: COLORS.WARNING_MUTED,
                  padding: 4,
                  borderColor: COLORS.WARNING_DEFAULT,
                }}
              >
                DEPRECATED COLORS - DO NOT USE
              </Typography>
              <Typography
                {...args}
                boxProps={{ backgroundColor: renderBackgroundColor(color) }}
                color={color}
              >
                <strike>{color}</strike>
              </Typography>
            </React.Fragment>
          );
        } else if (index >= LAST_VALID_COLORS_ARRAY_INDEX) {
          return (
            <Typography
              {...args}
              boxProps={{ backgroundColor: renderBackgroundColor(color) }}
              color={color}
              key={color}
            >
              <strike>{color}</strike>
            </Typography>
          );
        }
        return (
          <Typography
            {...args}
            boxProps={{ backgroundColor: renderBackgroundColor(color) }}
            color={color}
            key={color}
          >
            {color}
          </Typography>
        );
      })}
    </>
  );
};

export const FontWeight = (args) => (
  <>
    {Object.values(FONT_WEIGHT).map((weight) => (
      <Typography
        boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
        {...args}
        fontWeight={weight}
        key={weight}
      >
        {weight}
      </Typography>
    ))}
  </>
);

export const FontStyle = (args) => (
  <>
    {Object.values(FONT_STYLE).map((style) => (
      <Typography
        boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
        {...args}
        fontStyle={style}
        key={style}
      >
        {style}
      </Typography>
    ))}
  </>
);

export const Align = (args) => (
  <>
    {Object.values(TEXT_ALIGN).map((align) => (
      <Typography
        boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
        {...args}
        align={align}
        key={align}
      >
        {align}
      </Typography>
    ))}
  </>
);

export const OverflowWrap = (args) => (
  <div
    style={{
      width: 250,
      border: '1px solid var(--color-error-default)',
      display: 'block',
    }}
  >
    <Typography {...args} overflowWrap={OVERFLOW_WRAP.NORMAL}>
      {OVERFLOW_WRAP.NORMAL}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Typography>
    <Typography {...args} overflowWrap={OVERFLOW_WRAP.BREAK_WORD}>
      {OVERFLOW_WRAP.BREAK_WORD}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Typography>
  </div>
);

export const Tag = (args) => (
  <>
    {Object.values(ValidTags).map((tag) => (
      <Typography
        boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
        {...args}
        tag={tag}
        key={tag}
      >
        {tag}
      </Typography>
    ))}
  </>
);

export const Margin = (args) => (
  <Typography {...args}>
    This Typography component has a margin of {args.margin * 4}px
  </Typography>
);

Margin.args = {
  margin: 4,
};

export const BoxProps = (args) => (
  <Typography {...args}>This uses the boxProps prop</Typography>
);

BoxProps.args = {
  color: COLORS.TEXT_DEFAULT,
  boxProps: {
    backgroundColor: COLORS.INFO_MUTED,
    borderColor: COLORS.INFO_DEFAULT,
    padding: 4,
    borderRadius: 4,
  },
};
