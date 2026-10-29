import React from 'react';
import {
  FONT_WEIGHT,
  FONT_STYLE,
  TextAlign,
  TypographyVariant,
  OVERFLOW_WRAP,
  BackgroundColor,
  Color as ColorEnum,
  SEVERITIES,
} from '../../../helpers/constants/design-system';

import { BannerAlert } from '../../component-library/banner-alert';

import { ValidColors, ValidTags } from './typography';

import Typography from '.';

const sizeKnobOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/UI/Typography (deprecated)',
  component: Typography,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the `<Text />` component instead.',
      },
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
