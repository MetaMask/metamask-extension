import React from 'react';
import {
  BLOCK_SIZES,
  BorderStyle,
  BorderRadius,
  TextColor,
  BorderColor,
  BackgroundColor,
  DISPLAY,
  AlignItems,
  JustifyContent,
  TEXT_ALIGN,
  FLEX_DIRECTION,
  FLEX_WRAP,
  Color,
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
    },
    items: {
      control: 'number',
      table: { category: 'children' },
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      table: { category: 'display' },
    },
    width: {
      options: Object.values(BLOCK_SIZES),
      control: 'multi-select',
      table: { category: 'display' },
    },
    height: {
      options: Object.values(BLOCK_SIZES),
      control: 'select',
      table: { category: 'display' },
    },
    gap: {
      control: 'select',
      options: sizeControlOptions,
      table: { category: 'display' },
    },
    backgroundColor: {
      options: Object.values(BackgroundColor),
      control: 'select',
      table: {
        category: 'background',
      },
    },
    color: {
      options: Object.values(TextColor),
      control: 'select',
      table: { category: 'color' },
    },
    borderStyle: {
      options: Object.values(BorderStyle),
      control: 'select',
      table: { category: 'border' },
    },
    borderWidth: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'border' },
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
      table: { category: 'border' },
    },
    borderRadius: {
      options: Object.values(BorderRadius),
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
      options: Object.values(JustifyContent),
      control: 'select',
      table: { category: 'display' },
    },
    alignItems: {
      options: Object.values(AlignItems),
      control: 'select',
      table: { category: 'display' },
    },
    textAlign: {
      options: Object.values(TEXT_ALIGN),
      control: 'select',
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
    marginInline: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginInlineStart: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginInlineEnd: {
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
    paddingInline: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingInlineStart: {
      options: sizeControlOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingInlineEnd: {
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
  args: {
    size: 100,
    items: 1,
    display: DISPLAY.BLOCK,
    width: BLOCK_SIZES.HALF,
    height: BLOCK_SIZES.HALF,
    borderStyle: BorderStyle.dashed,
    borderColor: BorderColor.borderDefault,
    justifyContent: JustifyContent.flexStart,
    alignItems: AlignItems.flexStart,
    textAlign: TEXT_ALIGN.LEFT,
  },
};

export const DefaultStory = (args) => {
  const { items, size, ...rest } = args;
  const children = [];
  for (let $i = 0; $i < items; $i++) {
    children.push(
      <Box
        as="img"
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderColor={BorderColor.borderMuted}
        key={$i}
        style={{ width: size, height: size }}
        src="./images/eth_logo.svg"
      />,
    );
  }
  return (
    <Box {...rest} borderColor={BorderColor.borderMuted}>
      {children}
    </Box>
  );
};

DefaultStory.storyName = 'Default';

export const Margin = (args) => {
  return (
    <Box borderColor={BorderColor.borderMuted}>
      <Box
        {...args}
        margin={2}
        padding={4}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderColor={BorderColor.borderMuted}
      >
        Static margin
      </Box>
      <Box
        {...args}
        margin={[2, 4, 8, 12]}
        padding={[4]}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderColor={BorderColor.borderMuted}
      >
        Responsive margin changes based on breakpoint
      </Box>
    </Box>
  );
};

export const Padding = (args) => {
  return (
    <Box borderColor={BorderColor.borderMuted}>
      <Box
        {...args}
        padding={4}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderColor={BorderColor.borderMuted}
      >
        Static padding
      </Box>
      <Box
        {...args}
        padding={[4, 8, 12]}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderColor={BorderColor.borderMuted}
      >
        Responsive padding changes based on breakpoint
      </Box>
    </Box>
  );
};

export const ColorStory = (args) => {
  return (
    <>
      <Box {...args} padding={3} color={Color.textDefault}>
        Color.textDefault
      </Box>
      <Box {...args} padding={3} color={Color.textAlternative}>
        Color.textAlternative
      </Box>
      <Box {...args} padding={3} color={Color.textMuted}>
        Color.textMuted
      </Box>
      <Box {...args} padding={3} color={Color.primaryDefault}>
        Color.primaryDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={Color.primaryInverse}
        backgroundColor={BackgroundColor.primaryDefault}
      >
        Color.primaryInverse
      </Box>
      <Box {...args} padding={3} color={Color.errorDefault}>
        Color.errorDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={Color.errorInverse}
        backgroundColor={BackgroundColor.errorDefault}
      >
        Color.errorInverse
      </Box>
      <Box {...args} padding={3} color={Color.successDefault}>
        Color.successDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={Color.successInverse}
        backgroundColor={BackgroundColor.successDefault}
      >
        Color.successInverse
      </Box>
      <Box {...args} padding={3} color={Color.warningDefault}>
        Color.warningDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={Color.warningInverse}
        backgroundColor={BackgroundColor.warningDefault}
      >
        Color.warningInverse
      </Box>
      <Box {...args} padding={3} color={Color.infoDefault}>
        Color.infoDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={Color.infoInverse}
        backgroundColor={BackgroundColor.infoDefault}
      >
        Color.infoInverse
      </Box>
      <Box {...args} padding={3} color={Color.inherit}>
        Color.inherit
      </Box>
      <Box
        {...args}
        padding={3}
        backgroundColor={Color.sepolia}
        color={Color.sepoliaInverse}
      >
        Color.sepoliaInverse
      </Box>
      <Box
        {...args}
        padding={3}
        backgroundColor={Color.goerli}
        color={Color.goerliInverse}
      >
        Color.goerliInverse
      </Box>
    </>
  );
};
ColorStory.storyName = 'Color';

export const BackgroundColorStory = () => {
  return (
    <>
      <Box padding={3} backgroundColor={BackgroundColor.backgroundDefault}>
        <Typography color={TextColor.textDefault}>
          BackgroundColor.backgroundDefault
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.backgroundAlternative}>
        <Typography color={TextColor.textDefault}>
          BackgroundColor.backgroundAlternative
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.overlayDefault}>
        <Typography color={TextColor.overlayInverse}>
          BackgroundColor.overlayDefault
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.primaryDefault}>
        <Typography color={Color.primaryInverse}>
          BackgroundColor.primaryDefault
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.primaryMuted}>
        <Typography color={TextColor.textDefault}>
          BackgroundColor.primaryMuted
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.errorDefault}>
        <Typography color={TextColor.errorInverse}>
          BackgroundColor.errorDefault
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.errorMuted}>
        <Typography color={TextColor.textDefault}>
          BackgroundColor.errorMuted
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.successDefault}>
        <Typography color={TextColor.successInverse}>
          BackgroundColor.successDefault
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.successMuted}>
        <Typography color={TextColor.textDefault}>
          BackgroundColor.successMuted
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.warningDefault}>
        <Typography color={TextColor.warningInverse}>
          BackgroundColor.warningDefault
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.warningMuted}>
        <Typography color={TextColor.textDefault}>
          BackgroundColor.warningMuted
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.sepolia}>
        <Typography color={TextColor.sepoliaInverse}>
          BackgroundColor.sepolia
        </Typography>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.goerli}>
        <Typography color={TextColor.goerliInverse}>
          BackgroundColor.goerli
        </Typography>
      </Box>
    </>
  );
};
BackgroundColorStory.storyName = 'BackgroundColor';

