import { number, select } from '@storybook/addon-knobs';
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
import Box from './box';

export default {
  title: 'Box',
};

const sizeKnobOptions = [undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const box = () => {
  const items = [];
  const size = number(
    'size',
    100,
    { range: true, min: 50, max: 500, step: 10 },
    'children',
  );
  for (let $i = 0; $i < number('items', 1, {}, 'children'); $i++) {
    items.push(<img width={size} height={size} src="./images/eth_logo.svg" />);
  }
  return (
    <Box
      display={select('display', DISPLAY, DISPLAY.BLOCK, 'display')}
      width={select('width', BLOCK_SIZES, BLOCK_SIZES.HALF, 'display')}
      height={select('height', BLOCK_SIZES, BLOCK_SIZES.HALF, 'display')}
      justifyContent={select(
        'justifyContent',
        JUSTIFY_CONTENT,
        undefined,
        'display',
      )}
      textAlign={select('textAlign', TEXT_ALIGN, undefined, 'left')}
      alignItems={select('alignItems', ALIGN_ITEMS, undefined, 'display')}
      margin={select('margin', sizeKnobOptions, undefined, 'margin')}
      marginTop={select('marginTop', sizeKnobOptions, undefined, 'margin')}
      marginRight={select('marginRight', sizeKnobOptions, undefined, 'margin')}
      marginBottom={select(
        'marginBottom',
        sizeKnobOptions,
        undefined,
        'margin',
      )}
      marginLeft={select('marginLeft', sizeKnobOptions, undefined, 'margin')}
      padding={select('padding', sizeKnobOptions, undefined, 'padding')}
      paddingTop={select('paddingTop', sizeKnobOptions, undefined, 'padding')}
      paddingRight={select(
        'paddingRight',
        sizeKnobOptions,
        undefined,
        'padding',
      )}
      paddingBottom={select(
        'paddingBottom',
        sizeKnobOptions,
        undefined,
        'padding',
      )}
      paddingLeft={select('paddingLeft', sizeKnobOptions, undefined, 'padding')}
      borderStyle={select(
        'borderStyle',
        BORDER_STYLE,
        BORDER_STYLE.DASHED,
        'border',
      )}
      borderWidth={number('borderWidth', 1, sizeKnobOptions, 'border')}
      borderColor={select('borderColor', COLORS, COLORS.BLACK, 'border')}
    >
      {items}
    </Box>
  );
};
