import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { memoize } from 'lodash';
import {
  AlignItems,
  BlockSize,
  BorderStyle,
  BackgroundColor,
  BorderColor,
  TextColor,
  IconColor,
  JustifyContent,
  TextAlign,
  FlexDirection,
  FlexWrap,
  BREAKPOINTS,
  BorderRadius,
  Display,
} from '../../../helpers/constants/design-system';

const BASE_CLASS_NAME = 'box';
const Sizes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const ValidSize = PropTypes.oneOf(Sizes);
const ValidBlockSize = PropTypes.oneOf(Object.values(BlockSize));
const ValidSizeAndAuto = PropTypes.oneOf([...Sizes, 'auto']);
export const ValidBackgroundColor = PropTypes.oneOf(
  Object.values(BackgroundColor),
);
export const ValidBorderColors = PropTypes.oneOf(Object.values(BorderColor));
export const ValidTextColors = PropTypes.oneOf(Object.values(TextColor));
export const ValidIconColors = PropTypes.oneOf(Object.values(IconColor));
const ValidAlignItem = PropTypes.oneOf(Object.values(AlignItems));
const ValidJustifyContent = PropTypes.oneOf(Object.values(JustifyContent));

const ArrayOfValidSizes = PropTypes.arrayOf(ValidSize);
export const MultipleSizes = PropTypes.oneOfType([
  ValidSize,
  ArrayOfValidSizes,
]);

const ArrayOfValidBlockSizes = PropTypes.arrayOf(ValidBlockSize);
export const MultipleBlockSizes = PropTypes.oneOfType([
  ValidBlockSize,
  ArrayOfValidBlockSizes,
]);

const ArrayOfValidSizesAndAuto = PropTypes.arrayOf(ValidSizeAndAuto);
export const MultipleSizesAndAuto = PropTypes.oneOfType([
  ValidSizeAndAuto,
  ArrayOfValidSizesAndAuto,
]);

const ArrayOfValidBorderColors = PropTypes.arrayOf(ValidBorderColors);
export const MultipleBorderColors = PropTypes.oneOfType([
  ValidBorderColors,
  ArrayOfValidBorderColors,
]);

const ArrayOfValidBackgroundColor = PropTypes.arrayOf(ValidBackgroundColor);
export const MultipleBackgroundColor = PropTypes.oneOfType([
  ValidBackgroundColor,
  ArrayOfValidBackgroundColor,
]);

const ArrayOfValidTextColors = PropTypes.arrayOf(ValidTextColors);
const ArrayOfValidIconColors = PropTypes.arrayOf(ValidIconColors);
export const MultipleTextColors = PropTypes.oneOfType([
  ValidTextColors,
  ArrayOfValidTextColors,
  ValidIconColors,
  ArrayOfValidIconColors,
]);

const ArrayOfValidAlignItems = PropTypes.arrayOf(ValidAlignItem);
export const MultipleAlignItems = PropTypes.oneOfType([
  ValidAlignItem,
  ArrayOfValidAlignItems,
]);

const ArrayOfValidJustifyContents = PropTypes.arrayOf(ValidJustifyContent);
export const MultipleJustifyContents = PropTypes.oneOfType([
  ValidJustifyContent,
  ArrayOfValidJustifyContents,
]);

function isValidSize(type, value) {
  // Only margin types allow 'auto'
  return (
    typeof value === 'number' ||
    ((type === 'margin' ||
      type === 'margin-top' ||
      type === 'margin-right' ||
      type === 'margin-bottom' ||
      type === 'margin-left' ||
      type === 'margin-inline' ||
      type === 'margin-inline-start' ||
      type === 'margin-inline-end') &&
      value === 'auto')
  );
}

function isValidString(type, value) {
  return typeof type === 'string' && typeof value === 'string';
}

/**
 * Generate classnames
 * Generates classnames for different utility styles
 * Also accepts responsive props in the form of an array
 * Maps responsive props to mobile first breakpoints
 *
 * @param {string} type - The style declaration type "margin", "margin-top", "padding", "display" etc
 * @param {array || number || string} value - prop value being passed in array props are responsive props
 * @param {*} validatorFn - The validation function for each type of value
 * @returns
 */