export const BorderColorStory = () => {
  return (
    <>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderDefault}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={TextColor.textDefault}>
          BorderColor.borderDefault
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderMuted}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={TextColor.textDefault}>
          BorderColor.borderMuted
        </Typography>
      </Box>
      <Box
        padding={3}
        borderColor={BorderColor.primaryDefault}
        borderWidth={2}
        marginBottom={1}
        backgroundColor={BackgroundColor.primaryMuted}
      >
        <Typography color={TextColor.textDefault}>
          BorderColor.primaryDefault
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.errorMuted}
        borderColor={BorderColor.errorDefault}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={TextColor.textDefault}>
          BorderColor.errorDefault
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.successMuted}
        borderColor={BorderColor.successDefault}
        borderWidth={2}
        marginBottom={1}
      >
        <Typography color={TextColor.textDefault}>
          BorderColor.successDefault
        </Typography>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.warningMuted}
        borderColor={BorderColor.warningDefault}
        borderWidth={2}
      >
        <Typography color={TextColor.textDefault}>
          BorderColor.warningDefault
        </Typography>
      </Box>
    </>
  );
};
BorderColorStory.storyName = 'BorderColor';

export const BorderRadiusStory = () => {
  return (
    <>
      <Box
        display={DISPLAY.GRID}
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
        gap={4}
      >
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.none}
        >
          BorderRadius.NONE 0px
        </Box>
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.XS}
        >
          BorderRadius.XS 2px
        </Box>
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.SM}
        >
          BorderRadius.SM 4px
        </Box>
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.MD}
        >
          BorderRadius.MD 6px
        </Box>
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.LG}
        >
          BorderRadius.LG 8px
        </Box>
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.XL}
        >
          BorderRadius.XL 12px
        </Box>
        <Box
          padding={3}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
          borderRadius={BorderRadius.pill}
        >
          BorderRadius.pill 9999px
        </Box>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderColor={BorderColor.borderDefault}
        borderWidth={2}
        borderRadius={BorderRadius.full}
        margin={4}
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        style={{ height: '250px', width: '250px' }}
      >
        BorderRadius.full 50%
      </Box>
    </>
  );
};
BorderRadiusStory.storyName = 'BorderRadius';

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
        display={[DISPLAY.FLEX, null, null, DISPLAY.NONE]}
        flexDirection={[
          FLEX_DIRECTION.COLUMN,
          FLEX_DIRECTION.COLUMN,
          FLEX_DIRECTION.ROW,
        ]}
        borderColor={BorderColor.borderDefault}
      >
        <Box
          padding={[4, 8]}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderMuted}
        >
          responsive
        </Box>
        <Box
          padding={[4, 8]}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderMuted}
        >
          props
        </Box>
        <Box
          padding={[4, 8]}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderMuted}
        >
          example
        </Box>
        <Box
          padding={[4, 8]}
          borderRadius={[
            BorderRadius.XS,
            BorderRadius.SM,
            BorderRadius.MD,
            BorderRadius.LG,
          ]}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderMuted}
        >
          Responsive Border Radius 1
        </Box>
        <Box
          padding={[4, 8]}
          borderRadius={[
            BorderRadius.XL,
            BorderRadius.PILL,
            BorderRadius.none,
            BorderRadius.full,
          ]}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderMuted}
        >
          Responsive Border Radius 2
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

