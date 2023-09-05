import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  BlockSize,
  BorderStyle,
  BorderRadius,
  TextColor,
  BorderColor,
  BackgroundColor,
  Display,
  AlignItems,
  JustifyContent,
  TextAlign,
  FlexDirection,
  FlexWrap,
} from '../../../helpers/constants/design-system';

import { Text } from '../../component-library';

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
  title: 'Components/UI/Box (deprecated)',
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
    display: {
      options: Object.values(Display),
      control: 'select',
      table: { category: 'display' },
    },
    width: {
      options: Object.values(BlockSize),
      control: 'multi-select',
      table: { category: 'display' },
    },
    height: {
      options: Object.values(BlockSize),
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
      options: Object.values(FlexWrap),
      control: 'select',
      table: { category: 'display' },
    },
    flexDirection: {
      options: Object.values(FlexDirection),
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
      options: Object.values(TextAlign),
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
} as ComponentMeta<typeof Box>;

export const DefaultStory: ComponentStory<typeof Box> = (args) => (
  <Box {...args} />
);

DefaultStory.args = {
  children: 'Box component',
  display: Display.Flex,
  justifyContent: JustifyContent.center,
  alignItems: AlignItems.center,
  width: BlockSize.Half,
  height: BlockSize.Half,
  borderColor: BorderColor.borderDefault,
  padding: 4,
};

DefaultStory.storyName = 'Default';

