import * as React from 'react';
import { render } from '@testing-library/react';
import {
  BorderStyle,
  Display,
  FlexDirection,
  FlexWrap,
  AlignItems,
  JustifyContent,
  TextAlign,
  BlockSize,
  BorderRadius,
  BorderColor,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { Box } from '.';

describe('Box', () => {
  it('should render the Box without crashing', () => {
    const { getByText } = render(<Box>Box content</Box>);

    expect(getByText('Box content')).toBeDefined();
  });
  describe('margin', () => {
    it('should render the Box with the margin classes', () => {
      const { getByText } = render(
        <>
          <Box margin={0}>Box margin 0</Box>
          <Box margin={1}>Box margin 1</Box>
          <Box margin={2}>Box margin 2</Box>
          <Box margin={3}>Box margin 3</Box>
          <Box margin={4}>Box margin 4</Box>
          <Box margin={5}>Box margin 5</Box>
          <Box margin={6}>Box margin 6</Box>
          <Box margin={7}>Box margin 7</Box>
          <Box margin={8}>Box margin 8</Box>
          <Box margin={9}>Box margin 9</Box>
          <Box margin={10}>Box margin 10</Box>
          <Box margin={11}>Box margin 11</Box>
          <Box margin={12}>Box margin 12</Box>
          <Box margin="auto">Box margin auto</Box>
        </>,
      );

      expect(getByText('Box margin 0')).toHaveClass('mm-box--margin-0');
      expect(getByText('Box margin 1')).toHaveClass('mm-box--margin-1');
      expect(getByText('Box margin 2')).toHaveClass('mm-box--margin-2');
      expect(getByText('Box margin 3')).toHaveClass('mm-box--margin-3');
      expect(getByText('Box margin 4')).toHaveClass('mm-box--margin-4');
      expect(getByText('Box margin 5')).toHaveClass('mm-box--margin-5');
      expect(getByText('Box margin 6')).toHaveClass('mm-box--margin-6');
      expect(getByText('Box margin 7')).toHaveClass('mm-box--margin-7');
      expect(getByText('Box margin 8')).toHaveClass('mm-box--margin-8');
      expect(getByText('Box margin 9')).toHaveClass('mm-box--margin-9');
      expect(getByText('Box margin 10')).toHaveClass('mm-box--margin-10');
      expect(getByText('Box margin 11')).toHaveClass('mm-box--margin-11');
      expect(getByText('Box margin 12')).toHaveClass('mm-box--margin-12');
      expect(getByText('Box margin auto')).toHaveClass('mm-box--margin-auto');
    });
    it('should render the Box with the responsive margin classes', () => {
      const { getByText } = render(
        <>
          <Box margin={[0, 0, 0, 0]}>Box margin 0</Box>
          <Box margin={[1, 1, 1, 1]}>Box margin 1</Box>
          <Box margin={[2, 2, 2, 2]}>Box margin 2</Box>
          <Box margin={[3, 3, 3, 3]}>Box margin 3</Box>
          <Box margin={[4, 4, 4, 4]}>Box margin 4</Box>
          <Box margin={[5, 5, 5, 5]}>Box margin 5</Box>
          <Box margin={[6, 6, 6, 6]}>Box margin 6</Box>
          <Box margin={[7, 7, 7, 7]}>Box margin 7</Box>
          <Box margin={[8, 8, 8, 8]}>Box margin 8</Box>
          <Box margin={[9, 9, 9, 9]}>Box margin 9</Box>
          <Box margin={[10, 10, 10, 10]}>Box margin 10</Box>
          <Box margin={[11, 11, 11, 11]}>Box margin 11</Box>
          <Box margin={[12, 12, 12, 12]}>Box margin 12</Box>
          <Box margin={['auto', 'auto', 'auto', 'auto']}>Box margin auto</Box>
        </>,
      );
      expect(getByText('Box margin 0')).toHaveClass(
        'mm-box--margin-0 mm-box--sm:margin-0 mm-box--md:margin-0 mm-box--lg:margin-0',
      );
      expect(getByText('Box margin 1')).toHaveClass(
        'mm-box--margin-1 mm-box--sm:margin-1 mm-box--md:margin-1 mm-box--lg:margin-1',
      );
      expect(getByText('Box margin 2')).toHaveClass(
        'mm-box--margin-2 mm-box--sm:margin-2 mm-box--md:margin-2 mm-box--lg:margin-2',
      );
      expect(getByText('Box margin 3')).toHaveClass(
        'mm-box--margin-3 mm-box--sm:margin-3 mm-box--md:margin-3 mm-box--lg:margin-3',
      );
      expect(getByText('Box margin 4')).toHaveClass(
        'mm-box--margin-4 mm-box--sm:margin-4 mm-box--md:margin-4 mm-box--lg:margin-4',
      );
      expect(getByText('Box margin 5')).toHaveClass(
        'mm-box--margin-5 mm-box--sm:margin-5 mm-box--md:margin-5 mm-box--lg:margin-5',
      );
      expect(getByText('Box margin 6')).toHaveClass(
        'mm-box--margin-6 mm-box--sm:margin-6 mm-box--md:margin-6 mm-box--lg:margin-6',
      );
      expect(getByText('Box margin 7')).toHaveClass(
        'mm-box--margin-7 mm-box--sm:margin-7 mm-box--md:margin-7 mm-box--lg:margin-7',
      );
      expect(getByText('Box margin 8')).toHaveClass(
        'mm-box--margin-8 mm-box--sm:margin-8 mm-box--md:margin-8 mm-box--lg:margin-8',
      );
      expect(getByText('Box margin 9')).toHaveClass(
        'mm-box--margin-9 mm-box--sm:margin-9 mm-box--md:margin-9 mm-box--lg:margin-9',
      );
      expect(getByText('Box margin 10')).toHaveClass(
        'mm-box--margin-10 mm-box--sm:margin-10 mm-box--md:margin-10 mm-box--lg:margin-10',
      );
      expect(getByText('Box margin 11')).toHaveClass(
        'mm-box--margin-11 mm-box--sm:margin-11 mm-box--md:margin-11 mm-box--lg:margin-11',
      );
      expect(getByText('Box margin 12')).toHaveClass(
        'mm-box--margin-12 mm-box--sm:margin-12 mm-box--md:margin-12 mm-box--lg:margin-12',
      );

      expect(getByText('Box margin auto')).toHaveClass(
        'mm-box--margin-auto mm-box--sm:margin-auto mm-box--md:margin-auto mm-box--lg:margin-auto',
      );
    });
    it('should render the Box with the marginTop classes', () => {
      const { getByText } = render(
        <>
          <Box marginTop={0}>Box marginTop 0</Box>
          <Box marginTop={1}>Box marginTop 1</Box>
          <Box marginTop={2}>Box marginTop 2</Box>
          <Box marginTop={3}>Box marginTop 3</Box>
          <Box marginTop={4}>Box marginTop 4</Box>
          <Box marginTop={5}>Box marginTop 5</Box>
          <Box marginTop={6}>Box marginTop 6</Box>
          <Box marginTop={7}>Box marginTop 7</Box>
          <Box marginTop={8}>Box marginTop 8</Box>
          <Box marginTop={9}>Box marginTop 9</Box>
          <Box marginTop={10}>Box marginTop 10</Box>
          <Box marginTop={11}>Box marginTop 11</Box>
          <Box marginTop={12}>Box marginTop 12</Box>
          <Box marginTop="auto">Box marginTop auto</Box>
        </>,
      );

      expect(getByText('Box marginTop 0')).toHaveClass('mm-box--margin-top-0');
      expect(getByText('Box marginTop 1')).toHaveClass('mm-box--margin-top-1');
      expect(getByText('Box marginTop 2')).toHaveClass('mm-box--margin-top-2');
      expect(getByText('Box marginTop 3')).toHaveClass('mm-box--margin-top-3');
      expect(getByText('Box marginTop 4')).toHaveClass('mm-box--margin-top-4');
      expect(getByText('Box marginTop 5')).toHaveClass('mm-box--margin-top-5');
      expect(getByText('Box marginTop 6')).toHaveClass('mm-box--margin-top-6');
      expect(getByText('Box marginTop 7')).toHaveClass('mm-box--margin-top-7');
      expect(getByText('Box marginTop 8')).toHaveClass('mm-box--margin-top-8');
      expect(getByText('Box marginTop 9')).toHaveClass('mm-box--margin-top-9');
      expect(getByText('Box marginTop 10')).toHaveClass(
        'mm-box--margin-top-10',
      );
      expect(getByText('Box marginTop 11')).toHaveClass(
        'mm-box--margin-top-11',
      );
      expect(getByText('Box marginTop 12')).toHaveClass(
        'mm-box--margin-top-12',
      );
      expect(getByText('Box marginTop auto')).toHaveClass(
        'mm-box--margin-top-auto',
      );
    });
    it('should render the Box with the responsive marginTop classes', () => {
      const { getByText } = render(
        <>
          <Box marginTop={[0, 0, 0, 0]}>Box marginTop 0</Box>
          <Box marginTop={[1, 1, 1, 1]}>Box marginTop 1</Box>
          <Box marginTop={[2, 2, 2, 2]}>Box marginTop 2</Box>
          <Box marginTop={[3, 3, 3, 3]}>Box marginTop 3</Box>
          <Box marginTop={[4, 4, 4, 4]}>Box marginTop 4</Box>
          <Box marginTop={[5, 5, 5, 5]}>Box marginTop 5</Box>
          <Box marginTop={[6, 6, 6, 6]}>Box marginTop 6</Box>
          <Box marginTop={[7, 7, 7, 7]}>Box marginTop 7</Box>
          <Box marginTop={[8, 8, 8, 8]}>Box marginTop 8</Box>
          <Box marginTop={[9, 9, 9, 9]}>Box marginTop 9</Box>
          <Box marginTop={[10, 10, 10, 10]}>Box marginTop 10</Box>
          <Box marginTop={[11, 11, 11, 11]}>Box marginTop 11</Box>
          <Box marginTop={[12, 12, 12, 12]}>Box marginTop 12</Box>
          <Box marginTop={['auto', 'auto', 'auto', 'auto']}>
            Box marginTop auto
          </Box>
        </>,
      );
      expect(getByText('Box marginTop 0')).toHaveClass(
        'mm-box--margin-top-0 mm-box--sm:margin-top-0 mm-box--md:margin-top-0 mm-box--lg:margin-top-0',
      );
      expect(getByText('Box marginTop 1')).toHaveClass(
        'mm-box--margin-top-1 mm-box--sm:margin-top-1 mm-box--md:margin-top-1 mm-box--lg:margin-top-1',
      );
      expect(getByText('Box marginTop 2')).toHaveClass(
        'mm-box--margin-top-2 mm-box--sm:margin-top-2 mm-box--md:margin-top-2 mm-box--lg:margin-top-2',
      );
      expect(getByText('Box marginTop 3')).toHaveClass(
        'mm-box--margin-top-3 mm-box--sm:margin-top-3 mm-box--md:margin-top-3 mm-box--lg:margin-top-3',
      );
      expect(getByText('Box marginTop 4')).toHaveClass(
        'mm-box--margin-top-4 mm-box--sm:margin-top-4 mm-box--md:margin-top-4 mm-box--lg:margin-top-4',
      );
      expect(getByText('Box marginTop 5')).toHaveClass(
        'mm-box--margin-top-5 mm-box--sm:margin-top-5 mm-box--md:margin-top-5 mm-box--lg:margin-top-5',
      );
      expect(getByText('Box marginTop 6')).toHaveClass(
        'mm-box--margin-top-6 mm-box--sm:margin-top-6 mm-box--md:margin-top-6 mm-box--lg:margin-top-6',
      );
      expect(getByText('Box marginTop 7')).toHaveClass(
        'mm-box--margin-top-7 mm-box--sm:margin-top-7 mm-box--md:margin-top-7 mm-box--lg:margin-top-7',
      );
      expect(getByText('Box marginTop 8')).toHaveClass(
        'mm-box--margin-top-8 mm-box--sm:margin-top-8 mm-box--md:margin-top-8 mm-box--lg:margin-top-8',
      );
      expect(getByText('Box marginTop 9')).toHaveClass(
        'mm-box--margin-top-9 mm-box--sm:margin-top-9 mm-box--md:margin-top-9 mm-box--lg:margin-top-9',
      );
      expect(getByText('Box marginTop 10')).toHaveClass(
        'mm-box--margin-top-10 mm-box--sm:margin-top-10 mm-box--md:margin-top-10 mm-box--lg:margin-top-10',
      );
      expect(getByText('Box marginTop 11')).toHaveClass(
        'mm-box--margin-top-11 mm-box--sm:margin-top-11 mm-box--md:margin-top-11 mm-box--lg:margin-top-11',
      );
      expect(getByText('Box marginTop 12')).toHaveClass(
        'mm-box--margin-top-12 mm-box--sm:margin-top-12 mm-box--md:margin-top-12 mm-box--lg:margin-top-12',
      );

      expect(getByText('Box marginTop auto')).toHaveClass(
        'mm-box--margin-top-auto mm-box--sm:margin-top-auto mm-box--md:margin-top-auto mm-box--lg:margin-top-auto',
      );
    });
    it('should render the Box with the marginRight classes', () => {
      const { getByText } = render(
        <>
          <Box marginRight={0}>Box marginRight 0</Box>
          <Box marginRight={1}>Box marginRight 1</Box>
          <Box marginRight={2}>Box marginRight 2</Box>
          <Box marginRight={3}>Box marginRight 3</Box>
          <Box marginRight={4}>Box marginRight 4</Box>
          <Box marginRight={5}>Box marginRight 5</Box>
          <Box marginRight={6}>Box marginRight 6</Box>
          <Box marginRight={7}>Box marginRight 7</Box>
          <Box marginRight={8}>Box marginRight 8</Box>
          <Box marginRight={9}>Box marginRight 9</Box>
          <Box marginRight={10}>Box marginRight 10</Box>
          <Box marginRight={11}>Box marginRight 11</Box>
          <Box marginRight={12}>Box marginRight 12</Box>
          <Box marginRight="auto">Box marginRight auto</Box>
        </>,
      );

      expect(getByText('Box marginRight 0')).toHaveClass(
        'mm-box--margin-right-0',
      );
      expect(getByText('Box marginRight 1')).toHaveClass(
        'mm-box--margin-right-1',
      );
      expect(getByText('Box marginRight 2')).toHaveClass(
        'mm-box--margin-right-2',
      );
      expect(getByText('Box marginRight 3')).toHaveClass(
        'mm-box--margin-right-3',
      );
      expect(getByText('Box marginRight 4')).toHaveClass(
        'mm-box--margin-right-4',
      );
      expect(getByText('Box marginRight 5')).toHaveClass(
        'mm-box--margin-right-5',
      );
      expect(getByText('Box marginRight 6')).toHaveClass(
        'mm-box--margin-right-6',
      );
      expect(getByText('Box marginRight 7')).toHaveClass(
        'mm-box--margin-right-7',
      );
      expect(getByText('Box marginRight 8')).toHaveClass(
        'mm-box--margin-right-8',
      );
      expect(getByText('Box marginRight 9')).toHaveClass(
        'mm-box--margin-right-9',
      );
      expect(getByText('Box marginRight 10')).toHaveClass(
        'mm-box--margin-right-10',
      );
      expect(getByText('Box marginRight 11')).toHaveClass(
        'mm-box--margin-right-11',
      );
      expect(getByText('Box marginRight 12')).toHaveClass(
        'mm-box--margin-right-12',
      );
      expect(getByText('Box marginRight auto')).toHaveClass(
        'mm-box--margin-right-auto',
      );
    });
    it('should render the Box with the responsive marginRight classes', () => {
      const { getByText } = render(
        <>
          <Box marginRight={[0, 0, 0, 0]}>Box marginRight 0</Box>
          <Box marginRight={[1, 1, 1, 1]}>Box marginRight 1</Box>
          <Box marginRight={[2, 2, 2, 2]}>Box marginRight 2</Box>
          <Box marginRight={[3, 3, 3, 3]}>Box marginRight 3</Box>
          <Box marginRight={[4, 4, 4, 4]}>Box marginRight 4</Box>
          <Box marginRight={[5, 5, 5, 5]}>Box marginRight 5</Box>
          <Box marginRight={[6, 6, 6, 6]}>Box marginRight 6</Box>
          <Box marginRight={[7, 7, 7, 7]}>Box marginRight 7</Box>
          <Box marginRight={[8, 8, 8, 8]}>Box marginRight 8</Box>
          <Box marginRight={[9, 9, 9, 9]}>Box marginRight 9</Box>
          <Box marginRight={[10, 10, 10, 10]}>Box marginRight 10</Box>
          <Box marginRight={[11, 11, 11, 11]}>Box marginRight 11</Box>
          <Box marginRight={[12, 12, 12, 12]}>Box marginRight 12</Box>
          <Box marginRight={['auto', 'auto', 'auto', 'auto']}>
            Box marginRight auto
          </Box>
        </>,
      );
      expect(getByText('Box marginRight 0')).toHaveClass(
        'mm-box--margin-right-0 mm-box--sm:margin-right-0 mm-box--md:margin-right-0 mm-box--lg:margin-right-0',
      );
      expect(getByText('Box marginRight 1')).toHaveClass(
        'mm-box--margin-right-1 mm-box--sm:margin-right-1 mm-box--md:margin-right-1 mm-box--lg:margin-right-1',
      );
      expect(getByText('Box marginRight 2')).toHaveClass(
        'mm-box--margin-right-2 mm-box--sm:margin-right-2 mm-box--md:margin-right-2 mm-box--lg:margin-right-2',
      );
      expect(getByText('Box marginRight 3')).toHaveClass(
        'mm-box--margin-right-3 mm-box--sm:margin-right-3 mm-box--md:margin-right-3 mm-box--lg:margin-right-3',
      );
      expect(getByText('Box marginRight 4')).toHaveClass(
        'mm-box--margin-right-4 mm-box--sm:margin-right-4 mm-box--md:margin-right-4 mm-box--lg:margin-right-4',
      );
      expect(getByText('Box marginRight 5')).toHaveClass(
        'mm-box--margin-right-5 mm-box--sm:margin-right-5 mm-box--md:margin-right-5 mm-box--lg:margin-right-5',
      );
      expect(getByText('Box marginRight 6')).toHaveClass(
        'mm-box--margin-right-6 mm-box--sm:margin-right-6 mm-box--md:margin-right-6 mm-box--lg:margin-right-6',
      );
      expect(getByText('Box marginRight 7')).toHaveClass(
        'mm-box--margin-right-7 mm-box--sm:margin-right-7 mm-box--md:margin-right-7 mm-box--lg:margin-right-7',
      );
      expect(getByText('Box marginRight 8')).toHaveClass(
        'mm-box--margin-right-8 mm-box--sm:margin-right-8 mm-box--md:margin-right-8 mm-box--lg:margin-right-8',
      );
      expect(getByText('Box marginRight 9')).toHaveClass(
        'mm-box--margin-right-9 mm-box--sm:margin-right-9 mm-box--md:margin-right-9 mm-box--lg:margin-right-9',
      );
      expect(getByText('Box marginRight 10')).toHaveClass(
        'mm-box--margin-right-10 mm-box--sm:margin-right-10 mm-box--md:margin-right-10 mm-box--lg:margin-right-10',
      );
      expect(getByText('Box marginRight 11')).toHaveClass(
        'mm-box--margin-right-11 mm-box--sm:margin-right-11 mm-box--md:margin-right-11 mm-box--lg:margin-right-11',
      );
      expect(getByText('Box marginRight 12')).toHaveClass(
        'mm-box--margin-right-12 mm-box--sm:margin-right-12 mm-box--md:margin-right-12 mm-box--lg:margin-right-12',
      );

      expect(getByText('Box marginRight auto')).toHaveClass(
        'mm-box--margin-right-auto mm-box--sm:margin-right-auto mm-box--md:margin-right-auto mm-box--lg:margin-right-auto',
      );
    });
    it('should render the Box with the marginBottom classes', () => {
      const { getByText } = render(
        <>
          <Box marginBottom={0}>Box marginBottom 0</Box>
          <Box marginBottom={1}>Box marginBottom 1</Box>
          <Box marginBottom={2}>Box marginBottom 2</Box>
          <Box marginBottom={3}>Box marginBottom 3</Box>
          <Box marginBottom={4}>Box marginBottom 4</Box>
          <Box marginBottom={5}>Box marginBottom 5</Box>
          <Box marginBottom={6}>Box marginBottom 6</Box>
          <Box marginBottom={7}>Box marginBottom 7</Box>
          <Box marginBottom={8}>Box marginBottom 8</Box>
          <Box marginBottom={9}>Box marginBottom 9</Box>
          <Box marginBottom={10}>Box marginBottom 10</Box>
          <Box marginBottom={11}>Box marginBottom 11</Box>
          <Box marginBottom={12}>Box marginBottom 12</Box>
          <Box marginBottom="auto">Box marginBottom auto</Box>
        </>,
      );

      expect(getByText('Box marginBottom 0')).toHaveClass(
        'mm-box--margin-bottom-0',
      );
      expect(getByText('Box marginBottom 1')).toHaveClass(
        'mm-box--margin-bottom-1',
      );
      expect(getByText('Box marginBottom 2')).toHaveClass(
        'mm-box--margin-bottom-2',
      );
      expect(getByText('Box marginBottom 3')).toHaveClass(
        'mm-box--margin-bottom-3',
      );
      expect(getByText('Box marginBottom 4')).toHaveClass(
        'mm-box--margin-bottom-4',
      );
      expect(getByText('Box marginBottom 5')).toHaveClass(
        'mm-box--margin-bottom-5',
      );
      expect(getByText('Box marginBottom 6')).toHaveClass(
        'mm-box--margin-bottom-6',
      );
      expect(getByText('Box marginBottom 7')).toHaveClass(
        'mm-box--margin-bottom-7',
      );
      expect(getByText('Box marginBottom 8')).toHaveClass(
        'mm-box--margin-bottom-8',
      );
      expect(getByText('Box marginBottom 9')).toHaveClass(
        'mm-box--margin-bottom-9',
      );
      expect(getByText('Box marginBottom 10')).toHaveClass(
        'mm-box--margin-bottom-10',
      );
      expect(getByText('Box marginBottom 11')).toHaveClass(
        'mm-box--margin-bottom-11',
      );
      expect(getByText('Box marginBottom 12')).toHaveClass(
        'mm-box--margin-bottom-12',
      );
      expect(getByText('Box marginBottom auto')).toHaveClass(
        'mm-box--margin-bottom-auto',
      );
    });
    it('should render the Box with the responsive marginBottom classes', () => {
      const { getByText } = render(
        <>
          <Box marginBottom={[0, 0, 0, 0]}>Box marginBottom 0</Box>
          <Box marginBottom={[1, 1, 1, 1]}>Box marginBottom 1</Box>
          <Box marginBottom={[2, 2, 2, 2]}>Box marginBottom 2</Box>
          <Box marginBottom={[3, 3, 3, 3]}>Box marginBottom 3</Box>
          <Box marginBottom={[4, 4, 4, 4]}>Box marginBottom 4</Box>
          <Box marginBottom={[5, 5, 5, 5]}>Box marginBottom 5</Box>
          <Box marginBottom={[6, 6, 6, 6]}>Box marginBottom 6</Box>
          <Box marginBottom={[7, 7, 7, 7]}>Box marginBottom 7</Box>
          <Box marginBottom={[8, 8, 8, 8]}>Box marginBottom 8</Box>
          <Box marginBottom={[9, 9, 9, 9]}>Box marginBottom 9</Box>
          <Box marginBottom={[10, 10, 10, 10]}>Box marginBottom 10</Box>
          <Box marginBottom={[11, 11, 11, 11]}>Box marginBottom 11</Box>
          <Box marginBottom={[12, 12, 12, 12]}>Box marginBottom 12</Box>
          <Box marginBottom={['auto', 'auto', 'auto', 'auto']}>
            Box marginBottom auto
          </Box>
        </>,
      );
      expect(getByText('Box marginBottom 0')).toHaveClass(
        'mm-box--margin-bottom-0 mm-box--sm:margin-bottom-0 mm-box--md:margin-bottom-0 mm-box--lg:margin-bottom-0',
      );
      expect(getByText('Box marginBottom 1')).toHaveClass(
        'mm-box--margin-bottom-1 mm-box--sm:margin-bottom-1 mm-box--md:margin-bottom-1 mm-box--lg:margin-bottom-1',
      );
      expect(getByText('Box marginBottom 2')).toHaveClass(
        'mm-box--margin-bottom-2 mm-box--sm:margin-bottom-2 mm-box--md:margin-bottom-2 mm-box--lg:margin-bottom-2',
      );
      expect(getByText('Box marginBottom 3')).toHaveClass(
        'mm-box--margin-bottom-3 mm-box--sm:margin-bottom-3 mm-box--md:margin-bottom-3 mm-box--lg:margin-bottom-3',
      );
      expect(getByText('Box marginBottom 4')).toHaveClass(
        'mm-box--margin-bottom-4 mm-box--sm:margin-bottom-4 mm-box--md:margin-bottom-4 mm-box--lg:margin-bottom-4',
      );
      expect(getByText('Box marginBottom 5')).toHaveClass(
        'mm-box--margin-bottom-5 mm-box--sm:margin-bottom-5 mm-box--md:margin-bottom-5 mm-box--lg:margin-bottom-5',
      );
      expect(getByText('Box marginBottom 6')).toHaveClass(
        'mm-box--margin-bottom-6 mm-box--sm:margin-bottom-6 mm-box--md:margin-bottom-6 mm-box--lg:margin-bottom-6',
      );
      expect(getByText('Box marginBottom 7')).toHaveClass(
        'mm-box--margin-bottom-7 mm-box--sm:margin-bottom-7 mm-box--md:margin-bottom-7 mm-box--lg:margin-bottom-7',
      );
      expect(getByText('Box marginBottom 8')).toHaveClass(
        'mm-box--margin-bottom-8 mm-box--sm:margin-bottom-8 mm-box--md:margin-bottom-8 mm-box--lg:margin-bottom-8',
      );
      expect(getByText('Box marginBottom 9')).toHaveClass(
        'mm-box--margin-bottom-9 mm-box--sm:margin-bottom-9 mm-box--md:margin-bottom-9 mm-box--lg:margin-bottom-9',
      );
      expect(getByText('Box marginBottom 10')).toHaveClass(
        'mm-box--margin-bottom-10 mm-box--sm:margin-bottom-10 mm-box--md:margin-bottom-10 mm-box--lg:margin-bottom-10',
      );
      expect(getByText('Box marginBottom 11')).toHaveClass(
        'mm-box--margin-bottom-11 mm-box--sm:margin-bottom-11 mm-box--md:margin-bottom-11 mm-box--lg:margin-bottom-11',
      );
      expect(getByText('Box marginBottom 12')).toHaveClass(
        'mm-box--margin-bottom-12 mm-box--sm:margin-bottom-12 mm-box--md:margin-bottom-12 mm-box--lg:margin-bottom-12',
      );

      expect(getByText('Box marginBottom auto')).toHaveClass(
        'mm-box--margin-bottom-auto mm-box--sm:margin-bottom-auto mm-box--md:margin-bottom-auto mm-box--lg:margin-bottom-auto',
      );
    });
    it('should render the Box with the marginLeft classes', () => {
      const { getByText } = render(
        <>
          <Box marginLeft={0}>Box marginLeft 0</Box>
          <Box marginLeft={1}>Box marginLeft 1</Box>
          <Box marginLeft={2}>Box marginLeft 2</Box>
          <Box marginLeft={3}>Box marginLeft 3</Box>
          <Box marginLeft={4}>Box marginLeft 4</Box>
          <Box marginLeft={5}>Box marginLeft 5</Box>
          <Box marginLeft={6}>Box marginLeft 6</Box>
          <Box marginLeft={7}>Box marginLeft 7</Box>
          <Box marginLeft={8}>Box marginLeft 8</Box>
          <Box marginLeft={9}>Box marginLeft 9</Box>
          <Box marginLeft={10}>Box marginLeft 10</Box>
          <Box marginLeft={11}>Box marginLeft 11</Box>
          <Box marginLeft={12}>Box marginLeft 12</Box>
          <Box marginLeft="auto">Box marginLeft auto</Box>
        </>,
      );

      expect(getByText('Box marginLeft 0')).toHaveClass(
        'mm-box--margin-left-0',
      );
      expect(getByText('Box marginLeft 1')).toHaveClass(
        'mm-box--margin-left-1',
      );
      expect(getByText('Box marginLeft 2')).toHaveClass(
        'mm-box--margin-left-2',
      );
      expect(getByText('Box marginLeft 3')).toHaveClass(
        'mm-box--margin-left-3',
      );
      expect(getByText('Box marginLeft 4')).toHaveClass(
        'mm-box--margin-left-4',
      );
      expect(getByText('Box marginLeft 5')).toHaveClass(
        'mm-box--margin-left-5',
      );
      expect(getByText('Box marginLeft 6')).toHaveClass(
        'mm-box--margin-left-6',
      );
      expect(getByText('Box marginLeft 7')).toHaveClass(
        'mm-box--margin-left-7',
      );
      expect(getByText('Box marginLeft 8')).toHaveClass(
        'mm-box--margin-left-8',
      );
      expect(getByText('Box marginLeft 9')).toHaveClass(
        'mm-box--margin-left-9',
      );
      expect(getByText('Box marginLeft 10')).toHaveClass(
        'mm-box--margin-left-10',
      );
      expect(getByText('Box marginLeft 11')).toHaveClass(
        'mm-box--margin-left-11',
      );
      expect(getByText('Box marginLeft 12')).toHaveClass(
        'mm-box--margin-left-12',
      );
      expect(getByText('Box marginLeft auto')).toHaveClass(
        'mm-box--margin-left-auto',
      );
    });
    it('should render the Box with the responsive marginLeft classes', () => {
      const { getByText } = render(
        <>
          <Box marginLeft={[0, 0, 0, 0]}>Box marginLeft 0</Box>
          <Box marginLeft={[1, 1, 1, 1]}>Box marginLeft 1</Box>
          <Box marginLeft={[2, 2, 2, 2]}>Box marginLeft 2</Box>
          <Box marginLeft={[3, 3, 3, 3]}>Box marginLeft 3</Box>
          <Box marginLeft={[4, 4, 4, 4]}>Box marginLeft 4</Box>
          <Box marginLeft={[5, 5, 5, 5]}>Box marginLeft 5</Box>
          <Box marginLeft={[6, 6, 6, 6]}>Box marginLeft 6</Box>
          <Box marginLeft={[7, 7, 7, 7]}>Box marginLeft 7</Box>
          <Box marginLeft={[8, 8, 8, 8]}>Box marginLeft 8</Box>
          <Box marginLeft={[9, 9, 9, 9]}>Box marginLeft 9</Box>
          <Box marginLeft={[10, 10, 10, 10]}>Box marginLeft 10</Box>
          <Box marginLeft={[11, 11, 11, 11]}>Box marginLeft 11</Box>
          <Box marginLeft={[12, 12, 12, 12]}>Box marginLeft 12</Box>
          <Box marginLeft={['auto', 'auto', 'auto', 'auto']}>
            Box marginLeft auto
          </Box>
        </>,
      );
      expect(getByText('Box marginLeft 0')).toHaveClass(
        'mm-box--margin-left-0 mm-box--sm:margin-left-0 mm-box--md:margin-left-0 mm-box--lg:margin-left-0',
      );
      expect(getByText('Box marginLeft 1')).toHaveClass(
        'mm-box--margin-left-1 mm-box--sm:margin-left-1 mm-box--md:margin-left-1 mm-box--lg:margin-left-1',
      );
      expect(getByText('Box marginLeft 2')).toHaveClass(
        'mm-box--margin-left-2 mm-box--sm:margin-left-2 mm-box--md:margin-left-2 mm-box--lg:margin-left-2',
      );
      expect(getByText('Box marginLeft 3')).toHaveClass(
        'mm-box--margin-left-3 mm-box--sm:margin-left-3 mm-box--md:margin-left-3 mm-box--lg:margin-left-3',
      );
      expect(getByText('Box marginLeft 4')).toHaveClass(
        'mm-box--margin-left-4 mm-box--sm:margin-left-4 mm-box--md:margin-left-4 mm-box--lg:margin-left-4',
      );
      expect(getByText('Box marginLeft 5')).toHaveClass(
        'mm-box--margin-left-5 mm-box--sm:margin-left-5 mm-box--md:margin-left-5 mm-box--lg:margin-left-5',
      );
      expect(getByText('Box marginLeft 6')).toHaveClass(
        'mm-box--margin-left-6 mm-box--sm:margin-left-6 mm-box--md:margin-left-6 mm-box--lg:margin-left-6',
      );
      expect(getByText('Box marginLeft 7')).toHaveClass(
        'mm-box--margin-left-7 mm-box--sm:margin-left-7 mm-box--md:margin-left-7 mm-box--lg:margin-left-7',
      );
      expect(getByText('Box marginLeft 8')).toHaveClass(
        'mm-box--margin-left-8 mm-box--sm:margin-left-8 mm-box--md:margin-left-8 mm-box--lg:margin-left-8',
      );
      expect(getByText('Box marginLeft 9')).toHaveClass(
        'mm-box--margin-left-9 mm-box--sm:margin-left-9 mm-box--md:margin-left-9 mm-box--lg:margin-left-9',
      );
      expect(getByText('Box marginLeft 10')).toHaveClass(
        'mm-box--margin-left-10 mm-box--sm:margin-left-10 mm-box--md:margin-left-10 mm-box--lg:margin-left-10',
      );
      expect(getByText('Box marginLeft 11')).toHaveClass(
        'mm-box--margin-left-11 mm-box--sm:margin-left-11 mm-box--md:margin-left-11 mm-box--lg:margin-left-11',
      );
      expect(getByText('Box marginLeft 12')).toHaveClass(
        'mm-box--margin-left-12 mm-box--sm:margin-left-12 mm-box--md:margin-left-12 mm-box--lg:margin-left-12',
      );

      expect(getByText('Box marginLeft auto')).toHaveClass(
        'mm-box--margin-left-auto mm-box--sm:margin-left-auto mm-box--md:margin-left-auto mm-box--lg:margin-left-auto',
      );
    });
    it('should render the Box with the marginInline class', () => {
      const { getByText } = render(<Box marginInline={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('mm-box--margin-inline-1');
    });
    it('should render the Box with the marginInline auto class', () => {
      const { getByText } = render(<Box marginInline="auto">Box content</Box>);

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-auto',
      );
    });
    it('should render the Box with the responsive marginInline classes', () => {
      const { getByText } = render(
        <Box marginInline={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('mm-box--margin-inline-1');
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:margin-inline-auto',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:margin-inline-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:margin-inline-4',
      );
    });
    it('should render the Box with the marginInlineStart class', () => {
      const { getByText } = render(
        <Box marginInlineStart={1}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-start-1',
      );
    });
    it('should render the Box with the marginInlineStart auto class', () => {
      const { getByText } = render(
        <Box marginInlineStart="auto">Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-start-auto',
      );
    });
    it('should render the Box with the responsive marginInlineStart classes', () => {
      const { getByText } = render(
        <Box marginInlineStart={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-start-1',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:margin-inline-start-auto',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:margin-inline-start-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:margin-inline-start-4',
      );
    });
    it('should render the Box with the marginInlineEnd class', () => {
      const { getByText } = render(<Box marginInlineEnd={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-end-1',
      );
    });
    it('should render the Box with the marginInlineEnd auto class', () => {
      const { getByText } = render(
        <Box marginInlineEnd="auto">Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-end-auto',
      );
    });
    it('should render the Box with the responsive marginInlineEnd classes', () => {
      const { getByText } = render(
        <Box marginInlineEnd={[1, 'auto', 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--margin-inline-end-1',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:margin-inline-end-auto',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:margin-inline-end-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:margin-inline-end-4',
      );
    });
  });
  describe('padding', () => {
    it('should render the Box with the padding classes', () => {
      const { getByText } = render(
        <>
          <Box padding={0}>Box padding 0</Box>
          <Box padding={1}>Box padding 1</Box>
          <Box padding={2}>Box padding 2</Box>
          <Box padding={3}>Box padding 3</Box>
          <Box padding={4}>Box padding 4</Box>
          <Box padding={5}>Box padding 5</Box>
          <Box padding={6}>Box padding 6</Box>
          <Box padding={7}>Box padding 7</Box>
          <Box padding={8}>Box padding 8</Box>
          <Box padding={9}>Box padding 9</Box>
          <Box padding={10}>Box padding 10</Box>
          <Box padding={11}>Box padding 11</Box>
          <Box padding={12}>Box padding 12</Box>
        </>,
      );

      expect(getByText('Box padding 0')).toHaveClass('mm-box--padding-0');
      expect(getByText('Box padding 1')).toHaveClass('mm-box--padding-1');
      expect(getByText('Box padding 2')).toHaveClass('mm-box--padding-2');
      expect(getByText('Box padding 3')).toHaveClass('mm-box--padding-3');
      expect(getByText('Box padding 4')).toHaveClass('mm-box--padding-4');
      expect(getByText('Box padding 5')).toHaveClass('mm-box--padding-5');
      expect(getByText('Box padding 6')).toHaveClass('mm-box--padding-6');
      expect(getByText('Box padding 7')).toHaveClass('mm-box--padding-7');
      expect(getByText('Box padding 8')).toHaveClass('mm-box--padding-8');
      expect(getByText('Box padding 9')).toHaveClass('mm-box--padding-9');
      expect(getByText('Box padding 10')).toHaveClass('mm-box--padding-10');
      expect(getByText('Box padding 11')).toHaveClass('mm-box--padding-11');
      expect(getByText('Box padding 12')).toHaveClass('mm-box--padding-12');
    });
    it('should render the Box with the responsive padding classes', () => {
      const { getByText } = render(
        <>
          <Box padding={[0, 0, 0, 0]}>Box padding 0</Box>
          <Box padding={[1, 1, 1, 1]}>Box padding 1</Box>
          <Box padding={[2, 2, 2, 2]}>Box padding 2</Box>
          <Box padding={[3, 3, 3, 3]}>Box padding 3</Box>
          <Box padding={[4, 4, 4, 4]}>Box padding 4</Box>
          <Box padding={[5, 5, 5, 5]}>Box padding 5</Box>
          <Box padding={[6, 6, 6, 6]}>Box padding 6</Box>
          <Box padding={[7, 7, 7, 7]}>Box padding 7</Box>
          <Box padding={[8, 8, 8, 8]}>Box padding 8</Box>
          <Box padding={[9, 9, 9, 9]}>Box padding 9</Box>
          <Box padding={[10, 10, 10, 10]}>Box padding 10</Box>
          <Box padding={[11, 11, 11, 11]}>Box padding 11</Box>
          <Box padding={[12, 12, 12, 12]}>Box padding 12</Box>
        </>,
      );
      expect(getByText('Box padding 0')).toHaveClass(
        'mm-box--padding-0 mm-box--sm:padding-0 mm-box--md:padding-0 mm-box--lg:padding-0',
      );
      expect(getByText('Box padding 1')).toHaveClass(
        'mm-box--padding-1 mm-box--sm:padding-1 mm-box--md:padding-1 mm-box--lg:padding-1',
      );
      expect(getByText('Box padding 2')).toHaveClass(
        'mm-box--padding-2 mm-box--sm:padding-2 mm-box--md:padding-2 mm-box--lg:padding-2',
      );
      expect(getByText('Box padding 3')).toHaveClass(
        'mm-box--padding-3 mm-box--sm:padding-3 mm-box--md:padding-3 mm-box--lg:padding-3',
      );
      expect(getByText('Box padding 4')).toHaveClass(
        'mm-box--padding-4 mm-box--sm:padding-4 mm-box--md:padding-4 mm-box--lg:padding-4',
      );
      expect(getByText('Box padding 5')).toHaveClass(
        'mm-box--padding-5 mm-box--sm:padding-5 mm-box--md:padding-5 mm-box--lg:padding-5',
      );
      expect(getByText('Box padding 6')).toHaveClass(
        'mm-box--padding-6 mm-box--sm:padding-6 mm-box--md:padding-6 mm-box--lg:padding-6',
      );
      expect(getByText('Box padding 7')).toHaveClass(
        'mm-box--padding-7 mm-box--sm:padding-7 mm-box--md:padding-7 mm-box--lg:padding-7',
      );
      expect(getByText('Box padding 8')).toHaveClass(
        'mm-box--padding-8 mm-box--sm:padding-8 mm-box--md:padding-8 mm-box--lg:padding-8',
      );
      expect(getByText('Box padding 9')).toHaveClass(
        'mm-box--padding-9 mm-box--sm:padding-9 mm-box--md:padding-9 mm-box--lg:padding-9',
      );
      expect(getByText('Box padding 10')).toHaveClass(
        'mm-box--padding-10 mm-box--sm:padding-10 mm-box--md:padding-10 mm-box--lg:padding-10',
      );
      expect(getByText('Box padding 11')).toHaveClass(
        'mm-box--padding-11 mm-box--sm:padding-11 mm-box--md:padding-11 mm-box--lg:padding-11',
      );
      expect(getByText('Box padding 12')).toHaveClass(
        'mm-box--padding-12 mm-box--sm:padding-12 mm-box--md:padding-12 mm-box--lg:padding-12',
      );
    });
    it('should render the Box with the paddingTop classes', () => {
      const { getByText } = render(
        <>
          <Box paddingTop={0}>Box paddingTop 0</Box>
          <Box paddingTop={1}>Box paddingTop 1</Box>
          <Box paddingTop={2}>Box paddingTop 2</Box>
          <Box paddingTop={3}>Box paddingTop 3</Box>
          <Box paddingTop={4}>Box paddingTop 4</Box>
          <Box paddingTop={5}>Box paddingTop 5</Box>
          <Box paddingTop={6}>Box paddingTop 6</Box>
          <Box paddingTop={7}>Box paddingTop 7</Box>
          <Box paddingTop={8}>Box paddingTop 8</Box>
          <Box paddingTop={9}>Box paddingTop 9</Box>
          <Box paddingTop={10}>Box paddingTop 10</Box>
          <Box paddingTop={11}>Box paddingTop 11</Box>
          <Box paddingTop={12}>Box paddingTop 12</Box>
        </>,
      );

      expect(getByText('Box paddingTop 0')).toHaveClass(
        'mm-box--padding-top-0',
      );
      expect(getByText('Box paddingTop 1')).toHaveClass(
        'mm-box--padding-top-1',
      );
      expect(getByText('Box paddingTop 2')).toHaveClass(
        'mm-box--padding-top-2',
      );
      expect(getByText('Box paddingTop 3')).toHaveClass(
        'mm-box--padding-top-3',
      );
      expect(getByText('Box paddingTop 4')).toHaveClass(
        'mm-box--padding-top-4',
      );
      expect(getByText('Box paddingTop 5')).toHaveClass(
        'mm-box--padding-top-5',
      );
      expect(getByText('Box paddingTop 6')).toHaveClass(
        'mm-box--padding-top-6',
      );
      expect(getByText('Box paddingTop 7')).toHaveClass(
        'mm-box--padding-top-7',
      );
      expect(getByText('Box paddingTop 8')).toHaveClass(
        'mm-box--padding-top-8',
      );
      expect(getByText('Box paddingTop 9')).toHaveClass(
        'mm-box--padding-top-9',
      );
      expect(getByText('Box paddingTop 10')).toHaveClass(
        'mm-box--padding-top-10',
      );
      expect(getByText('Box paddingTop 11')).toHaveClass(
        'mm-box--padding-top-11',
      );
      expect(getByText('Box paddingTop 12')).toHaveClass(
        'mm-box--padding-top-12',
      );
    });
    it('should render the Box with the responsive paddingTop classes', () => {
      const { getByText } = render(
        <>
          <Box paddingTop={[0, 0, 0, 0]}>Box paddingTop 0</Box>
          <Box paddingTop={[1, 1, 1, 1]}>Box paddingTop 1</Box>
          <Box paddingTop={[2, 2, 2, 2]}>Box paddingTop 2</Box>
          <Box paddingTop={[3, 3, 3, 3]}>Box paddingTop 3</Box>
          <Box paddingTop={[4, 4, 4, 4]}>Box paddingTop 4</Box>
          <Box paddingTop={[5, 5, 5, 5]}>Box paddingTop 5</Box>
          <Box paddingTop={[6, 6, 6, 6]}>Box paddingTop 6</Box>
          <Box paddingTop={[7, 7, 7, 7]}>Box paddingTop 7</Box>
          <Box paddingTop={[8, 8, 8, 8]}>Box paddingTop 8</Box>
          <Box paddingTop={[9, 9, 9, 9]}>Box paddingTop 9</Box>
          <Box paddingTop={[10, 10, 10, 10]}>Box paddingTop 10</Box>
          <Box paddingTop={[11, 11, 11, 11]}>Box paddingTop 11</Box>
          <Box paddingTop={[12, 12, 12, 12]}>Box paddingTop 12</Box>
        </>,
      );
      expect(getByText('Box paddingTop 0')).toHaveClass(
        'mm-box--padding-top-0 mm-box--sm:padding-top-0 mm-box--md:padding-top-0 mm-box--lg:padding-top-0',
      );
      expect(getByText('Box paddingTop 1')).toHaveClass(
        'mm-box--padding-top-1 mm-box--sm:padding-top-1 mm-box--md:padding-top-1 mm-box--lg:padding-top-1',
      );
      expect(getByText('Box paddingTop 2')).toHaveClass(
        'mm-box--padding-top-2 mm-box--sm:padding-top-2 mm-box--md:padding-top-2 mm-box--lg:padding-top-2',
      );
      expect(getByText('Box paddingTop 3')).toHaveClass(
        'mm-box--padding-top-3 mm-box--sm:padding-top-3 mm-box--md:padding-top-3 mm-box--lg:padding-top-3',
      );
      expect(getByText('Box paddingTop 4')).toHaveClass(
        'mm-box--padding-top-4 mm-box--sm:padding-top-4 mm-box--md:padding-top-4 mm-box--lg:padding-top-4',
      );
      expect(getByText('Box paddingTop 5')).toHaveClass(
        'mm-box--padding-top-5 mm-box--sm:padding-top-5 mm-box--md:padding-top-5 mm-box--lg:padding-top-5',
      );
      expect(getByText('Box paddingTop 6')).toHaveClass(
        'mm-box--padding-top-6 mm-box--sm:padding-top-6 mm-box--md:padding-top-6 mm-box--lg:padding-top-6',
      );
      expect(getByText('Box paddingTop 7')).toHaveClass(
        'mm-box--padding-top-7 mm-box--sm:padding-top-7 mm-box--md:padding-top-7 mm-box--lg:padding-top-7',
      );
      expect(getByText('Box paddingTop 8')).toHaveClass(
        'mm-box--padding-top-8 mm-box--sm:padding-top-8 mm-box--md:padding-top-8 mm-box--lg:padding-top-8',
      );
      expect(getByText('Box paddingTop 9')).toHaveClass(
        'mm-box--padding-top-9 mm-box--sm:padding-top-9 mm-box--md:padding-top-9 mm-box--lg:padding-top-9',
      );
      expect(getByText('Box paddingTop 10')).toHaveClass(
        'mm-box--padding-top-10 mm-box--sm:padding-top-10 mm-box--md:padding-top-10 mm-box--lg:padding-top-10',
      );
      expect(getByText('Box paddingTop 11')).toHaveClass(
        'mm-box--padding-top-11 mm-box--sm:padding-top-11 mm-box--md:padding-top-11 mm-box--lg:padding-top-11',
      );
      expect(getByText('Box paddingTop 12')).toHaveClass(
        'mm-box--padding-top-12 mm-box--sm:padding-top-12 mm-box--md:padding-top-12 mm-box--lg:padding-top-12',
      );
    });
    it('should render the Box with the paddingRight classes', () => {
      const { getByText } = render(
        <>
          <Box paddingRight={0}>Box paddingRight 0</Box>
          <Box paddingRight={1}>Box paddingRight 1</Box>
          <Box paddingRight={2}>Box paddingRight 2</Box>
          <Box paddingRight={3}>Box paddingRight 3</Box>
          <Box paddingRight={4}>Box paddingRight 4</Box>
          <Box paddingRight={5}>Box paddingRight 5</Box>
          <Box paddingRight={6}>Box paddingRight 6</Box>
          <Box paddingRight={7}>Box paddingRight 7</Box>
          <Box paddingRight={8}>Box paddingRight 8</Box>
          <Box paddingRight={9}>Box paddingRight 9</Box>
          <Box paddingRight={10}>Box paddingRight 10</Box>
          <Box paddingRight={11}>Box paddingRight 11</Box>
          <Box paddingRight={12}>Box paddingRight 12</Box>
        </>,
      );

      expect(getByText('Box paddingRight 0')).toHaveClass(
        'mm-box--padding-right-0',
      );
      expect(getByText('Box paddingRight 1')).toHaveClass(
        'mm-box--padding-right-1',
      );
      expect(getByText('Box paddingRight 2')).toHaveClass(
        'mm-box--padding-right-2',
      );
      expect(getByText('Box paddingRight 3')).toHaveClass(
        'mm-box--padding-right-3',
      );
      expect(getByText('Box paddingRight 4')).toHaveClass(
        'mm-box--padding-right-4',
      );
      expect(getByText('Box paddingRight 5')).toHaveClass(
        'mm-box--padding-right-5',
      );
      expect(getByText('Box paddingRight 6')).toHaveClass(
        'mm-box--padding-right-6',
      );
      expect(getByText('Box paddingRight 7')).toHaveClass(
        'mm-box--padding-right-7',
      );
      expect(getByText('Box paddingRight 8')).toHaveClass(
        'mm-box--padding-right-8',
      );
      expect(getByText('Box paddingRight 9')).toHaveClass(
        'mm-box--padding-right-9',
      );
      expect(getByText('Box paddingRight 10')).toHaveClass(
        'mm-box--padding-right-10',
      );
      expect(getByText('Box paddingRight 11')).toHaveClass(
        'mm-box--padding-right-11',
      );
      expect(getByText('Box paddingRight 12')).toHaveClass(
        'mm-box--padding-right-12',
      );
    });
    it('should render the Box with the responsive paddingRight classes', () => {
      const { getByText } = render(
        <>
          <Box paddingRight={[0, 0, 0, 0]}>Box paddingRight 0</Box>
          <Box paddingRight={[1, 1, 1, 1]}>Box paddingRight 1</Box>
          <Box paddingRight={[2, 2, 2, 2]}>Box paddingRight 2</Box>
          <Box paddingRight={[3, 3, 3, 3]}>Box paddingRight 3</Box>
          <Box paddingRight={[4, 4, 4, 4]}>Box paddingRight 4</Box>
          <Box paddingRight={[5, 5, 5, 5]}>Box paddingRight 5</Box>
          <Box paddingRight={[6, 6, 6, 6]}>Box paddingRight 6</Box>
          <Box paddingRight={[7, 7, 7, 7]}>Box paddingRight 7</Box>
          <Box paddingRight={[8, 8, 8, 8]}>Box paddingRight 8</Box>
          <Box paddingRight={[9, 9, 9, 9]}>Box paddingRight 9</Box>
          <Box paddingRight={[10, 10, 10, 10]}>Box paddingRight 10</Box>
          <Box paddingRight={[11, 11, 11, 11]}>Box paddingRight 11</Box>
          <Box paddingRight={[12, 12, 12, 12]}>Box paddingRight 12</Box>
        </>,
      );
      expect(getByText('Box paddingRight 0')).toHaveClass(
        'mm-box--padding-right-0 mm-box--sm:padding-right-0 mm-box--md:padding-right-0 mm-box--lg:padding-right-0',
      );
      expect(getByText('Box paddingRight 1')).toHaveClass(
        'mm-box--padding-right-1 mm-box--sm:padding-right-1 mm-box--md:padding-right-1 mm-box--lg:padding-right-1',
      );
      expect(getByText('Box paddingRight 2')).toHaveClass(
        'mm-box--padding-right-2 mm-box--sm:padding-right-2 mm-box--md:padding-right-2 mm-box--lg:padding-right-2',
      );
      expect(getByText('Box paddingRight 3')).toHaveClass(
        'mm-box--padding-right-3 mm-box--sm:padding-right-3 mm-box--md:padding-right-3 mm-box--lg:padding-right-3',
      );
      expect(getByText('Box paddingRight 4')).toHaveClass(
        'mm-box--padding-right-4 mm-box--sm:padding-right-4 mm-box--md:padding-right-4 mm-box--lg:padding-right-4',
      );
      expect(getByText('Box paddingRight 5')).toHaveClass(
        'mm-box--padding-right-5 mm-box--sm:padding-right-5 mm-box--md:padding-right-5 mm-box--lg:padding-right-5',
      );
      expect(getByText('Box paddingRight 6')).toHaveClass(
        'mm-box--padding-right-6 mm-box--sm:padding-right-6 mm-box--md:padding-right-6 mm-box--lg:padding-right-6',
      );
      expect(getByText('Box paddingRight 7')).toHaveClass(
        'mm-box--padding-right-7 mm-box--sm:padding-right-7 mm-box--md:padding-right-7 mm-box--lg:padding-right-7',
      );
      expect(getByText('Box paddingRight 8')).toHaveClass(
        'mm-box--padding-right-8 mm-box--sm:padding-right-8 mm-box--md:padding-right-8 mm-box--lg:padding-right-8',
      );
      expect(getByText('Box paddingRight 9')).toHaveClass(
        'mm-box--padding-right-9 mm-box--sm:padding-right-9 mm-box--md:padding-right-9 mm-box--lg:padding-right-9',
      );
      expect(getByText('Box paddingRight 10')).toHaveClass(
        'mm-box--padding-right-10 mm-box--sm:padding-right-10 mm-box--md:padding-right-10 mm-box--lg:padding-right-10',
      );
      expect(getByText('Box paddingRight 11')).toHaveClass(
        'mm-box--padding-right-11 mm-box--sm:padding-right-11 mm-box--md:padding-right-11 mm-box--lg:padding-right-11',
      );
      expect(getByText('Box paddingRight 12')).toHaveClass(
        'mm-box--padding-right-12 mm-box--sm:padding-right-12 mm-box--md:padding-right-12 mm-box--lg:padding-right-12',
      );
    });
    it('should render the Box with the paddingBottom classes', () => {
      const { getByText } = render(
        <>
          <Box paddingBottom={0}>Box paddingBottom 0</Box>
          <Box paddingBottom={1}>Box paddingBottom 1</Box>
          <Box paddingBottom={2}>Box paddingBottom 2</Box>
          <Box paddingBottom={3}>Box paddingBottom 3</Box>
          <Box paddingBottom={4}>Box paddingBottom 4</Box>
          <Box paddingBottom={5}>Box paddingBottom 5</Box>
          <Box paddingBottom={6}>Box paddingBottom 6</Box>
          <Box paddingBottom={7}>Box paddingBottom 7</Box>
          <Box paddingBottom={8}>Box paddingBottom 8</Box>
          <Box paddingBottom={9}>Box paddingBottom 9</Box>
          <Box paddingBottom={10}>Box paddingBottom 10</Box>
          <Box paddingBottom={11}>Box paddingBottom 11</Box>
          <Box paddingBottom={12}>Box paddingBottom 12</Box>
        </>,
      );

      expect(getByText('Box paddingBottom 0')).toHaveClass(
        'mm-box--padding-bottom-0',
      );
      expect(getByText('Box paddingBottom 1')).toHaveClass(
        'mm-box--padding-bottom-1',
      );
      expect(getByText('Box paddingBottom 2')).toHaveClass(
        'mm-box--padding-bottom-2',
      );
      expect(getByText('Box paddingBottom 3')).toHaveClass(
        'mm-box--padding-bottom-3',
      );
      expect(getByText('Box paddingBottom 4')).toHaveClass(
        'mm-box--padding-bottom-4',
      );
      expect(getByText('Box paddingBottom 5')).toHaveClass(
        'mm-box--padding-bottom-5',
      );
      expect(getByText('Box paddingBottom 6')).toHaveClass(
        'mm-box--padding-bottom-6',
      );
      expect(getByText('Box paddingBottom 7')).toHaveClass(
        'mm-box--padding-bottom-7',
      );
      expect(getByText('Box paddingBottom 8')).toHaveClass(
        'mm-box--padding-bottom-8',
      );
      expect(getByText('Box paddingBottom 9')).toHaveClass(
        'mm-box--padding-bottom-9',
      );
      expect(getByText('Box paddingBottom 10')).toHaveClass(
        'mm-box--padding-bottom-10',
      );
      expect(getByText('Box paddingBottom 11')).toHaveClass(
        'mm-box--padding-bottom-11',
      );
      expect(getByText('Box paddingBottom 12')).toHaveClass(
        'mm-box--padding-bottom-12',
      );
    });
    it('should render the Box with the responsive paddingBottom classes', () => {
      const { getByText } = render(
        <>
          <Box paddingBottom={[0, 0, 0, 0]}>Box paddingBottom 0</Box>
          <Box paddingBottom={[1, 1, 1, 1]}>Box paddingBottom 1</Box>
          <Box paddingBottom={[2, 2, 2, 2]}>Box paddingBottom 2</Box>
          <Box paddingBottom={[3, 3, 3, 3]}>Box paddingBottom 3</Box>
          <Box paddingBottom={[4, 4, 4, 4]}>Box paddingBottom 4</Box>
          <Box paddingBottom={[5, 5, 5, 5]}>Box paddingBottom 5</Box>
          <Box paddingBottom={[6, 6, 6, 6]}>Box paddingBottom 6</Box>
          <Box paddingBottom={[7, 7, 7, 7]}>Box paddingBottom 7</Box>
          <Box paddingBottom={[8, 8, 8, 8]}>Box paddingBottom 8</Box>
          <Box paddingBottom={[9, 9, 9, 9]}>Box paddingBottom 9</Box>
          <Box paddingBottom={[10, 10, 10, 10]}>Box paddingBottom 10</Box>
          <Box paddingBottom={[11, 11, 11, 11]}>Box paddingBottom 11</Box>
          <Box paddingBottom={[12, 12, 12, 12]}>Box paddingBottom 12</Box>
        </>,
      );
      expect(getByText('Box paddingBottom 0')).toHaveClass(
        'mm-box--padding-bottom-0 mm-box--sm:padding-bottom-0 mm-box--md:padding-bottom-0 mm-box--lg:padding-bottom-0',
      );
      expect(getByText('Box paddingBottom 1')).toHaveClass(
        'mm-box--padding-bottom-1 mm-box--sm:padding-bottom-1 mm-box--md:padding-bottom-1 mm-box--lg:padding-bottom-1',
      );
      expect(getByText('Box paddingBottom 2')).toHaveClass(
        'mm-box--padding-bottom-2 mm-box--sm:padding-bottom-2 mm-box--md:padding-bottom-2 mm-box--lg:padding-bottom-2',
      );
      expect(getByText('Box paddingBottom 3')).toHaveClass(
        'mm-box--padding-bottom-3 mm-box--sm:padding-bottom-3 mm-box--md:padding-bottom-3 mm-box--lg:padding-bottom-3',
      );
      expect(getByText('Box paddingBottom 4')).toHaveClass(
        'mm-box--padding-bottom-4 mm-box--sm:padding-bottom-4 mm-box--md:padding-bottom-4 mm-box--lg:padding-bottom-4',
      );
      expect(getByText('Box paddingBottom 5')).toHaveClass(
        'mm-box--padding-bottom-5 mm-box--sm:padding-bottom-5 mm-box--md:padding-bottom-5 mm-box--lg:padding-bottom-5',
      );
      expect(getByText('Box paddingBottom 6')).toHaveClass(
        'mm-box--padding-bottom-6 mm-box--sm:padding-bottom-6 mm-box--md:padding-bottom-6 mm-box--lg:padding-bottom-6',
      );
      expect(getByText('Box paddingBottom 7')).toHaveClass(
        'mm-box--padding-bottom-7 mm-box--sm:padding-bottom-7 mm-box--md:padding-bottom-7 mm-box--lg:padding-bottom-7',
      );
      expect(getByText('Box paddingBottom 8')).toHaveClass(
        'mm-box--padding-bottom-8 mm-box--sm:padding-bottom-8 mm-box--md:padding-bottom-8 mm-box--lg:padding-bottom-8',
      );
      expect(getByText('Box paddingBottom 9')).toHaveClass(
        'mm-box--padding-bottom-9 mm-box--sm:padding-bottom-9 mm-box--md:padding-bottom-9 mm-box--lg:padding-bottom-9',
      );
      expect(getByText('Box paddingBottom 10')).toHaveClass(
        'mm-box--padding-bottom-10 mm-box--sm:padding-bottom-10 mm-box--md:padding-bottom-10 mm-box--lg:padding-bottom-10',
      );
      expect(getByText('Box paddingBottom 11')).toHaveClass(
        'mm-box--padding-bottom-11 mm-box--sm:padding-bottom-11 mm-box--md:padding-bottom-11 mm-box--lg:padding-bottom-11',
      );
      expect(getByText('Box paddingBottom 12')).toHaveClass(
        'mm-box--padding-bottom-12 mm-box--sm:padding-bottom-12 mm-box--md:padding-bottom-12 mm-box--lg:padding-bottom-12',
      );
    });
    it('should render the Box with the paddingLeft classes', () => {
      const { getByText } = render(
        <>
          <Box paddingLeft={0}>Box paddingLeft 0</Box>
          <Box paddingLeft={1}>Box paddingLeft 1</Box>
          <Box paddingLeft={2}>Box paddingLeft 2</Box>
          <Box paddingLeft={3}>Box paddingLeft 3</Box>
          <Box paddingLeft={4}>Box paddingLeft 4</Box>
          <Box paddingLeft={5}>Box paddingLeft 5</Box>
          <Box paddingLeft={6}>Box paddingLeft 6</Box>
          <Box paddingLeft={7}>Box paddingLeft 7</Box>
          <Box paddingLeft={8}>Box paddingLeft 8</Box>
          <Box paddingLeft={9}>Box paddingLeft 9</Box>
          <Box paddingLeft={10}>Box paddingLeft 10</Box>
          <Box paddingLeft={11}>Box paddingLeft 11</Box>
          <Box paddingLeft={12}>Box paddingLeft 12</Box>
        </>,
      );

      expect(getByText('Box paddingLeft 0')).toHaveClass(
        'mm-box--padding-left-0',
      );
      expect(getByText('Box paddingLeft 1')).toHaveClass(
        'mm-box--padding-left-1',
      );
      expect(getByText('Box paddingLeft 2')).toHaveClass(
        'mm-box--padding-left-2',
      );
      expect(getByText('Box paddingLeft 3')).toHaveClass(
        'mm-box--padding-left-3',
      );
      expect(getByText('Box paddingLeft 4')).toHaveClass(
        'mm-box--padding-left-4',
      );
      expect(getByText('Box paddingLeft 5')).toHaveClass(
        'mm-box--padding-left-5',
      );
      expect(getByText('Box paddingLeft 6')).toHaveClass(
        'mm-box--padding-left-6',
      );
      expect(getByText('Box paddingLeft 7')).toHaveClass(
        'mm-box--padding-left-7',
      );
      expect(getByText('Box paddingLeft 8')).toHaveClass(
        'mm-box--padding-left-8',
      );
      expect(getByText('Box paddingLeft 9')).toHaveClass(
        'mm-box--padding-left-9',
      );
      expect(getByText('Box paddingLeft 10')).toHaveClass(
        'mm-box--padding-left-10',
      );
      expect(getByText('Box paddingLeft 11')).toHaveClass(
        'mm-box--padding-left-11',
      );
      expect(getByText('Box paddingLeft 12')).toHaveClass(
        'mm-box--padding-left-12',
      );
    });
    it('should render the Box with the responsive paddingLeft classes', () => {
      const { getByText } = render(
        <>
          <Box paddingLeft={[0, 0, 0, 0]}>Box paddingLeft 0</Box>
          <Box paddingLeft={[1, 1, 1, 1]}>Box paddingLeft 1</Box>
          <Box paddingLeft={[2, 2, 2, 2]}>Box paddingLeft 2</Box>
          <Box paddingLeft={[3, 3, 3, 3]}>Box paddingLeft 3</Box>
          <Box paddingLeft={[4, 4, 4, 4]}>Box paddingLeft 4</Box>
          <Box paddingLeft={[5, 5, 5, 5]}>Box paddingLeft 5</Box>
          <Box paddingLeft={[6, 6, 6, 6]}>Box paddingLeft 6</Box>
          <Box paddingLeft={[7, 7, 7, 7]}>Box paddingLeft 7</Box>
          <Box paddingLeft={[8, 8, 8, 8]}>Box paddingLeft 8</Box>
          <Box paddingLeft={[9, 9, 9, 9]}>Box paddingLeft 9</Box>
          <Box paddingLeft={[10, 10, 10, 10]}>Box paddingLeft 10</Box>
          <Box paddingLeft={[11, 11, 11, 11]}>Box paddingLeft 11</Box>
          <Box paddingLeft={[12, 12, 12, 12]}>Box paddingLeft 12</Box>
        </>,
      );
      expect(getByText('Box paddingLeft 0')).toHaveClass(
        'mm-box--padding-left-0 mm-box--sm:padding-left-0 mm-box--md:padding-left-0 mm-box--lg:padding-left-0',
      );
      expect(getByText('Box paddingLeft 1')).toHaveClass(
        'mm-box--padding-left-1 mm-box--sm:padding-left-1 mm-box--md:padding-left-1 mm-box--lg:padding-left-1',
      );
      expect(getByText('Box paddingLeft 2')).toHaveClass(
        'mm-box--padding-left-2 mm-box--sm:padding-left-2 mm-box--md:padding-left-2 mm-box--lg:padding-left-2',
      );
      expect(getByText('Box paddingLeft 3')).toHaveClass(
        'mm-box--padding-left-3 mm-box--sm:padding-left-3 mm-box--md:padding-left-3 mm-box--lg:padding-left-3',
      );
      expect(getByText('Box paddingLeft 4')).toHaveClass(
        'mm-box--padding-left-4 mm-box--sm:padding-left-4 mm-box--md:padding-left-4 mm-box--lg:padding-left-4',
      );
      expect(getByText('Box paddingLeft 5')).toHaveClass(
        'mm-box--padding-left-5 mm-box--sm:padding-left-5 mm-box--md:padding-left-5 mm-box--lg:padding-left-5',
      );
      expect(getByText('Box paddingLeft 6')).toHaveClass(
        'mm-box--padding-left-6 mm-box--sm:padding-left-6 mm-box--md:padding-left-6 mm-box--lg:padding-left-6',
      );
      expect(getByText('Box paddingLeft 7')).toHaveClass(
        'mm-box--padding-left-7 mm-box--sm:padding-left-7 mm-box--md:padding-left-7 mm-box--lg:padding-left-7',
      );
      expect(getByText('Box paddingLeft 8')).toHaveClass(
        'mm-box--padding-left-8 mm-box--sm:padding-left-8 mm-box--md:padding-left-8 mm-box--lg:padding-left-8',
      );
      expect(getByText('Box paddingLeft 9')).toHaveClass(
        'mm-box--padding-left-9 mm-box--sm:padding-left-9 mm-box--md:padding-left-9 mm-box--lg:padding-left-9',
      );
      expect(getByText('Box paddingLeft 10')).toHaveClass(
        'mm-box--padding-left-10 mm-box--sm:padding-left-10 mm-box--md:padding-left-10 mm-box--lg:padding-left-10',
      );
      expect(getByText('Box paddingLeft 11')).toHaveClass(
        'mm-box--padding-left-11 mm-box--sm:padding-left-11 mm-box--md:padding-left-11 mm-box--lg:padding-left-11',
      );
      expect(getByText('Box paddingLeft 12')).toHaveClass(
        'mm-box--padding-left-12 mm-box--sm:padding-left-12 mm-box--md:padding-left-12 mm-box--lg:padding-left-12',
      );
    });
    it('should render the Box with the responsive paddingInline classes', () => {
      const { getByText } = render(
        <Box paddingInline={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('mm-box--padding-inline-1');
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:padding-inline-2',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:padding-inline-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:padding-inline-4',
      );
    });
    it('should render the Box with the responsive paddingInlineStart classes', () => {
      const { getByText } = render(
        <Box paddingInlineStart={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--padding-inline-start-1',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:padding-inline-start-2',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:padding-inline-start-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:padding-inline-start-4',
      );
    });
    it('should render the Box with the responsive paddingInlineEnd classes', () => {
      const { getByText } = render(
        <Box paddingInlineEnd={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass(
        'mm-box--padding-inline-end-1',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:padding-inline-end-2',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:padding-inline-end-3',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:padding-inline-end-4',
      );
    });
  });
  describe('border', () => {
    it('should render the Box with the borderWidth class', () => {
      const { getByText } = render(<Box borderWidth={1}>Box content</Box>);

      expect(getByText('Box content')).toHaveClass('mm-box--border-width-1');
    });
    it('should render the Box with the responsive borderWidth classes', () => {
      const { getByText } = render(
        <Box borderWidth={[1, 2, 3, 4]}>Box content</Box>,
      );

      expect(getByText('Box content')).toHaveClass('mm-box--border-width-1');
      expect(getByText('Box content')).toHaveClass('mm-box--sm:border-width-2');
      expect(getByText('Box content')).toHaveClass('mm-box--md:border-width-3');
      expect(getByText('Box content')).toHaveClass('mm-box--lg:border-width-4');
    });
    it('should render the Box with the borderColor class', () => {
      const { getByText } = render(
        <Box borderColor={BorderColor.borderDefault}>Box content</Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--border-color-border-default',
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
        'mm-box--border-color-border-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:border-color-error-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:border-color-info-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:border-color-warning-default',
      );
    });
    it('should render the Box with a borderStyle class', () => {
      const { getByText } = render(
        <Box borderStyle={BorderStyle.solid}>Box content</Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--border-style-solid',
      );
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

      expect(getByText('Box content')).toHaveClass(
        'mm-box--border-style-solid',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:border-style-dashed',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:border-style-none',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:border-style-dotted',
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

      expect(getByText('border radius xs')).toHaveClass('mm-box--rounded-xs');
      expect(getByText('border radius sm')).toHaveClass('mm-box--rounded-sm');
      expect(getByText('border radius md')).toHaveClass('mm-box--rounded-md');
      expect(getByText('border radius lg')).toHaveClass('mm-box--rounded-lg');
      expect(getByText('border radius xl')).toHaveClass('mm-box--rounded-xl');
      expect(getByText('border radius pill')).toHaveClass(
        'mm-box--rounded-pill',
      );
      expect(getByText('border radius full')).toHaveClass(
        'mm-box--rounded-full',
      );
      expect(getByText('border radius none')).toHaveClass(
        'mm-box--rounded-none',
      );
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

      expect(getByText('Border radius set 1')).toHaveClass(
        'mm-box--rounded-xs',
      );
      expect(getByText('Border radius set 1')).toHaveClass(
        'mm-box--sm:rounded-sm',
      );
      expect(getByText('Border radius set 1')).toHaveClass(
        'mm-box--md:rounded-md',
      );
      expect(getByText('Border radius set 1')).toHaveClass(
        'mm-box--lg:rounded-lg',
      );
      expect(getByText('Border radius set 2')).toHaveClass(
        'mm-box--rounded-xl',
      );
      expect(getByText('Border radius set 2')).toHaveClass(
        'mm-box--sm:rounded-pill',
      );
      expect(getByText('Border radius set 2')).toHaveClass(
        'mm-box--md:rounded-none',
      );
      expect(getByText('Border radius set 2')).toHaveClass(
        'mm-box--lg:rounded-full',
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
        </>,
      );

      expect(getByText('Box display-block')).toHaveClass(
        'mm-box--display-block',
      );
      expect(getByText('Box display-flex')).toHaveClass('mm-box--display-flex');
      expect(getByText('Box display-grid')).toHaveClass('mm-box--display-grid');
      expect(getByText('Box display-inline')).toHaveClass(
        'mm-box--display-inline',
      );
      expect(getByText('Box display-inline-block')).toHaveClass(
        'mm-box--display-inline-block',
      );
      expect(getByText('Box display-inline-flex')).toHaveClass(
        'mm-box--display-inline-flex',
      );
      expect(getByText('Box display-inline-grid')).toHaveClass(
        'mm-box--display-inline-grid',
      );
      expect(getByText('Box display-list-item')).toHaveClass(
        'mm-box--display-list-item',
      );
    });
    it('should render the Box with the responsive display classes', () => {
      const { getByText } = render(
        <Box
          display={[Display.Block, Display.Flex, Display.Grid, Display.None]}
        >
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass('mm-box--display-block');
      expect(getByText('Box content')).toHaveClass('mm-box--sm:display-flex');
      expect(getByText('Box content')).toHaveClass('mm-box--md:display-grid');
      expect(getByText('Box content')).toHaveClass('mm-box--lg:display-none');
    });
    it('should render the Box with the gap class', () => {
      const { getByText } = render(
        <>
          <Box gap={0}>Box gap 0</Box>
          <Box gap={1}>Box gap 1</Box>
          <Box gap={2}>Box gap 2</Box>
          <Box gap={3}>Box gap 3</Box>
          <Box gap={4}>Box gap 4</Box>
          <Box gap={5}>Box gap 5</Box>
          <Box gap={6}>Box gap 6</Box>
          <Box gap={7}>Box gap 7</Box>
          <Box gap={8}>Box gap 8</Box>
          <Box gap={9}>Box gap 9</Box>
          <Box gap={10}>Box gap 10</Box>
          <Box gap={11}>Box gap 11</Box>
          <Box gap={12}>Box gap 12</Box>
        </>,
      );

      expect(getByText('Box gap 1')).toHaveClass('mm-box--gap-1');
      expect(getByText('Box gap 2')).toHaveClass('mm-box--gap-2');
      expect(getByText('Box gap 3')).toHaveClass('mm-box--gap-3');
      expect(getByText('Box gap 4')).toHaveClass('mm-box--gap-4');
      expect(getByText('Box gap 5')).toHaveClass('mm-box--gap-5');
      expect(getByText('Box gap 6')).toHaveClass('mm-box--gap-6');
      expect(getByText('Box gap 7')).toHaveClass('mm-box--gap-7');
      expect(getByText('Box gap 8')).toHaveClass('mm-box--gap-8');
      expect(getByText('Box gap 9')).toHaveClass('mm-box--gap-9');
      expect(getByText('Box gap 10')).toHaveClass('mm-box--gap-10');
      expect(getByText('Box gap 11')).toHaveClass('mm-box--gap-11');
      expect(getByText('Box gap 12')).toHaveClass('mm-box--gap-12');
    });
    it('should render the Box with the responsive gap classes', () => {
      const { getByText } = render(
        <>
          <Box gap={[0, 1, 2, 3]}>Box gap 0123</Box>
          <Box gap={[4, 5, 6, 7]}>Box gap 4567</Box>
          <Box gap={[8, 9, 10, 11]}>Box gap 891011</Box>
          <Box gap={[12, 12, 12, 12]}>Box gap 12</Box>
        </>,
      );

      expect(getByText('Box gap 0123')).toHaveClass(
        'mm-box--gap-0 mm-box--sm:gap-1 mm-box--md:gap-2 mm-box--lg:gap-3',
      );
      expect(getByText('Box gap 4567')).toHaveClass(
        'mm-box--gap-4 mm-box--sm:gap-5 mm-box--md:gap-6 mm-box--lg:gap-7',
      );
      expect(getByText('Box gap 891011')).toHaveClass(
        'mm-box--gap-8 mm-box--sm:gap-9 mm-box--md:gap-10 mm-box--lg:gap-11',
      );
      expect(getByText('Box gap 12')).toHaveClass(
        'mm-box--gap-12 mm-box--sm:gap-12 mm-box--md:gap-12 mm-box--lg:gap-12',
      );
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
        </>,
      );

      expect(getByText('Box flex-direction-row')).toHaveClass(
        'mm-box--flex-direction-row',
      );
      expect(getByText('Box flex-direction-row-reverse')).toHaveClass(
        'mm-box--flex-direction-row-reverse',
      );
      expect(getByText('Box flex-direction-column')).toHaveClass(
        'mm-box--flex-direction-column',
      );
      expect(getByText('Box flex-direction-column-reverse')).toHaveClass(
        'mm-box--flex-direction-column-reverse',
      );
    });
    it('should render the Box with the responsive flexDirection classes', () => {
      const { getByText } = render(
        <Box
          flexDirection={[
            FlexDirection.Row,
            FlexDirection.RowReverse,
            FlexDirection.Column,
            FlexDirection.ColumnReverse,
          ]}
        >
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--flex-direction-row',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:flex-direction-row-reverse',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:flex-direction-column',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:flex-direction-column-reverse',
      );
    });
    it('should render the Box with the flexWrap classes', () => {
      const { getByText } = render(
        <>
          <Box flexWrap={FlexWrap.Wrap}>Box flex-wrap-wrap</Box>
          <Box flexWrap={FlexWrap.WrapReverse}>Box flex-wrap-wrap-reverse</Box>
          <Box flexWrap={FlexWrap.NoWrap}>Box flex-wrap-nowrap</Box>
        </>,
      );

      expect(getByText('Box flex-wrap-wrap')).toHaveClass(
        'mm-box--flex-wrap-wrap',
      );
      expect(getByText('Box flex-wrap-wrap-reverse')).toHaveClass(
        'mm-box--flex-wrap-wrap-reverse',
      );
      expect(getByText('Box flex-wrap-nowrap')).toHaveClass(
        'mm-box--flex-wrap-nowrap',
      );
    });
    it('should render the Box with the responsive flexWrap classes', () => {
      const { getByText } = render(
        <Box flexWrap={[FlexWrap.Wrap, FlexWrap.WrapReverse, FlexWrap.NoWrap]}>
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass('mm-box--flex-wrap-wrap');
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:flex-wrap-wrap-reverse',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:flex-wrap-nowrap',
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
        'mm-box--align-items-flex-start',
      );
      expect(getByText('Box align-items-flex-end')).toHaveClass(
        'mm-box--align-items-flex-end',
      );
      expect(getByText('Box align-items-center')).toHaveClass(
        'mm-box--align-items-center',
      );
      expect(getByText('Box align-items-baseline')).toHaveClass(
        'mm-box--align-items-baseline',
      );
      expect(getByText('Box align-items-stretch')).toHaveClass(
        'mm-box--align-items-stretch',
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
        'mm-box--align-items-flex-start',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:align-items-flex-end',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:align-items-center',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:align-items-baseline',
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
        'mm-box--justify-content-flex-start',
      );
      expect(getByText('Box justify-content-flex-end')).toHaveClass(
        'mm-box--justify-content-flex-end',
      );
      expect(getByText('Box justify-content-center')).toHaveClass(
        'mm-box--justify-content-center',
      );
      expect(getByText('Box justify-content-space-around')).toHaveClass(
        'mm-box--justify-content-space-around',
      );
      expect(getByText('Box justify-content-space-between')).toHaveClass(
        'mm-box--justify-content-space-between',
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
        'mm-box--justify-content-flex-start',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:justify-content-flex-end',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:justify-content-center',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:justify-content-space-around',
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
        </>,
      );

      expect(getByText('Box left')).toHaveClass('mm-box--text-align-left');
      expect(getByText('Box center')).toHaveClass('mm-box--text-align-center');
      expect(getByText('Box right')).toHaveClass('mm-box--text-align-right');
      expect(getByText('Box justify')).toHaveClass(
        'mm-box--text-align-justify',
      );
      expect(getByText('Box end')).toHaveClass('mm-box--text-align-end');
    });
    it('should render the Box with the responsive textAlign classes', () => {
      const { getByText } = render(
        <Box
          textAlign={[
            TextAlign.Left,
            TextAlign.Center,
            TextAlign.Right,
            TextAlign.Justify,
          ]}
        >
          Box content
        </Box>,
      );

      expect(getByText('Box content')).toHaveClass('mm-box--text-align-left');
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:text-align-center',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:text-align-right',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:text-align-justify',
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
        'mm-box--background-color-background-default',
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
        'mm-box--background-color-background-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:background-color-error-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:background-color-info-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:background-color-warning-default',
      );
    });
  });
  describe('color', () => {
    it('should render the Box with the color class', () => {
      const { getByText } = render(
        <Box color={TextColor.textDefault}>Box content</Box>,
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--color-text-default',
      );
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
      expect(getByText('Box content')).toHaveClass(
        'mm-box--color-text-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--sm:color-primary-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--md:color-error-default',
      );
      expect(getByText('Box content')).toHaveClass(
        'mm-box--lg:color-success-default',
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
        </>,
      );
      expect(getByText('Box half')).toHaveClass('mm-box--width-1/2');
      expect(getByText('Box one fourth')).toHaveClass('mm-box--width-1/4');
      expect(getByText('Box max')).toHaveClass('mm-box--width-max');
      expect(getByText('Box min')).toHaveClass('mm-box--width-min');
    });
    it('should render the Box with the responsive width classes', () => {
      const { getByText } = render(
        <Box
          width={[
            BlockSize.Half,
            BlockSize.OneFourth,
            BlockSize.Max,
            BlockSize.Min,
          ]}
        >
          Box content
        </Box>,
      );
      expect(getByText('Box content')).toHaveClass('mm-box--width-1/2');
      expect(getByText('Box content')).toHaveClass('mm-box--sm:width-1/4');
      expect(getByText('Box content')).toHaveClass('mm-box--md:width-max');
      expect(getByText('Box content')).toHaveClass('mm-box--lg:width-min');
    });
    it('should render the Box with the min-width class', () => {
      const { getByText } = render(
        <>
          <Box width={BlockSize.Zero}>Box zero</Box>
          <Box width={BlockSize.OneFourth}>Box one fourth</Box>
          <Box width={BlockSize.Max}>Box max</Box>
          <Box width={BlockSize.Min}>Box min</Box>
        </>,
      );
      expect(getByText('Box zero')).toHaveClass('mm-box--width-0');
      expect(getByText('Box one fourth')).toHaveClass('mm-box--width-1/4');
      expect(getByText('Box max')).toHaveClass('mm-box--width-max');
      expect(getByText('Box min')).toHaveClass('mm-box--width-min');
    });
    it('should render the Box with the responsive min-width classes', () => {
      const { getByText } = render(
        <Box
          width={[
            BlockSize.Zero,
            BlockSize.OneFourth,
            BlockSize.Screen,
            BlockSize.Max,
          ]}
        >
          Box content
        </Box>,
      );
      const boxElement = getByText('Box content');
      expect(boxElement).toHaveClass('mm-box--width-0');
      expect(boxElement).toHaveClass('mm-box--sm:width-1/4');
      expect(boxElement).toHaveClass('mm-box--md:width-screen');
      expect(boxElement).toHaveClass('mm-box--lg:width-max');
    });
    it('should render the Box with the height class', () => {
      const { getByText } = render(
        <>
          <Box height={BlockSize.Half}>Box half</Box>
          <Box height={BlockSize.OneFourth}>Box one fourth</Box>
          <Box height={BlockSize.Max}>Box max</Box>
          <Box height={BlockSize.Min}>Box min</Box>
        </>,
      );
      expect(getByText('Box half')).toHaveClass('mm-box--height-1/2');
      expect(getByText('Box one fourth')).toHaveClass('mm-box--height-1/4');
      expect(getByText('Box max')).toHaveClass('mm-box--height-max');
      expect(getByText('Box min')).toHaveClass('mm-box--height-min');
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
        </>,
      );
      expect(getByText('Box content')).toHaveClass('mm-box--height-1/2');
      expect(getByText('Box content')).toHaveClass('mm-box--sm:height-1/4');
      expect(getByText('Box content')).toHaveClass('mm-box--md:height-max');
      expect(getByText('Box content')).toHaveClass('mm-box--lg:height-min');
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
    const mockRef = React.createRef<HTMLDivElement>();
    render(<Box ref={mockRef}>hello</Box>);
    expect(mockRef.current).toBeInTheDocument();
    expect(mockRef.current?.tagName).toBe('DIV');
  });
  it('should render with a varying range of array props', () => {
    const { getByText } = render(
      <>
        <Box margin={[0]}>1 item</Box>
        <Box margin={[0, 1]}>2 items</Box>
        <Box margin={[0, 1, 2]}>3 items</Box>
        <Box margin={[0, 1, 2, 3, 4] as any}>too many items</Box>
      </>,
    );

    expect(getByText('1 item')).toHaveClass('mm-box--margin-0');
    expect(getByText('2 items')).toHaveClass(
      'mm-box--margin-0 mm-box--sm:margin-1',
    );
    expect(getByText('3 items')).toHaveClass(
      'mm-box--margin-0 mm-box--sm:margin-1 mm-box--md:margin-2',
    );
  });
});
