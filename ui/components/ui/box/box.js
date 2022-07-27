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
  FLEX_DIRECTION,
  FLEX_WRAP,
} from '../../../helpers/constants/design-system';

const ValidSize = PropTypes.oneOf([
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
  'auto',
]);

export const ValidBackgroundColors = [
  COLORS.BACKGROUND_DEFAULT,
  COLORS.BACKGROUND_ALTERNATIVE,
  COLORS.OVERLAY_DEFAULT,
  COLORS.PRIMARY_DEFAULT,
  COLORS.PRIMARY_ALTERNATIVE,
  COLORS.PRIMARY_MUTED,
  COLORS.PRIMARY_DISABLED,
  COLORS.SECONDARY_DEFAULT,
  COLORS.SECONDARY_ALTERNATIVE,
  COLORS.SECONDARY_MUTED,
  COLORS.SECONDARY_DISABLED,
  COLORS.ERROR_DEFAULT,
  COLORS.ERROR_ALTERNATIVE,
  COLORS.ERROR_MUTED,
  COLORS.ERROR_DISABLED,
  COLORS.WARNING_DEFAULT,
  COLORS.WARNING_ALTERNATIVE,
  COLORS.WARNING_MUTED,
  COLORS.WARNING_DISABLED,
  COLORS.SUCCESS_DEFAULT,
  COLORS.SUCCESS_ALTERNATIVE,
  COLORS.SUCCESS_MUTED,
  COLORS.SUCCESS_DISABLED,
  COLORS.INFO_DEFAULT,
  COLORS.INFO_ALTERNATIVE,
  COLORS.INFO_MUTED,
  COLORS.INFO_DISABLED,
  COLORS.MAINNET,
  COLORS.ROPSTEN,
  COLORS.KOVAN,
  COLORS.RINKEBY,
  COLORS.GOERLI,
  COLORS.TRANSPARENT,
  COLORS.LOCALHOST,
];

export const ValidBorderColors = [
  COLORS.BORDER_DEFAULT,
  COLORS.BORDER_MUTED,
  COLORS.PRIMARY_DEFAULT,
  COLORS.PRIMARY_ALTERNATIVE,
  COLORS.PRIMARY_MUTED,
  COLORS.PRIMARY_DISABLED,
  COLORS.SECONDARY_DEFAULT,
  COLORS.SECONDARY_ALTERNATIVE,
  COLORS.SECONDARY_MUTED,
  COLORS.SECONDARY_DISABLED,
  COLORS.ERROR_DEFAULT,
  COLORS.ERROR_ALTERNATIVE,
  COLORS.ERROR_MUTED,
  COLORS.ERROR_DISABLED,
  COLORS.WARNING_DEFAULT,
  COLORS.WARNING_ALTERNATIVE,
  COLORS.WARNING_MUTED,
  COLORS.WARNING_DISABLED,
  COLORS.SUCCESS_DEFAULT,
  COLORS.SUCCESS_ALTERNATIVE,
  COLORS.SUCCESS_MUTED,
  COLORS.SUCCESS_DISABLED,
  COLORS.INFO_DEFAULT,
  COLORS.INFO_ALTERNATIVE,
  COLORS.INFO_MUTED,
  COLORS.INFO_DISABLED,
  COLORS.MAINNET,
  COLORS.ROPSTEN,
  COLORS.KOVAN,
  COLORS.RINKEBY,
  COLORS.GOERLI,
  COLORS.TRANSPARENT,
  COLORS.LOCALHOST,
];

const ArrayOfValidSizes = PropTypes.arrayOf(ValidSize);
export const MultipleSizes = PropTypes.oneOfType([
  ValidSize,
  ArrayOfValidSizes,
]);

function isValidValue(type, value) {
  // for now only margin type can have 'auto'
  return typeof value === 'number' || (type === 'margin' && value === 'auto');
}

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
    [`${baseClass}--${type}-${singleDigit}`]: isValidValue(type, singleDigit),
    [`${baseClass}--${type}-top-${top}`]: isValidValue(type, top),
    [`${baseClass}--${type}-right-${right}`]: isValidValue(type, right),
    [`${baseClass}--${type}-bottom-${bottom}`]: isValidValue(type, bottom),
    [`${baseClass}--${type}-left-${left}`]: isValidValue(type, left),
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
  flexDirection = FLEX_DIRECTION.ROW,
  flexWrap,
  gap,
  display,
  width,
  height,
  children,
  className,
  backgroundColor,
}) {
  const boxClassName = classnames('box', className, {
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
    [`box--flex-direction-${flexDirection}`]: Boolean(flexDirection),
    [`box--flex-wrap-${flexWrap}`]: Boolean(flexWrap),
    // text align
    [`box--text-align-${textAlign}`]: Boolean(textAlign),
    // display
    [`box--display-${display}`]: Boolean(display),
    // width & height
    [`box--width-${width}`]: Boolean(width),
    [`box--height-${height}`]: Boolean(height),
    // background
    [`box--background-color-${backgroundColor}`]: Boolean(backgroundColor),
    ...generateSizeClasses('box', 'gap', gap),
  });
  // Apply Box styles to any other component using function pattern
  if (typeof children === 'function') {
    return children(boxClassName);
  }
  return <div className={boxClassName}>{children}</div>;
}

Box.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  flexDirection: PropTypes.oneOf(Object.values(FLEX_DIRECTION)),
  flexWrap: PropTypes.oneOf(Object.values(FLEX_WRAP)),
  gap: ValidSize,
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
  borderColor: PropTypes.oneOf(Object.values(ValidBorderColors)),
  borderWidth: PropTypes.number,
  borderRadius: PropTypes.oneOf(Object.values(SIZES)),
  borderStyle: PropTypes.oneOf(Object.values(BORDER_STYLE)),
  alignItems: PropTypes.oneOf(Object.values(ALIGN_ITEMS)),
  justifyContent: PropTypes.oneOf(Object.values(JUSTIFY_CONTENT)),
  textAlign: PropTypes.oneOf(Object.values(TEXT_ALIGN)),
  display: PropTypes.oneOf(Object.values(DISPLAY)),
  width: PropTypes.oneOf(Object.values(BLOCK_SIZES)),
  height: PropTypes.oneOf(Object.values(BLOCK_SIZES)),
  backgroundColor: PropTypes.oneOf(Object.values(ValidBackgroundColors)),
  className: PropTypes.string,
};