export const Margin: ComponentStory<typeof Box> = (args) => {
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

export const Padding: ComponentStory<typeof Box> = (args) => {
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

export const ColorStory: ComponentStory<typeof Box> = (args) => {
  return (
    <>
      <Box {...args} padding={3} color={TextColor.textDefault}>
        TextColor.textDefault
      </Box>
      <Box {...args} padding={3} color={TextColor.textAlternative}>
        TextColor.textAlternative
      </Box>
      <Box {...args} padding={3} color={TextColor.textMuted}>
        TextColor.textMuted
      </Box>
      <Box {...args} padding={3} color={TextColor.primaryDefault}>
        TextColor.primaryDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={TextColor.primaryInverse}
        backgroundColor={BackgroundColor.primaryDefault}
      >
        TextColor.primaryInverse
      </Box>
      <Box {...args} padding={3} color={TextColor.errorDefault}>
        TextColor.errorDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={TextColor.errorInverse}
        backgroundColor={BackgroundColor.errorDefault}
      >
        TextColor.errorInverse
      </Box>
      <Box {...args} padding={3} color={TextColor.successDefault}>
        TextColor.successDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={TextColor.successInverse}
        backgroundColor={BackgroundColor.successDefault}
      >
        TextColor.successInverse
      </Box>
      <Box {...args} padding={3} color={TextColor.warningDefault}>
        TextColor.warningDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={TextColor.warningInverse}
        backgroundColor={BackgroundColor.warningDefault}
      >
        TextColor.warningInverse
      </Box>
      <Box {...args} padding={3} color={TextColor.infoDefault}>
        TextColor.infoDefault
      </Box>
      <Box
        {...args}
        padding={3}
        color={TextColor.infoInverse}
        backgroundColor={BackgroundColor.infoDefault}
      >
        TextColor.infoInverse
      </Box>
      <Box {...args} padding={3} color={TextColor.inherit}>
        TextColor.inherit
      </Box>
      <Box
        {...args}
        padding={3}
        backgroundColor={BackgroundColor.sepolia}
        color={TextColor.sepoliaInverse}
      >
        TextColor.sepoliaInverse
      </Box>
      <Box
        {...args}
        padding={3}
        backgroundColor={BackgroundColor.goerli}
        color={TextColor.goerliInverse}
      >
        TextColor.goerliInverse
      </Box>
    </>
  );
};
ColorStory.storyName = 'Color';

export const BackgroundColorStory = () => {
  return (
    <>
      <Box padding={3} backgroundColor={BackgroundColor.backgroundDefault}>
        <Text color={TextColor.textDefault}>
          BackgroundColor.backgroundDefault
        </Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.backgroundAlternative}>
        <Text color={TextColor.textDefault}>
          BackgroundColor.backgroundAlternative
        </Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.overlayDefault}>
        <Text color={TextColor.overlayInverse}>
          BackgroundColor.overlayDefault
        </Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.primaryDefault}>
        <Text color={TextColor.primaryInverse}>
          BackgroundColor.primaryDefault
        </Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.primaryMuted}>
        <Text color={TextColor.textDefault}>BackgroundColor.primaryMuted</Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.errorDefault}>
        <Text color={TextColor.errorInverse}>BackgroundColor.errorDefault</Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.errorMuted}>
        <Text color={TextColor.textDefault}>BackgroundColor.errorMuted</Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.successDefault}>
        <Text color={TextColor.successInverse}>
          BackgroundColor.successDefault
        </Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.successMuted}>
        <Text color={TextColor.textDefault}>BackgroundColor.successMuted</Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.warningDefault}>
        <Text color={TextColor.warningInverse}>
          BackgroundColor.warningDefault
        </Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.warningMuted}>
        <Text color={TextColor.textDefault}>BackgroundColor.warningMuted</Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.sepolia}>
        <Text color={TextColor.sepoliaInverse}>BackgroundColor.sepolia</Text>
      </Box>
      <Box padding={3} backgroundColor={BackgroundColor.goerli}>
        <Text color={TextColor.goerliInverse}>BackgroundColor.goerli</Text>
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
        <Text color={TextColor.textDefault}>BorderColor.borderDefault</Text>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderMuted}
        borderWidth={2}
        marginBottom={1}
      >
        <Text color={TextColor.textDefault}>BorderColor.borderMuted</Text>
      </Box>
      <Box
        padding={3}
        borderColor={BorderColor.primaryDefault}
        borderWidth={2}
        marginBottom={1}
        backgroundColor={BackgroundColor.primaryMuted}
      >
        <Text color={TextColor.textDefault}>BorderColor.primaryDefault</Text>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.errorMuted}
        borderColor={BorderColor.errorDefault}
        borderWidth={2}
        marginBottom={1}
      >
        <Text color={TextColor.textDefault}>BorderColor.errorDefault</Text>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.successMuted}
        borderColor={BorderColor.successDefault}
        borderWidth={2}
        marginBottom={1}
      >
        <Text color={TextColor.textDefault}>BorderColor.successDefault</Text>
      </Box>
      <Box
        padding={3}
        backgroundColor={BackgroundColor.warningMuted}
        borderColor={BorderColor.warningDefault}
        borderWidth={2}
      >
        <Text color={TextColor.textDefault}>BorderColor.warningDefault</Text>
      </Box>
    </>
  );
};
BorderColorStory.storyName = 'BorderColor';

export const BorderRadiusStory = () => {
  return (
    <>
      <Box
        display={Display.Grid}
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
        display={Display.Flex}
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
      <Text marginBottom={4}>
        Responsive props example. Stacks vertically on small screens and aligns
        horizontally on large screens. Padding is also adjusted between small
        and large screens
      </Text>
      <Box
        marginTop="auto"
        marginBottom={[0]}
        padding={[2, 4]}
        gap={[2, 4]}
        display={[Display.Flex, null, null, Display.None]}
        flexDirection={[
          FlexDirection.Column,
          FlexDirection.Column,
          FlexDirection.Row,
        ]}
        borderColor={BorderColor.borderDefault}
      >
        <Box
          padding={[4, 8]}
          backgroundColor={[
            BackgroundColor.backgroundAlternative,
            BackgroundColor.primaryMuted,
          ]}
          borderColor={BorderColor.borderMuted}
        >
          responsive
        </Box>
        <Box
          padding={[4, 8]}
          backgroundColor={[
            BackgroundColor.backgroundAlternative,
            BackgroundColor.primaryMuted,
          ]}
          borderColor={BorderColor.borderMuted}
        >
          props
        </Box>
        <Box
          padding={[4, 8]}
          backgroundColor={[
            BackgroundColor.backgroundAlternative,
            BackgroundColor.primaryMuted,
          ]}
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
          backgroundColor={[
            BackgroundColor.backgroundAlternative,
            BackgroundColor.primaryMuted,
          ]}
          borderColor={BorderColor.borderMuted}
        >
          Responsive Border Radius 1
        </Box>
        <Box
          padding={[4, 8]}
          borderRadius={[
            BorderRadius.XL,
            BorderRadius.pill,
            BorderRadius.none,
            BorderRadius.full,
          ]}
          backgroundColor={[
            BackgroundColor.backgroundAlternative,
            BackgroundColor.primaryMuted,
          ]}
          borderColor={BorderColor.borderMuted}
        >
          Responsive Border Radius 2
        </Box>
      </Box>
    </>
  );
};