export const Width = (args) => {
  const getColumns = () => {
    const content = [];
    for (let i = 0; i < 12; i++) {
      content.push(
        <Box
          key={i}
          backgroundColor={
            i % 2 === 0
              ? BackgroundColor.errorMuted
              : BackgroundColor.warningMuted
          }
          width={BLOCK_SIZES.ONE_TWELFTH}
        />,
      );
    }
    return content;
  };

  return (
    <>
      <p>
        <b>Working demo</b>
      </p>

      <Box
        borderColor={BorderColor.borderMuted}
        borderWidth={6}
        marginBottom={6}
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        {...args}
      >
        {args.width.map((item, i) => {
          return `${item} ${args.width.length === i + 1 ? '' : ', '}`;
        })}
      </Box>

      <p>
        <b>Static widths</b>
      </p>
      <Box
        display={DISPLAY.FLEX}
        borderColor={BackgroundColor.backgroundAlternative}
        style={{
          height: '100vh',
          position: 'relative',
        }}
        marginBottom={6}
      >
        {getColumns()}

        <Box
          width={BLOCK_SIZES.FULL}
          display={DISPLAY.FLEX}
          flexWrap={FLEX_WRAP.WRAP}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BLOCK_SIZES.FULL}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.FULL
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BLOCK_SIZES.HALF}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.HALF
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BLOCK_SIZES.HALF}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.HALF
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BLOCK_SIZES.ONE_THIRD}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_THIRD
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BLOCK_SIZES.ONE_THIRD}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_THIRD
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BLOCK_SIZES.ONE_THIRD}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_THIRD
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BLOCK_SIZES.ONE_FOURTH}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_FOURTH
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BLOCK_SIZES.ONE_FOURTH}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_FOURTH
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BLOCK_SIZES.ONE_FOURTH}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_FOURTH
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BLOCK_SIZES.ONE_FOURTH}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.ONE_FOURTH
          </Box>
        </Box>
      </Box>
      <p>
        <b>Responsive widths</b>
      </p>
      <Box
        display={DISPLAY.FLEX}
        borderColor={BackgroundColor.backgroundAlternative}
        style={{ height: '100vh', position: 'relative', textAlign: 'center' }}
      >
        {getColumns()}

        <Box
          width={BLOCK_SIZES.FULL}
          display={DISPLAY.FLEX}
          flexWrap={FLEX_WRAP.WRAP}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BLOCK_SIZES.FULL,
              BLOCK_SIZES.HALF,
              BLOCK_SIZES.ONE_THIRD,
              BLOCK_SIZES.ONE_FOURTH,
            ]}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.FULL, BLOCK_SIZES.HALF, BLOCK_SIZES.ONE_THIRD,
            BLOCK_SIZES.ONE_FOURTH,
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BLOCK_SIZES.FULL,
              BLOCK_SIZES.HALF,
              BLOCK_SIZES.ONE_THIRD,
              BLOCK_SIZES.ONE_FOURTH,
            ]}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.FULL, BLOCK_SIZES.HALF, BLOCK_SIZES.ONE_THIRD,
            BLOCK_SIZES.ONE_FOURTH,
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BLOCK_SIZES.FULL,
              BLOCK_SIZES.HALF,
              BLOCK_SIZES.ONE_THIRD,
              BLOCK_SIZES.ONE_FOURTH,
            ]}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.FULL, BLOCK_SIZES.HALF, BLOCK_SIZES.ONE_THIRD,
            BLOCK_SIZES.ONE_FOURTH,
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BLOCK_SIZES.FULL,
              BLOCK_SIZES.HALF,
              BLOCK_SIZES.ONE_THIRD,
              BLOCK_SIZES.ONE_FOURTH,
            ]}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BLOCK_SIZES.FULL, BLOCK_SIZES.HALF, BLOCK_SIZES.ONE_THIRD,
            BLOCK_SIZES.ONE_FOURTH,
          </Box>
        </Box>
      </Box>
    </>
  );
};

Width.args = {
  width: [
    BLOCK_SIZES.HALF,
    BLOCK_SIZES.ONE_FIFTH,
    BLOCK_SIZES.THREE_FOURTHS,
    BLOCK_SIZES.ONE_FOURTH,
  ],
};
