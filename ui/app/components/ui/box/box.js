import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  BORDER_STYLE,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  SIZES,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

const ValidSize = PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const ArrayOfValidSizes = PropTypes.arrayOf(ValidSize);
const MultipleSizes = PropTypes.oneOfType([ValidSize, ArrayOfValidSizes]);

function generateSizeClasses(baseClass, type, main, top, right, bottom, left) {
  const arr = Array.isArray(main) ? main : [];
  const singleDigit = Array.isArray(main) ? undefined : main;
  if (Array.isArray(main) && ![2, 3, 4].includes(main.length)) {
    throw new Error(
      `Expected prop ${type} to have length between 2 and 4, received ${main.length}`,
    );
  }

  const isHorizontalAndVertical = arr.length === 2;
  const isTopHorizontalAndBottom = arr.length === 3;
  const isAllFour = arr.length === 4;
  const hasAtLeastTwo = arr.length >= 2;
  const hasAtLeastThree = arr.length >= 3;
  return {
    [`${baseClass}--${type}-${singleDigit}`]: singleDigit !== undefined,
    [`${baseClass}--${type}-top-${top}`]: typeof top === 'number',
    [`${baseClass}--${type}-right-${right}`]: typeof right === 'number',
    [`${baseClass}--${type}-bottom-${bottom}`]: typeof bottom === 'number',
    [`${baseClass}--${type}-left-${left}`]: typeof left === 'number',
    // As long as an array of length >= 2 has been provided, the first number
    // will always be for the top value.
    [`${baseClass}--${type}-top-${arr?.[0]}`]: hasAtLeastTwo,
    // As long as an array of length >= 2 has been provided, the second number
    // will always be for the right value.
    [`${baseClass}--${type}-right-${arr?.[1]}`]: hasAtLeastTwo,
    // If an array has 2 values, the first number is the bottom value. If
    // instead if has 3 or more values, the third number will be the bottom.
    [`${baseClass}--${type}-bottom-${arr?.[2]}`]: hasAtLeastThree,
    [`${baseClass}--${type}-bottom-${arr?.[0]}`]: isHorizontalAndVertical,
    // If an array has 2 or 3 values, the second number will be the left value
    [`${baseClass}--${type}-left-${arr?.[1]}`]:
      isHorizontalAndVertical || isTopHorizontalAndBottom,
    // If an array has 4 values, the fourth number is the left value
    [`${baseClass}--${type}-left-${arr?.[3]}`]: isAllFour,
  };
}

export default function Box({
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  borderColor,
  borderWidth,
  borderRadius,
  borderStyle,
  alignItems,
  justifyContent,
  textAlign,
  display,
  width,
  height,
  children,
}) {
  const boxClassName = classnames('box', {
    // ---Borders---
    // if borderWidth or borderColor is supplied w/o style, default to solid
    'box--border-style-solid':
      !borderStyle && (Boolean(borderWidth) || Boolean(borderColor)),
    // if borderColor supplied w/o width, default to 1
    'box--border-size-1': !borderWidth && Boolean(borderColor),
    [`box--border-color-${borderColor}`]: Boolean(borderColor),
    [`box--rounded-${borderRadius}`]: Boolean(borderRadius),
    [`box--border-style-${borderStyle}`]: Boolean(borderStyle),
    [`box--border-size-${borderWidth}`]: Boolean(borderWidth),
    // Margin
    ...generateSizeClasses(
      'box',
      'margin',
      margin,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
    ),
    // Padding
    ...generateSizeClasses(
      'box',
      'padding',
      padding,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
    ),
    // ---Flex/Grid alignment---
    // if justifyContent or alignItems supplied w/o display, default to flex
    'box--display-flex':
      !display && (Boolean(justifyContent) || Boolean(alignItems)),
    [`box--justify-content-${justifyContent}`]: Boolean(justifyContent),
    [`box--align-items-${alignItems}`]: Boolean(alignItems),
    // text align
    [`box--text-align-${textAlign}`]: Boolean(textAlign),
    // display
    [`box--display-${display}`]: Boolean(display),
    // width & height
    [`box--width-${width}`]: Boolean(width),
    [`box--height-${height}`]: Boolean(height),
  });
  // Apply Box styles to any other component using function pattern
  if (typeof children === 'function') {
    return children(boxClassName);
  }
  return <div className={boxClassName}>{children}</div>;
}

Box.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  margin: MultipleSizes,
  marginTop: ValidSize,
  marginBottom: ValidSize,
  marginRight: ValidSize,
  marginLeft: ValidSize,
  padding: MultipleSizes,
  paddingTop: ValidSize,
  paddingBottom: ValidSize,
  paddingRight: ValidSize,
  paddingLeft: ValidSize,
  borderColor: PropTypes.oneOf(Object.values(COLORS)),
  borderWidth: PropTypes.number,
  borderRadius: PropTypes.oneOf(Object.values(SIZES)),
  borderStyle: PropTypes.oneOf(Object.values(BORDER_STYLE)),
  alignItems: PropTypes.oneOf(Object.values(ALIGN_ITEMS)),
  justifyContent: PropTypes.oneOf(Object.values(JUSTIFY_CONTENT)),
  textAlign: PropTypes.oneOf(Object.values(TEXT_ALIGN)),
  display: PropTypes.oneOf(Object.values(DISPLAY)),
  width: PropTypes.oneOf(Object.values(BLOCK_SIZES)),
  height: PropTypes.oneOf(Object.values(BLOCK_SIZES)),
};