const generateClassNames = memoize(
  (type, value, validatorFn) => {
    // if value does not exist return null
    if (!value) {
      return null;
    }
    const classesObject = {};
    // if value is an array with single item e.g. marginTop={[1]}
    const singleArrayItemProp =
      Array.isArray(value) && value.length === 1 ? value[0] : undefined;
    // if value single value e.g. marginTop={1}
    const singleValueProp =
      (!Array.isArray(value) && typeof value === 'string') ||
      typeof value === 'number'
        ? value
        : undefined;
    // single digit equals single value or single array item
    const singleValue = singleValueProp || singleArrayItemProp;
    // 0 is an acceptable value but is falsy in js
    if (singleValue || singleValue === 0) {
      // add base style without any breakpoint prefixes to classObject
      classesObject[`${BASE_CLASS_NAME}--${type}-${singleValue}`] = validatorFn(
        type,
        singleValue,
      );
    } else {
      // If array with more than one item
      switch (value.length) {
        case 4:
          // add base/sm/md/lg
          classesObject[`${BASE_CLASS_NAME}--${type}-${value[0]}`] =
            value[0] && validatorFn(type, value[0]);
          classesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[1]}:${type}-${value[1]}`
          ] = value[1] && validatorFn(type, value[1]);
          classesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[2]}:${type}-${value[2]}`
          ] = value[2] && validatorFn(type, value[2]);
          classesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[3]}:${type}-${value[3]}`
          ] = value[3] && validatorFn(type, value[3]);
          break;
        case 3:
          // add base/sm/md
          classesObject[`${BASE_CLASS_NAME}--${type}-${value[0]}`] =
            value[0] && validatorFn(type, value[0]);
          classesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[1]}:${type}-${value[1]}`
          ] = value[1] && validatorFn(type, value[1]);
          classesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[2]}:${type}-${value[2]}`
          ] = value[2] && validatorFn(type, value[2]);
          break;
        case 2:
          // add base/sm
          classesObject[`${BASE_CLASS_NAME}--${type}-${value[0]}`] =
            value[0] && validatorFn(type, value[0]);
          classesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[1]}:${type}-${value[1]}`
          ] = value[1] && validatorFn(type, value[1]);
          break;
        default:
          console.log(`Invalid array prop length: ${value.length}`);
      }
    }
    return classesObject;
  },
  (type, value) => `${type}${value}`,
);

/**
 * @deprecated The JS version of the <Box /> component has been deprecated in favor of the new TS version from the component-library.
 * Please update your code to use the new <Box> component instead
 * import { Box } from '../../component-library';
 * The component API is the same so you should only have to update the import statement but you can find documentation for the new Box component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-box--docs}
 * If you would like to help with the replacement of the old Button component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/19526}
 */
const Box = React.forwardRef(function Box(
  {
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    paddingInline,
    paddingInlineStart,
    paddingInlineEnd,
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    marginInline,
    marginInlineStart,
    marginInlineEnd,
    borderColor,
    borderWidth,
    borderRadius,
    borderStyle,
    alignItems,
    justifyContent,
    textAlign,
    flexDirection = FlexDirection.Row,
    flexWrap,
    gap,
    display,
    width,
    height,
    children,
    className,
    backgroundColor,
    color,
    ariaLabel,
    as = 'div',
    ...props
  },
  ref,
) {
  const boxClassName = classnames(
    BASE_CLASS_NAME,
    className,
    // Margin
    margin && generateClassNames('margin', margin, isValidSize),
    marginTop && generateClassNames('margin-top', marginTop, isValidSize),
    marginRight && generateClassNames('margin-right', marginRight, isValidSize),
    marginBottom &&
      generateClassNames('margin-bottom', marginBottom, isValidSize),
    marginLeft && generateClassNames('margin-left', marginLeft, isValidSize),
    marginInline &&
      generateClassNames('margin-inline', marginInline, isValidSize),
    marginInlineStart &&
      generateClassNames('margin-inline-start', marginInlineStart, isValidSize),
    marginInlineEnd &&
      generateClassNames('margin-inline-end', marginInlineEnd, isValidSize),
    // Padding
    padding && generateClassNames('padding', padding, isValidSize),
    paddingTop && generateClassNames('padding-top', paddingTop, isValidSize),
    paddingRight &&
      generateClassNames('padding-right', paddingRight, isValidSize),
    paddingBottom &&
      generateClassNames('padding-bottom', paddingBottom, isValidSize),
    paddingLeft && generateClassNames('padding-left', paddingLeft, isValidSize),
    paddingInline &&
      generateClassNames('padding-inline', paddingInline, isValidSize),
    paddingInlineStart &&
      generateClassNames(
        'padding-inline-start',
        paddingInlineStart,
        isValidSize,
      ),
    paddingInlineEnd &&
      generateClassNames('padding-inline-end', paddingInlineEnd, isValidSize),
    display && generateClassNames('display', display, isValidString),
    gap && generateClassNames('gap', gap, isValidSize),
    flexDirection &&
      generateClassNames('flex-direction', flexDirection, isValidString),
    flexWrap && generateClassNames('flex-wrap', flexWrap, isValidString),
    justifyContent &&
      generateClassNames('justify-content', justifyContent, isValidString),
    alignItems && generateClassNames('align-items', alignItems, isValidString),
    textAlign && generateClassNames('text-align', textAlign, isValidString),
    width && generateClassNames('width', width, isValidString),
    height && generateClassNames('height', height, isValidString),
    color && generateClassNames('color', color, isValidString),
    backgroundColor &&
      generateClassNames('background-color', backgroundColor, isValidString),
    borderRadius && generateClassNames('rounded', borderRadius, isValidString),
    borderStyle &&
      generateClassNames('border-style', borderStyle, isValidString),
    borderColor &&
      generateClassNames('border-color', borderColor, isValidString),
    borderWidth && generateClassNames('border-width', borderWidth, isValidSize),
    {
      // Auto applied classes
      // ---Borders---
      // if borderWidth or borderColor is supplied w/o style, default to solid
      'box--border-style-solid':
        !borderStyle && (Boolean(borderWidth) || Boolean(borderColor)),
      // if borderColor supplied w/o width, default to 1
      'box--border-width-1': !borderWidth && Boolean(borderColor),
      // ---Flex/Grid alignment---
      // if justifyContent or alignItems supplied w/o display, default to flex
      'box--display-flex':
        !display && (Boolean(justifyContent) || Boolean(alignItems)),
    },
  );
  // Apply Box styles to any other component using function pattern
  if (typeof children === 'function') {
    return children(boxClassName);
  }
  const Component = as;

  const ariaLabelProp = {};
  if (isCustomComponent(Component)) {
    ariaLabelProp.ariaLabel = ariaLabel;
  } else {
    ariaLabelProp['aria-label'] = ariaLabel;
  }

  if (props['aria-label']) {
    ariaLabelProp['aria-label'] = props['aria-label'];
  }

  return (
    <Component className={boxClassName} ref={ref} {...props} {...ariaLabelProp}>
      {children}
    </Component>
  );
});