export const As: ComponentStory<typeof Box> = (args) => {
  return (
    <>
      <Text marginBottom={4}>
        You can change the root element of the Box component using the as prop.
        Inspect the below elements to see the underlying HTML elements
      </Text>
      <Box {...args}>div(default)</Box>
      <Box as="ul">ul</Box>
      <Box as="li">li</Box>
      <Box as="button">button</Box>
      <Box as="header">header</Box>
    </>
  );
};

export const Width: ComponentStory<typeof Box> = () => {
  const getColumns = (): JSX.Element[] => {
    const content: JSX.Element[] = [];
    for (let i = 0; i < 12; i++) {
      content.push(
        <Box
          key={i}
          backgroundColor={
            i % 2 === 0
              ? BackgroundColor.errorMuted
              : BackgroundColor.warningMuted
          }
          width={BlockSize.OneTwelfth}
        />,
      );
    }
    return content;
  };

  return (
    <>
      <p>
        <b>Static widths</b>
      </p>
      <Box
        display={Display.Flex}
        borderColor={BorderColor.borderMuted}
        style={{
          height: '100vh',
          position: 'relative',
        }}
        marginBottom={6}
      >
        {getColumns()}

        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexWrap={FlexWrap.Wrap}
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
            width={BlockSize.Full}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Full
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BlockSize.Half}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Half
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BlockSize.Half}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Half
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BlockSize.OneThird}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneThird
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BlockSize.OneThird}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneThird
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            marginBottom={6}
            width={BlockSize.OneThird}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneThird
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BlockSize.OneFourth}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneFourth
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BlockSize.OneFourth}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneFourth
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BlockSize.OneFourth}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneFourth
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={BlockSize.OneFourth}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.OneFourth
          </Box>
        </Box>
      </Box>
      <p>
        <b>Responsive widths</b>
      </p>
      <Box
        display={Display.Flex}
        borderColor={BorderColor.borderMuted}
        style={{ height: '100vh', position: 'relative', textAlign: 'center' }}
      >
        {getColumns()}

        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexWrap={FlexWrap.Wrap}
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
              BlockSize.Full,
              BlockSize.Half,
              BlockSize.OneThird,
              BlockSize.OneFourth,
            ]}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Full, BlockSize.Half, BlockSize.OneThird,
            BlockSize.OneFourth,
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BlockSize.Full,
              BlockSize.Half,
              BlockSize.OneThird,
              BlockSize.OneFourth,
            ]}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Full, BlockSize.Half, BlockSize.OneThird,
            BlockSize.OneFourth,
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BlockSize.Full,
              BlockSize.Half,
              BlockSize.OneThird,
              BlockSize.OneFourth,
            ]}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Full, BlockSize.Half, BlockSize.OneThird,
            BlockSize.OneFourth,
          </Box>
          <Box
            borderColor={BorderColor.borderMuted}
            borderWidth={6}
            width={[
              BlockSize.Full,
              BlockSize.Half,
              BlockSize.OneThird,
              BlockSize.OneFourth,
            ]}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            BlockSize.Full, BlockSize.Half, BlockSize.OneThird,
            BlockSize.OneFourth,
          </Box>
        </Box>
      </Box>
    </>
  );
};

Width.args = {
  width: [
    BlockSize.Half,
    BlockSize.OneFifth,
    BlockSize.ThreeFourths,
    BlockSize.OneFourth,
  ],
};
