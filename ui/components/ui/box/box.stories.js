import React from 'react';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  BORDER_STYLE,
  COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  BACKGROUND_COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  SIZES,
  TEXT_ALIGN,
  FLEX_DIRECTION,
  FLEX_WRAP,
} from '../../../helpers/constants/design-system';

import Typography from '../typography';

import Box from './box';

import README from './README.mdx';

const sizeControlOptions = [
  undefined,
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
];
const marginSizeControlOptions = [...sizeControlOptions, 'auto'];

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
    children: {
      table: { category: 'children' },
    },
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
    gap: {
      control: 'select',
      options: sizeControlOptions,
      table: { category: 'display' },
    },
    backgroundColor: {
      options: Object.values(BACKGROUND_COLORS),
      control: 'select',
      table: {
        category: 'background',
      },
    },
    color: {
      options: Object.values(TEXT_COLORS),
      control: 'select',
      table: { category: 'color' },
    },
    borderStyle: {
      options: Object.values(BORDER_STYLE),
      control: 'select',
      defaultValue: BORDER_STYLE.DASHED,
      table: { category: 'border' },
    },
    borderWidth: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'border' },
    },
    borderColor: {
      options: Object.values(BORDER_COLORS),
      control: 'select',
      defaultValue: COLORS.BORDER_DEFAULT,
      table: { category: 'border' },
    },
    borderRadius: {
      options: Object.values(SIZES),
      control: 'select',
      table: { category: 'border' },
    },
    flexWrap: {
      options: Object.values(FLEX_WRAP),
      control: 'select',
      table: { category: 'display' },
    },
    flexDirection: {
      options: Object.values(FLEX_DIRECTION),
      control: 'select',
      table: { category: 'display' },
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
      table: { category: 'text' },
    },
    margin: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    padding: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingTop: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingRight: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingBottom: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingLeft: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    as: {
      control: 'select',
      options: ['div', 'ul', 'li', 'span', 'a', 'button'],
      table: { category: 'as (root html element)' },
    },
  },
};

export const DefaultStory = (args) => {
  const { items, size, ...rest } = args;
  const children = [];
  for (let $i = 0; $i < items; $i++) {
    children.push(
      <Box
        as="img"
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        borderColor={COLORS.BORDER_MUTED}
        key={$i}
        style={{ width: size, height: size }}
        src="./images/eth_logo.svg"
      />,
    );
  }
  return <Box {...rest}>{children}</Box>;
};

DefaultStory.storyName = 'Default';

export const Margin = (args) => {
  return (
    <Box borderColor={COLORS.BORDER_MUTED}>
      <Box
        {...args}
        margin={2}
        padding={4}
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        borderColor={COLORS.BORDER_MUTED}
      >
        Static margin
      </Box>
      <Box
        {...args}
        margin={[2, 4, 8, 12]}
        padding={[4]}
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        borderColor={COLORS.BORDER_MUTED}
      >
        Responsive margin changes based on breakpoint
      </Box>
    </Box>
  );
};

export const Padding = (args) => {
  return (
    <Box borderColor={COLORS.BORDER_MUTED}>
      <Box
        {...args}
        padding={4}
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        borderColor={COLORS.BORDER_MUTED}
      >
        Static padding
      </Box>
      <Box
        {...args}
        padding={[4, 8, 12]}
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        borderColor={COLORS.BORDER_MUTED}
      >
        Responsive padding changes based on breakpoint
      </Box>
    </Box>
  );
};