// Both class or functional components have type function.
// Built-in HTML elements (div, span, etc.) have type string.
function isCustomComponent(element) {
  return typeof element.type === 'function';
}

Box.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  flexDirection: PropTypes.oneOfType([
    PropTypes.oneOf(Object.values(FlexDirection)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.values(FlexDirection))),
  ]),
  flexWrap: PropTypes.oneOfType([
    PropTypes.oneOf(Object.values(FlexWrap)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.values(FlexWrap))),
  ]),
  gap: MultipleSizes,
  margin: MultipleSizesAndAuto,
  marginTop: MultipleSizesAndAuto,
  marginBottom: MultipleSizesAndAuto,
  marginRight: MultipleSizesAndAuto,
  marginLeft: MultipleSizesAndAuto,
  marginInline: MultipleSizesAndAuto,
  marginInlineStart: MultipleSizesAndAuto,
  marginInlineEnd: MultipleSizesAndAuto,
  padding: MultipleSizes,
  paddingTop: MultipleSizes,
  paddingBottom: MultipleSizes,
  paddingRight: MultipleSizes,
  paddingLeft: MultipleSizes,
  paddingInline: MultipleSizes,
  paddingInlineStart: MultipleSizes,
  paddingInlineEnd: MultipleSizes,
  borderColor: MultipleBorderColors,
  borderWidth: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  borderRadius: PropTypes.oneOfType([
    PropTypes.oneOf(Object.values(BorderRadius)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.values(BorderRadius))),
  ]),
  borderStyle: PropTypes.oneOfType([
    PropTypes.oneOf(Object.values(BorderStyle)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.values(BorderStyle))),
  ]),
  alignItems: MultipleAlignItems,
  justifyContent: MultipleJustifyContents,
  textAlign: PropTypes.oneOfType([
    PropTypes.oneOf(Object.values(TextAlign)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.values(TextAlign))),
  ]),
  display: PropTypes.oneOfType([
    PropTypes.oneOf(Object.values(Display)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.values(Display))),
  ]),
  width: MultipleBlockSizes,
  height: MultipleBlockSizes,
  backgroundColor: MultipleBackgroundColor,
  className: PropTypes.string,
  style: PropTypes.object,
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Box component
   * Defaults to 'div'
   */
  as: PropTypes.string,
  /**
   * The color of the Typography component Should use the COLOR object from
   * ./ui/helpers/constants/design-system.js
   */
  color: MultipleTextColors,
  ariaLabel: PropTypes.string,
  'aria-label': PropTypes.string,
};

export default Box;
