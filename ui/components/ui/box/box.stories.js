import React from 'react';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  BORDER_STYLE,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

import Typography from '../typography';
import Box from './box';

import README from './README.mdx';

const sizeKnobOptions = [undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/UI/Box',
  id: __filename,
  component: Box,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 50, max: 500, step: 10 },
      table: { category: 'children' },
      defaultValue: 100,
    },
    items: {
      control: 'number',
      table: { category: 'children' },
      defaultValue: 1,
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      defaultValue: DISPLAY.BLOCK,
      table: { category: 'display' },
    },
    width: {
      options: Object.values(BLOCK_SIZES),
      control: 'select',
      defaultValue: BLOCK_SIZES.HALF,
      table: { category: 'display' },
    },
    height: {
      options: Object.values(BLOCK_SIZES),
      control: 'select',
      defaultValue: BLOCK_SIZES.HALF,
      table: { category: 'display' },
    },
    backgroundColor: {
      options: Object.values(COLORS),
      control: 'select',
      table: {
        category: 'background',
      },
    },
    borderColor: {
      options: Object.values(COLORS),
      control: 'select',
      defaultValue: COLORS.BORDER_DEFAULT,
      table: { category: 'border' },
    },
    justifyContent: {
      options: Object.values(JUSTIFY_CONTENT),
      control: 'select',
      defaultValue: JUSTIFY_CONTENT.FLEX_START,
      table: { category: 'display' },
    },
    alignItems: {
      options: Object.values(ALIGN_ITEMS),
      control: 'select',
      defaultValue: ALIGN_ITEMS.FLEX_START,
      table: { category: 'display' },
    },
    textAlign: {
      options: Object.values(TEXT_ALIGN),
      control: 'select',
      defaultValue: TEXT_ALIGN.LEFT,
      table: { category: 'left' },
    },
    margin: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginTop: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginRight: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginBottom: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginLeft: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    padding: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingTop: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingRight: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingBottom: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingLeft: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    borderStyle: {
      options: Object.values(BORDER_STYLE),
      control: 'select',
      defaultValue: BORDER_STYLE.DASHED,
      table: { category: 'border' },
    },
    borderWidth: {
      options: sizeKnobOptions,
      control: 'number',
      defaultValue: 1,
      table: { category: 'border' },
    },
  },
};

export const DefaultStory = (args) => {
  const { items, size, ...rest } = args;
  const children = [];
  for (let $i = 0; $i < items; $i++) {
    children.push(
      <img width={size} height={size} src="./images/eth_logo.svg" />,
    );
  }
  return <Box {...rest}>{children}</Box>;
};

DefaultStory.storyName = 'Default';

export const BackgroundColor = () => {
  return (
    <>
      <Box padding={3} backgroundColor={COLORS.BACKGROUND_DEFAULT}>
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.BACKGROUND_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}>
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.BACKGROUND_ALTERNATIVE
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.OVERLAY_DEFAULT}>
        <Typography color={COLORS.OVERLAY_INVERSE}>
          COLORS.OVERLAY_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.PRIMARY_DEFAULT}>
        <Typography color={COLORS.PRIMARY_INVERSE}>
          COLORS.PRIMARY_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.PRIMARY_MUTED}>
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.PRIMARY_MUTED
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.SECONDARY_DEFAULT}>
        <Typography color={COLORS.SECONDARY_INVERSE}>
          COLORS.SECONDARY_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.SECONDARY_MUTED}>
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.SECONDARY_MUTED
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.ERROR_DEFAULT}>
        <Typography color={COLORS.ERROR_INVERSE}>
          COLORS.ERROR_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.ERROR_MUTED}>
        <Typography color={COLORS.TEXT_DEFAULT}>COLORS.ERROR_MUTED</Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.SUCCESS_DEFAULT}>
        <Typography color={COLORS.SUCCESS_INVERSE}>
          COLORS.SUCCESS_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.SUCCESS_MUTED}>
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.SUCCESS_MUTED
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.WARNING_DEFAULT}>
        <Typography color={COLORS.WARNING_INVERSE}>
          COLORS.WARNING_DEFAULT
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={COLORS.WARNING_MUTED}>
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.WARNING_MUTED
        </Typography>
      </Box>
    </>
  );
};

export const BorderColor = () => {
  return (
    <>
      <Box
        padding={3}
        backgroundColor={COLORS.BACKGROUND_DEFAULT}
        borderColor={COLORS.BORDER_DEFAULT}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.BORDER_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.BACKGROUND_DEFAULT}
        borderColor={COLORS.BORDER_MUTED}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>COLORS.BORDER_MUTED</Typography>
      </Box>
      <Box
        padding={3}
        borderColor={COLORS.PRIMARY_DEFAULT}
        backgroundColor={COLORS.PRIMARY_MUTED}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.PRIMARY_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.SECONDARY_MUTED}
        borderColor={COLORS.SECONDARY_DEFAULT}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.SECONDARY_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.ERROR_MUTED}
        borderColor={COLORS.ERROR_DEFAULT}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.ERROR_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.SUCCESS_MUTED}
        borderColor={COLORS.SUCCESS_DEFAULT}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.SUCCESS_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.WARNING_MUTED}
        borderColor={COLORS.WARNING_DEFAULT}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.WARNING_DEFAULT
        </Typography>
      </Box>
    </>
  );
};