export const Color = (args) => {
  return (
    <>
      <Box {...args} padding={3} color={COLORS.TEXT_DEFAULT}>
        COLORS.TEXT_DEFAULT
      </Box>
      <Box {...args} padding={3} color={COLORS.TEXT_ALTERNATIVE}>
        COLORS.TEXT_ALTERNATIVE
      </Box>
      <Box {...args} padding={3} color={COLORS.TEXT_MUTED}>
        COLORS.TEXT_MUTED
      </Box>
      <Box {...args} padding={3} color={COLORS.PRIMARY_DEFAULT}>
        COLORS.PRIMARY_DEFAULT
      </Box>
      <Box
        {...args}
        padding={3}
        color={COLORS.PRIMARY_INVERSE}
        backgroundColor={COLORS.PRIMARY_DEFAULT}
      >
        COLORS.PRIMARY_INVERSE
      </Box>
      <Box {...args} padding={3} color={COLORS.ERROR_DEFAULT}>
        COLORS.ERROR_DEFAULT
      </Box>
      <Box
        {...args}
        padding={3}
        color={COLORS.ERROR_INVERSE}
        backgroundColor={COLORS.ERROR_DEFAULT}
      >
        COLORS.ERROR_INVERSE
      </Box>
      <Box {...args} padding={3} color={COLORS.SUCCESS_DEFAULT}>
        COLORS.SUCCESS_DEFAULT
      </Box>
      <Box
        {...args}
        padding={3}
        color={COLORS.SUCCESS_INVERSE}
        backgroundColor={COLORS.SUCCESS_DEFAULT}
        {...args}
      >
        COLORS.SUCCESS_INVERSE
      </Box>
      <Box {...args} padding={3} color={COLORS.WARNING_DEFAULT} {...args}>
        COLORS.WARNING_DEFAULT
      </Box>
      <Box
        {...args}
        padding={3}
        color={COLORS.WARNING_INVERSE}
        backgroundColor={COLORS.WARNING_DEFAULT}
        {...args}
      >
        COLORS.WARNING_INVERSE
      </Box>
      <Box {...args} padding={3} color={COLORS.INFO_DEFAULT} {...args}>
        COLORS.INFO_DEFAULT
      </Box>
      <Box
        {...args}
        padding={3}
        color={COLORS.INFO_INVERSE}
        backgroundColor={COLORS.INFO_DEFAULT}
        {...args}
      >
        COLORS.INFO_INVERSE
      </Box>
      <Box {...args} padding={3} color={COLORS.INHERIT} {...args}>
        COLORS.INHERIT
      </Box>
    </>
  );
};

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
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.BORDER_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.BACKGROUND_DEFAULT}
        borderColor={COLORS.BORDER_MUTED}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>COLORS.BORDER_MUTED</Typography>
      </Box>
      <Box
        padding={3}
        borderColor={COLORS.PRIMARY_DEFAULT}
        borderWidth={2}
        marginBottom={1}
        backgroundColor={COLORS.PRIMARY_MUTED}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.PRIMARY_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.ERROR_MUTED}
        borderColor={COLORS.ERROR_DEFAULT}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.ERROR_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.SUCCESS_MUTED}
        borderColor={COLORS.SUCCESS_DEFAULT}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.SUCCESS_DEFAULT
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={COLORS.WARNING_MUTED}
        borderColor={COLORS.WARNING_DEFAULT}
        borderWidth={2}
      >
        <Typography color={COLORS.TEXT_DEFAULT}>
          COLORS.WARNING_DEFAULT
        </Typography>
      </Box>
    </>
  );
};

export const ResponsiveProps = () => {
  return (
    <>
      <Typography boxProps={{ marginBottom: 4 }}>
        Responsive props example. Stacks vertically on small screens and aligns
        horizontally on large screens. Padding is also adjusted between small
        and large screens
      </Typography>
      <Box
        marginTop="auto"
        marginBottom={[0]}
        padding={[2, 4]}
        gap={[2, 4]}
        display={['flex', null, null, 'none']}
        flexDirection={['column', 'row']}
        borderColor={COLORS.BORDER_DEFAULT}
      >
        <Box
          padding={[4, 8]}
          backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
          borderColor={COLORS.BORDER_MUTED}
        >
          responsive
        </Box>
        <Box
          padding={[4, 8]}
          backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
          borderColor={COLORS.BORDER_MUTED}
        >
          props
        </Box>
        <Box
          padding={[4, 8]}
          backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
          borderColor={COLORS.BORDER_MUTED}
        >
          example
        </Box>
      </Box>
    </>
  );
};

export const As = (args) => {
  return (
    <>
      <Typography marginBottom={4}>
        You can change the root element of the Box component using the as prop.
        Inspect the below elements to see the underlying HTML elements
      </Typography>
      <Box {...args}>div(default)</Box>
      <Box as="ul">ul</Box>
      <Box as="li">li</Box>
      <Box as="button">button</Box>
      <Box as="header">header</Box>
    </>
  );
};
