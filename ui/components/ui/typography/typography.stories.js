import React from 'react';
import {
  FONT_WEIGHT,
  FONT_STYLE,
  TextAlign,
  TypographyVariant,
  OVERFLOW_WRAP,
  DISPLAY,
  BackgroundColor,
  Color as ColorEnum,
  TextColor,
  BorderColor,
  SEVERITIES,
} from '../../../helpers/constants/design-system';
import Box from '../box';

import { BannerAlert } from '../../component-library/banner-alert';

import { ValidColors, ValidTags } from './typography';

import README from './README.mdx';
import Typography from '.';

const sizeKnobOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/UI/Typography',

  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: Object.values(TypographyVariant),
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
      options: Object.values(TextAlign),
    },
    overflowWrap: {
      control: { type: 'select' },
      options: Object.values(OVERFLOW_WRAP),
    },
    as: {
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
    case ColorEnum.overlayInverse:
      bgColor = BackgroundColor.overlayDefault;
      break;
    case ColorEnum.primaryInverse:
      bgColor = BackgroundColor.primaryDefault;
      break;
    case ColorEnum.errorInverse:
      bgColor = BackgroundColor.errorDefault;
      break;
    case ColorEnum.warningInverse:
      bgColor = BackgroundColor.warningDefault;
      break;
    case ColorEnum.successInverse:
      bgColor = BackgroundColor.successDefault;
      break;
    case ColorEnum.infoInverse:
      bgColor = BackgroundColor.infoDefault;
      break;
    default:
      bgColor = null;
      break;
  }

  return bgColor;
}

export const DefaultStory = (args) => (
  <>
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
    <Typography
      boxProps={{ backgroundColor: renderBackgroundColor(args.color) }}
      {...args}
    >
      {args.children}
    </Typography>
  </>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  children: 'The quick orange fox jumped over the lazy dog.',
};

export const Variant = (args) => (
  <>
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
    {Object.values(TypographyVariant).map((variant) => (
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
      <BannerAlert
        severity={SEVERITIES.WARNING}
        title="Deprecated"
        description="<Typography/> has been deprecated in favor of the <Text /> component"
        actionButtonLabel="See details"
        actionButtonProps={{
          href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
        }}
      />
      {Object.values(ValidColors).map((color, index) => {
        if (index === LAST_VALID_COLORS_ARRAY_INDEX) {
          return (
            <React.Fragment key={color}>
              <Typography
                color={TextColor.textDefault}
                align={TextAlign.Center}
                boxProps={{
                  backgroundColor: BackgroundColor.warningMuted,
                  padding: 4,
                  borderColor: BorderColor.warningDefault,
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
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
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
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
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
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
    {Object.values(TextAlign).map((align) => (
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
  <>
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
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
  </>
);

export const As = (args) => (
  <>
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
    <Typography boxProps={{ display: DISPLAY.BLOCK }} marginBottom={4}>
      You can change the root element of the Typography component using the as
      prop. Inspect the below elements to see the underlying HTML elements
    </Typography>
    <Box gap={4}>
      {Object.values(ValidTags).map((as) => (
        <Typography
          {...args}
          as={as}
          key={as}
          boxProps={{
            backgroundColor: renderBackgroundColor(args.color),
            display: DISPLAY.BLOCK,
          }}
        >
          {as}
        </Typography>
      ))}
    </Box>
  </>
);

export const Margin = (args) => (
  <>
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
    <Typography {...args}>
      This Typography component has a margin of {args.margin * 4}px
    </Typography>
  </>
);

Margin.args = {
  margin: 4,
};

export const BoxPropsStory = (args) => (
  <>
    <BannerAlert
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="<Typography/> has been deprecated in favor of the <Text /> component"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/17670',
      }}
    />
    <Typography {...args}>This uses the boxProps prop</Typography>
  </>
);

BoxPropsStory.args = {
  color: TextColor.textDefault,
  boxProps: {
    backgroundColor: BackgroundColor.infoMuted,
    borderColor: BorderColor.infoDefault,
    padding: 4,
    borderRadius: 4,
  },
};

BoxPropsStory.storyName = 'BoxProps';
