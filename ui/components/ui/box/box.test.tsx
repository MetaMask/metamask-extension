import * as React from 'react';
import { render } from '@testing-library/react';
import {
  BorderStyle,
  Display,
  DISPLAY,
  FlexDirection,
  FLEX_DIRECTION,
  FlexWrap,
  FLEX_WRAP,
  AlignItems,
  JustifyContent,
  TEXT_ALIGN,
  TextAlign,
  BlockSize,
  BLOCK_SIZES,
  BorderRadius,
  BorderColor,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import Box from '.';

describe('Box', () => {
  it('should render the Box without crashing', () => {
    const { getByText } = render(<Box>Box content</Box>);

    expect(getByText('Box content')).toBeDefined();
  });
  describe('margin', () => {
    it('should render the Box with the margin class', () => {
      const { getByText } = render(<Box margin={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-1');
    });
    it('should render the Box with the margin auto class', () => {
      const { getByText } = render(<Box margin="auto">Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-auto');
    });
    it('should render the Box with the responsive margin classes', () => {
      const { getByText } = render(
        <Box margin={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-1');
      expect(getByText('Box content')).toHaveClass('box--sm:margin-auto');
      expect(getByText('Box content')).toHaveClass('box--md:margin-3');
      expect(getByText('Box content')).toHaveClass('box--lg:margin-4');
    });
    it('should render the Box with the marginTop class', () => {
      const { getByText } = render(<Box marginTop={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-top-1');
    });
    it('should render the Box with the marginTop auto class', () => {
      const { getByText } = render(<Box marginTop="auto">Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-top-auto');
    });
    it('should render the Box with the responsive marginTop classes', () => {
      const { getByText } = render(
        <Box marginTop={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-top-1');
      expect(getByText('Box content')).toHaveClass('box--sm:margin-top-auto');
      expect(getByText('Box content')).toHaveClass('box--md:margin-top-3');
      expect(getByText('Box content')).toHaveClass('box--lg:margin-top-4');
    });
    it('should render the Box with the marginRight class', () => {
      const { getByText } = render(<Box marginRight={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-right-1');
    });
    it('should render the Box with the marginRight auto class', () => {
      const { getByText } = render(<Box marginRight="auto">Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-right-auto');
    });
    it('should render the Box with the responsive marginRight classes', () => {
      const { getByText } = render(
        <Box marginRight={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-right-1');
      expect(getByText('Box content')).toHaveClass('box--sm:margin-right-auto');
      expect(getByText('Box content')).toHaveClass('box--md:margin-right-3');
      expect(getByText('Box content')).toHaveClass('box--lg:margin-right-4');
    });
    it('should render the Box with the marginBottom class', () => {
      const { getByText } = render(<Box marginBottom={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-bottom-1');
    });
    it('should render the Box with the responsive marginBottom classes', () => {
      const { getByText } = render(
        <Box marginBottom={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-bottom-1');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:margin-bottom-auto',
      );
      expect(getByText('Box content')).toHaveClass('box--md:margin-bottom-3');
      expect(getByText('Box content')).toHaveClass('box--lg:margin-bottom-4');
    });
    it('should render the Box with the marginLeft class', () => {
      const { getByText } = render(<Box marginLeft={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-left-1');
    });
    it('should render the Box with the responsive marginLeft classes', () => {
      const { getByText } = render(
        <Box marginLeft={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-left-1');
      expect(getByText('Box content')).toHaveClass('box--sm:margin-left-auto');
      expect(getByText('Box content')).toHaveClass('box--md:margin-left-3');
      expect(getByText('Box content')).toHaveClass('box--lg:margin-left-4');
    });
    it('should render the Box with the marginInline class', () => {
      const { getByText } = render(<Box marginInline={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-inline-1');
    });
    it('should render the Box with the marginInline auto class', () => {
      const { getByText } = render(<Box marginInline="auto">Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-inline-auto');
    });
    it('should render the Box with the responsive marginInline classes', () => {
      const { getByText } = render(
        <Box marginInline={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-inline-1');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:margin-inline-auto',
      );
      expect(getByText('Box content')).toHaveClass('box--md:margin-inline-3');
      expect(getByText('Box content')).toHaveClass('box--lg:margin-inline-4');
    });
    it('should render the Box with the marginInlineStart class', () => {
      const { getByText } = render(
        <Box marginInlineStart={1}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'box--margin-inline-start-1',
      );
    });
    it('should render the Box with the marginInlineStart auto class', () => {
      const { getByText } = render(
        <Box marginInlineStart="auto">Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'box--margin-inline-start-auto',
      );
    });
    it('should render the Box with the responsive marginInlineStart classes', () => {
      const { getByText } = render(
        <Box marginInlineStart={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'box--margin-inline-start-1',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--sm:margin-inline-start-auto',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:margin-inline-start-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:margin-inline-start-4',
      );
    });
    it('should render the Box with the marginInlineEnd class', () => {
      const { getByText } = render(<Box marginInlineEnd={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--margin-inline-end-1');
    });
    it('should render the Box with the marginInlineEnd auto class', () => {
      const { getByText } = render(
        <Box marginInlineEnd="auto">Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'box--margin-inline-end-auto',
      );
    });
    it('should render the Box with the responsive marginInlineEnd classes', () => {
      const { getByText } = render(
        <Box marginInlineEnd={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--margin-inline-end-1');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:margin-inline-end-auto',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:margin-inline-end-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:margin-inline-end-4',
      );
    });
  });

  describe('padding', () => {
    it('should render the Box with the padding class with singular value prop or one item array prop', () => {
      const { getByText } = render(
        <>
          <Box padding={1}>Box content</Box>
          <Box padding={[1]}>Box content one item array</Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass('box--padding-1');
      expect(getByText('Box content one item array')).toHaveClass(
        'box--padding-1',
      );
    });
    it('should render the Box with the responsive padding classes', () => {
      const { getByText } = render(
        <Box padding={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-1');
      expect(getByText('Box content')).toHaveClass('box--sm:padding-2');
      expect(getByText('Box content')).toHaveClass('box--md:padding-3');
      expect(getByText('Box content')).toHaveClass('box--lg:padding-4');
    });
    it('should render the Box with the paddingTop class', () => {
      const { getByText } = render(<Box paddingTop={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--padding-top-1');
    });
    it('should render the Box with the responsive paddingTop classes', () => {
      const { getByText } = render(
        <Box paddingTop={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-top-1');
      expect(getByText('Box content')).toHaveClass('box--sm:padding-top-2');
      expect(getByText('Box content')).toHaveClass('box--md:padding-top-3');
      expect(getByText('Box content')).toHaveClass('box--lg:padding-top-4');
    });
    it('should render the Box with the paddingRight class', () => {
      const { getByText } = render(<Box paddingRight={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--padding-right-1');
    });
    it('should render the Box with the responsive paddingRight classes', () => {
      const { getByText } = render(
        <Box paddingRight={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-right-1');
      expect(getByText('Box content')).toHaveClass('box--sm:padding-right-2');
      expect(getByText('Box content')).toHaveClass('box--md:padding-right-3');
      expect(getByText('Box content')).toHaveClass('box--lg:padding-right-4');
    });
    it('should render the Box with the paddingBottom class', () => {
      const { getByText } = render(<Box paddingBottom={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--padding-bottom-1');
    });
    it('should render the Box with the responsive paddingBottom classes', () => {
      const { getByText } = render(
        <Box paddingBottom={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-bottom-1');
      expect(getByText('Box content')).toHaveClass('box--sm:padding-bottom-2');
      expect(getByText('Box content')).toHaveClass('box--md:padding-bottom-3');
      expect(getByText('Box content')).toHaveClass('box--lg:padding-bottom-4');
    });
    it('should render the Box with the paddingLeft class', () => {
      const { getByText } = render(<Box paddingLeft={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--padding-left-1');
    });
    it('should render the Box with the responsive paddingLeft classes', () => {
      const { getByText } = render(
        <Box paddingLeft={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-left-1');
      expect(getByText('Box content')).toHaveClass('box--sm:padding-left-2');
      expect(getByText('Box content')).toHaveClass('box--md:padding-left-3');
      expect(getByText('Box content')).toHaveClass('box--lg:padding-left-4');
    });
    it('should render the Box with the responsive paddingInline classes', () => {
      const { getByText } = render(
        <Box paddingInline={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-inline-1');
      expect(getByText('Box content')).toHaveClass('box--sm:padding-inline-2');
      expect(getByText('Box content')).toHaveClass('box--md:padding-inline-3');
      expect(getByText('Box content')).toHaveClass('box--lg:padding-inline-4');
    });
    it('should render the Box with the responsive paddingInlineStart classes', () => {
      const { getByText } = render(
        <Box paddingInlineStart={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'box--padding-inline-start-1',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--sm:padding-inline-start-2',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:padding-inline-start-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:padding-inline-start-4',
      );
    });
    it('should render the Box with the responsive paddingInlineEnd classes', () => {
      const { getByText } = render(
        <Box paddingInlineEnd={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--padding-inline-end-1');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:padding-inline-end-2',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:padding-inline-end-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:padding-inline-end-4',
      );
    });
  });
  describe('border', () => {
    it('should render the Box with the borderWidth class', () => {
      const { getByText } = render(<Box borderWidth={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--border-width-1');
    });
    it('should render the Box with the responsive borderWidth classes', () => {
      const { getByText } = render(
        <Box borderWidth={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--border-width-1');
      expect(getByText('Box content')).toHaveClass('box--sm:border-width-2');
      expect(getByText('Box content')).toHaveClass('box--md:border-width-3');
      expect(getByText('Box content')).toHaveClass('box--lg:border-width-4');
    });
    it('should render the Box with the borderColor class', () => {
      const { getByText } = render(
        <Box borderColor={BorderColor.borderDefault}>Box content</Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'box--border-color-border-default',
      );
    });
    it('should render the Box with the responsive borderColor classes', () => {
      const { getByText } = render(
        <Box
          borderColor={[
            BorderColor.borderDefault,
            BorderColor.errorDefault,
            BorderColor.infoDefault,
            BorderColor.warningDefault,
          ]}
        >
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'box--border-color-border-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--sm:border-color-error-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:border-color-info-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:border-color-warning-default',
      );
    });
    it('should render the Box with a borderStyle class', () => {
      const { getByText } = render(
        <Box borderStyle={BorderStyle.solid}>Box content</Box>,
      );
      expect(getByText('Box content')).toHaveClass('box--border-style-solid');
    });
    it('should render the Box with the responsive borderStyle classes', () => {
      const { getByText } = render(
        <Box
          borderStyle={[
            BorderStyle.solid,
            BorderStyle.dashed,
            BorderStyle.none,
            BorderStyle.dotted,
          ]}
        >
          Box content
        </Box>,
      );

      expect(getByText('Box content')).toHaveClass('box--border-style-solid');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:border-style-dashed',
      );
      expect(getByText('Box content')).toHaveClass('box--md:border-style-none');
      expect(getByText('Box content')).toHaveClass(
        'box--lg:border-style-dotted',
      );
    });
    it('should render the Box with the borderRadius class', () => {
      const { getByText } = render(
        <>
          <Box borderRadius={BorderRadius.XS}>border radius xs</Box>
          <Box borderRadius={BorderRadius.SM}>border radius sm</Box>
          <Box borderRadius={BorderRadius.MD}>border radius md</Box>
          <Box borderRadius={BorderRadius.LG}>border radius lg</Box>
          <Box borderRadius={BorderRadius.XL}>border radius xl</Box>
          <Box borderRadius={BorderRadius.pill}>border radius pill</Box>
          <Box borderRadius={BorderRadius.full}>border radius full</Box>
          <Box borderRadius={BorderRadius.none}>border radius none</Box>
        </>,
      );

      expect(getByText('border radius xs')).toHaveClass('box--rounded-xs');
      expect(getByText('border radius sm')).toHaveClass('box--rounded-sm');
      expect(getByText('border radius md')).toHaveClass('box--rounded-md');
      expect(getByText('border radius lg')).toHaveClass('box--rounded-lg');
      expect(getByText('border radius xl')).toHaveClass('box--rounded-xl');
      expect(getByText('border radius pill')).toHaveClass('box--rounded-pill');
      expect(getByText('border radius full')).toHaveClass('box--rounded-full');
      expect(getByText('border radius none')).toHaveClass('box--rounded-none');
    });
    it('should render the Box with the responsive borderRadius classes', () => {
      const { getByText } = render(
        <>
          <Box
            borderRadius={[
              BorderRadius.XS,
              BorderRadius.SM,
              BorderRadius.MD,
              BorderRadius.LG,
            ]}
          >
            Border radius set 1
          </Box>
          <Box
            borderRadius={[
              BorderRadius.XL,
              BorderRadius.pill,
              BorderRadius.none,
              BorderRadius.full,
            ]}
          >
            Border radius set 2
          </Box>
        </>,
      );

      expect(getByText('Border radius set 1')).toHaveClass('box--rounded-xs');
      expect(getByText('Border radius set 1')).toHaveClass(
        'box--sm:rounded-sm',
      );
      expect(getByText('Border radius set 1')).toHaveClass(
        'box--md:rounded-md',
      );
      expect(getByText('Border radius set 1')).toHaveClass(
        'box--lg:rounded-lg',
      );
      expect(getByText('Border radius set 2')).toHaveClass('box--rounded-xl');
      expect(getByText('Border radius set 2')).toHaveClass(
        'box--sm:rounded-pill',
      );
      expect(getByText('Border radius set 2')).toHaveClass(
        'box--md:rounded-none',
      );
      expect(getByText('Border radius set 2')).toHaveClass(
        'box--lg:rounded-full',
      );
    });
  });
  describe('display, gap, flexDirection, flexWrap, alignItems, justifyContent', () => {
    it('should render the Box with the display classes', () => {
      const { getByText } = render(
        <>
          <Box display={Display.Block}>Box display-block</Box>
          <Box display={Display.Flex}>Box display-flex</Box>
          <Box display={Display.Grid}>Box display-grid</Box>
          <Box display={Display.Inline}>Box display-inline</Box>
          <Box display={Display.InlineBlock}>Box display-inline-block</Box>
          <Box display={Display.InlineFlex}>Box display-inline-flex</Box>
          <Box display={Display.InlineGrid}>Box display-inline-grid</Box>
          <Box display={Display.ListItem}>Box display-list-item</Box>
          <Box display={Display.None}>Box display-none</Box>
          <Box display={DISPLAY.BLOCK}>DEPRECATED Box display-block</Box>
          <Box display={DISPLAY.FLEX}>DEPRECATED Box display-flex</Box>
          <Box display={DISPLAY.GRID}>DEPRECATED Box display-grid</Box>
          <Box display={DISPLAY.INLINE}>DEPRECATED Box display-inline</Box>
          <Box display={DISPLAY.INLINE_BLOCK}>
            DEPRECATED Box display-inline-block
          </Box>
          <Box display={DISPLAY.INLINE_FLEX}>
            DEPRECATED Box display-inline-flex
          </Box>
          <Box display={DISPLAY.INLINE_GRID}>
            DEPRECATED Box display-inline-grid
          </Box>
          <Box display={DISPLAY.LIST_ITEM}>
            DEPRECATED Box display-list-item
          </Box>
          <Box display={DISPLAY.NONE}>DEPRECATED Box display-none</Box>
        </>,
      );

      expect(getByText('Box display-block')).toHaveClass('box--display-block');
      expect(getByText('Box display-flex')).toHaveClass('box--display-flex');
      expect(getByText('Box display-grid')).toHaveClass('box--display-grid');
      expect(getByText('Box display-inline')).toHaveClass(
        'box--display-inline',
      );
      expect(getByText('Box display-inline-block')).toHaveClass(
        'box--display-inline-block',
      );
      expect(getByText('Box display-inline-flex')).toHaveClass(
        'box--display-inline-flex',
      );
      expect(getByText('Box display-inline-grid')).toHaveClass(
        'box--display-inline-grid',
      );
      expect(getByText('Box display-list-item')).toHaveClass(
        'box--display-list-item',
      );

      expect(getByText('DEPRECATED Box display-block')).toHaveClass(
        'box--display-block',
      );
      expect(getByText('DEPRECATED Box display-flex')).toHaveClass(
        'box--display-flex',
      );
      expect(getByText('DEPRECATED Box display-grid')).toHaveClass(
        'box--display-grid',
      );
      expect(getByText('DEPRECATED Box display-inline')).toHaveClass(
        'box--display-inline',
      );
      expect(getByText('DEPRECATED Box display-inline-block')).toHaveClass(
        'box--display-inline-block',
      );
      expect(getByText('DEPRECATED Box display-inline-flex')).toHaveClass(
        'box--display-inline-flex',
      );
      expect(getByText('DEPRECATED Box display-inline-grid')).toHaveClass(
        'box--display-inline-grid',
      );
      expect(getByText('DEPRECATED Box display-list-item')).toHaveClass(
        'box--display-list-item',
      );
    });
    it('should render the Box with the responsive display classes', () => {
      const { getByText } = render(
        <>
          <Box
            display={[Display.Block, Display.Flex, Display.Grid, Display.None]}
          >
            Box content
          </Box>
          <Box
            display={[DISPLAY.BLOCK, DISPLAY.FLEX, DISPLAY.GRID, DISPLAY.NONE]}
          >
            DEPRECATED Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass('box--display-block');
      expect(getByText('Box content')).toHaveClass('box--sm:display-flex');
      expect(getByText('Box content')).toHaveClass('box--md:display-grid');
      expect(getByText('Box content')).toHaveClass('box--lg:display-none');

      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--display-block',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--sm:display-flex',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--md:display-grid',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--lg:display-none',
      );
    });
    it('should render the Box with the gap class', () => {
      const { getByText } = render(<Box gap={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--gap-1');
    });
    it('should render the Box with the responsive gap classes', () => {
      const { getByText } = render(<Box gap={[1, 2, 3, 4]}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('box--gap-1');
      expect(getByText('Box content')).toHaveClass('box--sm:gap-2');
      expect(getByText('Box content')).toHaveClass('box--md:gap-3');
      expect(getByText('Box content')).toHaveClass('box--lg:gap-4');
    });
    it('should render the Box with the flexDirection classes', () => {
      const { getByText } = render(
        <>
          <Box flexDirection={FlexDirection.Row}>Box flex-direction-row</Box>
          <Box flexDirection={FlexDirection.RowReverse}>
            Box flex-direction-row-reverse
          </Box>
          <Box flexDirection={FlexDirection.Column}>
            Box flex-direction-column
          </Box>
          <Box flexDirection={FlexDirection.ColumnReverse}>
            Box flex-direction-column-reverse
          </Box>

          <Box flexDirection={FlexDirection.Row}>
            DEPRECATED Box flex-direction-row
          </Box>
          <Box flexDirection={FlexDirection.RowReverse}>
            DEPRECATED Box flex-direction-row-reverse
          </Box>
          <Box flexDirection={FlexDirection.Column}>
            DEPRECATED Box flex-direction-column
          </Box>
          <Box flexDirection={FlexDirection.ColumnReverse}>
            DEPRECATED Box flex-direction-column-reverse
          </Box>
        </>,
      );

      expect(getByText('Box flex-direction-row')).toHaveClass(
        'box--flex-direction-row',
      );
      expect(getByText('Box flex-direction-row-reverse')).toHaveClass(
        'box--flex-direction-row-reverse',
      );
      expect(getByText('Box flex-direction-column')).toHaveClass(
        'box--flex-direction-column',
      );
      expect(getByText('Box flex-direction-column-reverse')).toHaveClass(
        'box--flex-direction-column-reverse',
      );

      expect(getByText('DEPRECATED Box flex-direction-row')).toHaveClass(
        'box--flex-direction-row',
      );
      expect(
        getByText('DEPRECATED Box flex-direction-row-reverse'),
      ).toHaveClass('box--flex-direction-row-reverse');
      expect(getByText('DEPRECATED Box flex-direction-column')).toHaveClass(
        'box--flex-direction-column',
      );
      expect(
        getByText('DEPRECATED Box flex-direction-column-reverse'),
      ).toHaveClass('box--flex-direction-column-reverse');
    });
    it('should render the Box with the responsive flexDirection classes', () => {
      const { getByText } = render(
        <>
          <Box
            flexDirection={[
              FlexDirection.Row,
              FlexDirection.RowReverse,
              FlexDirection.Column,
              FlexDirection.ColumnReverse,
            ]}
          >
            Box content
          </Box>
          <Box
            flexDirection={[
              FLEX_DIRECTION.ROW,
              FLEX_DIRECTION.ROW_REVERSE,
              FLEX_DIRECTION.COLUMN,
              FLEX_DIRECTION.COLUMN_REVERSE,
            ]}
          >
            DEPRECATED Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass('box--flex-direction-row');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:flex-direction-row-reverse',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:flex-direction-column',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:flex-direction-column-reverse',
      );

      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--flex-direction-row',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--sm:flex-direction-row-reverse',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--md:flex-direction-column',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--lg:flex-direction-column-reverse',
      );
    });
    it('should render the Box with the flexWrap classes', () => {
      const { getByText } = render(
        <>
          <Box flexWrap={FlexWrap.Wrap}>Box flex-wrap-wrap</Box>
          <Box flexWrap={FlexWrap.WrapReverse}>Box flex-wrap-wrap-reverse</Box>
          <Box flexWrap={FlexWrap.NoWrap}>Box flex-wrap-nowrap</Box>

          <Box flexWrap={FLEX_WRAP.WRAP}>DEPRECATED Box flex-wrap-wrap</Box>
          <Box flexWrap={FLEX_WRAP.WRAP_REVERSE}>
            DEPRECATED Box flex-wrap-wrap-reverse
          </Box>
          <Box flexWrap={FLEX_WRAP.NO_WRAP}>
            DEPRECATED Box flex-wrap-nowrap
          </Box>
        </>,
      );

      expect(getByText('Box flex-wrap-wrap')).toHaveClass(
        'box--flex-wrap-wrap',
      );
      expect(getByText('Box flex-wrap-wrap-reverse')).toHaveClass(
        'box--flex-wrap-wrap-reverse',
      );
      expect(getByText('Box flex-wrap-nowrap')).toHaveClass(
        'box--flex-wrap-nowrap',
      );

      expect(getByText('DEPRECATED Box flex-wrap-wrap')).toHaveClass(
        'box--flex-wrap-wrap',
      );
      expect(getByText('DEPRECATED Box flex-wrap-wrap-reverse')).toHaveClass(
        'box--flex-wrap-wrap-reverse',
      );
      expect(getByText('DEPRECATED Box flex-wrap-nowrap')).toHaveClass(
        'box--flex-wrap-nowrap',
      );
    });
    it('should render the Box with the responsive flexWrap classes', () => {
      const { getByText } = render(
        <>
          <Box
            flexWrap={[FlexWrap.Wrap, FlexWrap.WrapReverse, FlexWrap.NoWrap]}
          >
            Box content
          </Box>
          <Box
            flexWrap={[FlexWrap.Wrap, FlexWrap.WrapReverse, FlexWrap.NoWrap]}
          >
            DEPRECATED Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass('box--flex-wrap-wrap');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:flex-wrap-wrap-reverse',
      );
      expect(getByText('Box content')).toHaveClass('box--md:flex-wrap-nowrap');

      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--flex-wrap-wrap',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--sm:flex-wrap-wrap-reverse',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--md:flex-wrap-nowrap',
      );
    });
    it('should render the Box with the alignItems classes', () => {
      const { getByText } = render(
        <>
          <Box alignItems={AlignItems.flexStart}>
            Box align-items-flex-start
          </Box>
          <Box alignItems={AlignItems.flexEnd}>Box align-items-flex-end</Box>
          <Box alignItems={AlignItems.center}>Box align-items-center</Box>
          <Box alignItems={AlignItems.baseline}>Box align-items-baseline</Box>
          <Box alignItems={AlignItems.stretch}>Box align-items-stretch</Box>
        </>,
      );

      expect(getByText('Box align-items-flex-start')).toHaveClass(
        'box--align-items-flex-start',
      );
      expect(getByText('Box align-items-flex-end')).toHaveClass(
        'box--align-items-flex-end',
      );
      expect(getByText('Box align-items-center')).toHaveClass(
        'box--align-items-center',
      );
      expect(getByText('Box align-items-baseline')).toHaveClass(
        'box--align-items-baseline',
      );
      expect(getByText('Box align-items-stretch')).toHaveClass(
        'box--align-items-stretch',
      );
    });
    it('should render the Box with the responsive alignItems classes', () => {
      const { getByText } = render(
        <>
          <Box
            alignItems={[
              AlignItems.flexStart,
              AlignItems.flexEnd,
              AlignItems.center,
              AlignItems.baseline,
            ]}
          >
            Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass(
        'box--align-items-flex-start',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--sm:align-items-flex-end',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:align-items-center',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:align-items-baseline',
      );
    });
    it('should render the Box with the justifyContent classes', () => {
      const { getByText } = render(
        <>
          <Box justifyContent={JustifyContent.flexStart}>
            Box justify-content-flex-start
          </Box>
          <Box justifyContent={JustifyContent.flexEnd}>
            Box justify-content-flex-end
          </Box>
          <Box justifyContent={JustifyContent.center}>
            Box justify-content-center
          </Box>
          <Box justifyContent={JustifyContent.spaceAround}>
            Box justify-content-space-around
          </Box>
          <Box justifyContent={JustifyContent.spaceBetween}>
            Box justify-content-space-between
          </Box>
          <Box justifyContent={JustifyContent.spaceEvenly}>
            Box justify-content-space-evenly
          </Box>
        </>,
      );

      expect(getByText('Box justify-content-flex-start')).toHaveClass(
        'box--justify-content-flex-start',
      );
      expect(getByText('Box justify-content-flex-end')).toHaveClass(
        'box--justify-content-flex-end',
      );
      expect(getByText('Box justify-content-center')).toHaveClass(
        'box--justify-content-center',
      );
      expect(getByText('Box justify-content-space-around')).toHaveClass(
        'box--justify-content-space-around',
      );
      expect(getByText('Box justify-content-space-between')).toHaveClass(
        'box--justify-content-space-between',
      );
    });
    it('should render the Box with the responsive justifyContent classes', () => {
      const { getByText } = render(
        <>
          <Box
            justifyContent={[
              JustifyContent.flexStart,
              JustifyContent.flexEnd,
              JustifyContent.center,
              JustifyContent.spaceAround,
            ]}
          >
            Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass(
        'box--justify-content-flex-start',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--sm:justify-content-flex-end',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:justify-content-center',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:justify-content-space-around',
      );
    });
  });
  describe('textAlign', () => {
    it('should render the Box with the textAlign auto class', () => {
      const { getByText } = render(
        <>
          <Box textAlign={TextAlign.Left}>Box left</Box>
          <Box textAlign={TextAlign.Center}>Box center</Box>
          <Box textAlign={TextAlign.Right}>Box right</Box>
          <Box textAlign={TextAlign.Justify}>Box justify</Box>
          <Box textAlign={TextAlign.End}>Box end</Box>

          <Box textAlign={TEXT_ALIGN.LEFT}>DEPRECATED Box left</Box>
          <Box textAlign={TEXT_ALIGN.CENTER}>DEPRECATED Box center</Box>
          <Box textAlign={TEXT_ALIGN.RIGHT}>DEPRECATED Box right</Box>
          <Box textAlign={TEXT_ALIGN.JUSTIFY}>DEPRECATED Box justify</Box>
          <Box textAlign={TEXT_ALIGN.END}>DEPRECATED Box end</Box>
        </>,
      );

      expect(getByText('Box left')).toHaveClass('box--text-align-left');
      expect(getByText('Box center')).toHaveClass('box--text-align-center');
      expect(getByText('Box right')).toHaveClass('box--text-align-right');
      expect(getByText('Box justify')).toHaveClass('box--text-align-justify');
      expect(getByText('Box end')).toHaveClass('box--text-align-end');

      expect(getByText('DEPRECATED Box left')).toHaveClass(
        'box--text-align-left',
      );
      expect(getByText('DEPRECATED Box center')).toHaveClass(
        'box--text-align-center',
      );
      expect(getByText('DEPRECATED Box right')).toHaveClass(
        'box--text-align-right',
      );
      expect(getByText('DEPRECATED Box justify')).toHaveClass(
        'box--text-align-justify',
      );
      expect(getByText('DEPRECATED Box end')).toHaveClass(
        'box--text-align-end',
      );
    });
    it('should render the Box with the responsive textAlign classes', () => {
      const { getByText } = render(
        <>
          <Box
            textAlign={[
              TextAlign.Left,
              TextAlign.Center,
              TextAlign.Right,
              TextAlign.Justify,
            ]}
          >
            Box content
          </Box>
          <Box
            textAlign={[
              TEXT_ALIGN.LEFT,
              TEXT_ALIGN.CENTER,
              TEXT_ALIGN.RIGHT,
              TEXT_ALIGN.JUSTIFY,
            ]}
          >
            DEPRECATED Box content
          </Box>
        </>,
      );

      expect(getByText('Box content')).toHaveClass('box--text-align-left');
      expect(getByText('Box content')).toHaveClass('box--sm:text-align-center');
      expect(getByText('Box content')).toHaveClass('box--md:text-align-right');
      expect(getByText('Box content')).toHaveClass(
        'box--lg:text-align-justify',
      );

      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--text-align-left',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--sm:text-align-center',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--md:text-align-right',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--lg:text-align-justify',
      );
    });
  });
  describe('background', () => {
    it('should render the Box with the backgroundColor class', () => {
      const { getByText } = render(
        <Box backgroundColor={BackgroundColor.backgroundDefault}>
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'box--background-color-background-default',
      );
    });
    it('should render the Box with the responsive backgroundColor classes', () => {
      const { getByText } = render(
        <Box
          backgroundColor={[
            BackgroundColor.backgroundDefault,
            BackgroundColor.errorDefault,
            BackgroundColor.infoDefault,
            BackgroundColor.warningDefault,
          ]}
        >
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'box--background-color-background-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--sm:background-color-error-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:background-color-info-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:background-color-warning-default',
      );
    });
  });

  describe('color', () => {
    it('should render the Box with the color class', () => {
      const { getByText } = render(
        <Box color={TextColor.textDefault}>Box content</Box>,
      );
      expect(getByText('Box content')).toHaveClass('box--color-text-default');
    });
    it('should render the Box with the responsive color classes', () => {
      const { getByText } = render(
        <Box
          color={[
            TextColor.textDefault,
            TextColor.primaryDefault,
            TextColor.errorDefault,
            TextColor.successDefault,
          ]}
        >
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass('box--color-text-default');
      expect(getByText('Box content')).toHaveClass(
        'box--sm:color-primary-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--md:color-error-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'box--lg:color-success-default',
      );
    });
  });

  describe('width, height', () => {
    it('should render the Box with the width class', () => {
      const { getByText } = render(
        <>
          <Box width={BlockSize.Half}>Box half</Box>
          <Box width={BlockSize.OneFourth}>Box one fourth</Box>
          <Box width={BlockSize.Max}>Box max</Box>
          <Box width={BlockSize.Min}>Box min</Box>

          <Box width={BLOCK_SIZES.HALF}>DEPRECATED Box half</Box>
          <Box width={BLOCK_SIZES.ONE_FOURTH}>DEPRECATED Box one fourth</Box>
          <Box width={BLOCK_SIZES.MAX}>DEPRECATED Box max</Box>
          <Box width={BLOCK_SIZES.MIN}>DEPRECATED Box min</Box>
        </>,
      );
      expect(getByText('Box half')).toHaveClass('box--width-1/2');
      expect(getByText('Box one fourth')).toHaveClass('box--width-1/4');
      expect(getByText('Box max')).toHaveClass('box--width-max');
      expect(getByText('Box min')).toHaveClass('box--width-min');

      expect(getByText('DEPRECATED Box half')).toHaveClass('box--width-1/2');
      expect(getByText('DEPRECATED Box one fourth')).toHaveClass(
        'box--width-1/4',
      );
      expect(getByText('DEPRECATED Box max')).toHaveClass('box--width-max');
      expect(getByText('DEPRECATED Box min')).toHaveClass('box--width-min');
    });
    it('should render the Box with the responsive width classes', () => {
      const { getByText } = render(
        <>
          <Box
            width={[
              BlockSize.Half,
              BlockSize.OneFourth,
              BlockSize.Max,
              BlockSize.Min,
            ]}
          >
            Box content
          </Box>

          <Box
            width={[
              BLOCK_SIZES.HALF,
              BLOCK_SIZES.ONE_FOURTH,
              BLOCK_SIZES.MAX,
              BLOCK_SIZES.MIN,
            ]}
          >
            DEPRECATED Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass('box--width-1/2');
      expect(getByText('Box content')).toHaveClass('box--sm:width-1/4');
      expect(getByText('Box content')).toHaveClass('box--md:width-max');
      expect(getByText('Box content')).toHaveClass('box--lg:width-min');

      expect(getByText('DEPRECATED Box content')).toHaveClass('box--width-1/2');
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--sm:width-1/4',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--md:width-max',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--lg:width-min',
      );
    });
    it('should render the Box with the height class', () => {
      const { getByText } = render(
        <>
          <Box height={BlockSize.Half}>Box half</Box>
          <Box height={BlockSize.OneFourth}>Box one fourth</Box>
          <Box height={BlockSize.Max}>Box max</Box>
          <Box height={BlockSize.Min}>Box min</Box>

          <Box height={BLOCK_SIZES.HALF}>DEPRECATED Box half</Box>
          <Box height={BLOCK_SIZES.ONE_FOURTH}>DEPRECATED Box one fourth</Box>
          <Box height={BLOCK_SIZES.MAX}>DEPRECATED Box max</Box>
          <Box height={BLOCK_SIZES.MIN}>DEPRECATED Box min</Box>
        </>,
      );
      expect(getByText('Box half')).toHaveClass('box--height-1/2');
      expect(getByText('Box one fourth')).toHaveClass('box--height-1/4');
      expect(getByText('Box max')).toHaveClass('box--height-max');
      expect(getByText('Box min')).toHaveClass('box--height-min');

      expect(getByText('DEPRECATED Box half')).toHaveClass('box--height-1/2');
      expect(getByText('DEPRECATED Box one fourth')).toHaveClass(
        'box--height-1/4',
      );
      expect(getByText('DEPRECATED Box max')).toHaveClass('box--height-max');
      expect(getByText('DEPRECATED Box min')).toHaveClass('box--height-min');
    });
    it('should render the Box with the responsive height classes', () => {
      const { getByText } = render(
        <>
          <Box
            height={[
              BlockSize.Half,
              BlockSize.OneFourth,
              BlockSize.Max,
              BlockSize.Min,
            ]}
          >
            Box content
          </Box>
          <Box
            height={[
              BLOCK_SIZES.HALF,
              BLOCK_SIZES.ONE_FOURTH,
              BLOCK_SIZES.MAX,
              BLOCK_SIZES.MIN,
            ]}
          >
            DEPRECATED Box content
          </Box>
        </>,
      );
      expect(getByText('Box content')).toHaveClass('box--height-1/2');
      expect(getByText('Box content')).toHaveClass('box--sm:height-1/4');
      expect(getByText('Box content')).toHaveClass('box--md:height-max');
      expect(getByText('Box content')).toHaveClass('box--lg:height-min');

      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--height-1/2',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--sm:height-1/4',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--md:height-max',
      );
      expect(getByText('DEPRECATED Box content')).toHaveClass(
        'box--lg:height-min',
      );
    });
  });
  describe('polymorphic "as" prop', () => {
    it('should render the Box with different html root elements', () => {
      const { container } = render(
        <>
          <Box>Box as div (default)</Box>
          <Box as="ul">Box as ul</Box>
          <Box as="button">Box as button</Box>
        </>,
      );
      expect(container.querySelector('div')).toHaveTextContent(
        'Box as div (default)',
      );
      expect(container.querySelector('ul')).toHaveTextContent('Box as ul');
      expect(container.querySelector('button')).toHaveTextContent(
        'Box as button',
      );
    });
  });
  it('should accept a ref prop that is passed down to the html element', () => {
    const mockRef = jest.fn();
    render(<Box ref={mockRef} />);
    expect(mockRef).toHaveBeenCalledTimes(1);
  });
});
