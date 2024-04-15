import React from 'react';
import classnames from 'classnames';
import { memoize } from 'lodash';

import { BREAKPOINTS } from '../../../helpers/constants/design-system';

import type {
  BoxComponent,
  BoxProps,
  PolymorphicRef,
  StyleDeclarationType,
  StylePropValueType,
  ClassNamesObject,
} from './box.types';

const BASE_CLASS_NAME = 'mm-box';

function isValidSize(
  styleProp: StyleDeclarationType,
  value: StylePropValueType,
) {
  // Only margin types allow 'auto'
  return (
    typeof value === 'number' ||
    ((styleProp === 'margin' ||
      styleProp === 'margin-top' ||
      styleProp === 'margin-right' ||
      styleProp === 'margin-bottom' ||
      styleProp === 'margin-left' ||
      styleProp === 'margin-inline' ||
      styleProp === 'margin-inline-start' ||
      styleProp === 'margin-inline-end') &&
      value === 'auto')
  );
}

function isValidString(type: StyleDeclarationType, value: StylePropValueType) {
  return typeof type === 'string' && typeof value === 'string';
}

/**
 * Generate classnames
 * Generates classnames for different utility styles
 * Also accepts responsive props in the form of an array
 * Maps responsive props to mobile first breakpoints
 *
 * @param {string} styleDeclaration - The style declaration type "margin", "margin-top", "padding", "display" etc
 * @param {array || number || string} value - prop value being passed in array props are responsive props
 * @param {*} validatorFn - The validation function for each type of value
 * @returns
 */

const generateClassNames = memoize(
  (
    styleDeclaration: StyleDeclarationType,
    value: StylePropValueType,
    validatorFn: typeof isValidString | typeof isValidSize,
  ) => {
    // if value does not exist return empty object for classnames library
    // Accepts 0 as a valid value
    if (!value && typeof value !== 'number') {
      return {};
    }
    const classNamesObject: ClassNamesObject = {};
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
    let singleValue;
    if (singleValueProp || singleValueProp === 0) {
      singleValue = singleValueProp;
    }
    if (singleArrayItemProp || singleArrayItemProp === 0) {
      singleValue = singleArrayItemProp;
    }
    // 0 is an acceptable value but is falsy in js
    if (singleValue || singleValue === 0) {
      // add base style without any breakpoint prefixes to classObject
      classNamesObject[
        `${BASE_CLASS_NAME}--${styleDeclaration}-${singleValue}`
      ] = validatorFn(styleDeclaration, singleValue);
    } else if (Array.isArray(value)) {
      // If array with more than one item
      switch (value.length) {
        case 4:
          // add base/sm/md/lg
          classNamesObject[
            `${BASE_CLASS_NAME}--${styleDeclaration}-${value[0]}`
          ] = validatorFn(styleDeclaration, value[0]);
          classNamesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[1]}:${styleDeclaration}-${value[1]}`
          ] = validatorFn(styleDeclaration, value[1]);
          classNamesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[2]}:${styleDeclaration}-${value[2]}`
          ] = validatorFn(styleDeclaration, value[2]);
          classNamesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[3]}:${styleDeclaration}-${value[3]}`
          ] = validatorFn(styleDeclaration, value[3]);
          break;
        case 3:
          // add base/sm/md
          classNamesObject[
            `${BASE_CLASS_NAME}--${styleDeclaration}-${value[0]}`
          ] = validatorFn(styleDeclaration, value[0]);
          classNamesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[1]}:${styleDeclaration}-${value[1]}`
          ] = validatorFn(styleDeclaration, value[1]);
          classNamesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[2]}:${styleDeclaration}-${value[2]}`
          ] = validatorFn(styleDeclaration, value[2]);
          break;
        case 2:
          // add base/sm
          classNamesObject[
            `${BASE_CLASS_NAME}--${styleDeclaration}-${value[0]}`
          ] = validatorFn(styleDeclaration, value[0]);
          classNamesObject[
            `${BASE_CLASS_NAME}--${BREAKPOINTS[1]}:${styleDeclaration}-${value[1]}`
          ] = validatorFn(styleDeclaration, value[1]);
          break;
        default:
          console.log(`Invalid array prop length: ${value.length}`);
      }
    }
    return classNamesObject;
  },
  (styleDeclaration, value) => `${styleDeclaration}${value}`,
);

export const Box: BoxComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
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
      flexDirection,
      flexWrap,
      gap,
      display,
      width,
      minWidth,
      height,
      children,
      className = '',
      backgroundColor,
      color,
      ...props
    }: BoxProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const Component = as || 'div';
    const boxClassName = classnames(
      BASE_CLASS_NAME,
      className,
      // Margin
      generateClassNames('margin', margin, isValidSize),
      generateClassNames('margin-top', marginTop, isValidSize),
      generateClassNames('margin-right', marginRight, isValidSize),
      generateClassNames('margin-bottom', marginBottom, isValidSize),
      generateClassNames('margin-left', marginLeft, isValidSize),
      generateClassNames('margin-inline', marginInline, isValidSize),
      generateClassNames('margin-inline-start', marginInlineStart, isValidSize),
      generateClassNames('margin-inline-end', marginInlineEnd, isValidSize),
      // Padding
      generateClassNames('padding', padding, isValidSize),
      generateClassNames('padding-top', paddingTop, isValidSize),
      generateClassNames('padding-right', paddingRight, isValidSize),
      generateClassNames('padding-bottom', paddingBottom, isValidSize),
      generateClassNames('padding-left', paddingLeft, isValidSize),
      generateClassNames('padding-inline', paddingInline, isValidSize),
      generateClassNames(
        'padding-inline-start',
        paddingInlineStart,
        isValidSize,
      ),
      generateClassNames('padding-inline-end', paddingInlineEnd, isValidSize),
      generateClassNames('display', display, isValidString),
      generateClassNames('gap', gap, isValidSize),
      generateClassNames('flex-direction', flexDirection, isValidString),
      generateClassNames('flex-wrap', flexWrap, isValidString),
      generateClassNames('justify-content', justifyContent, isValidString),
      generateClassNames('align-items', alignItems, isValidString),
      generateClassNames('text-align', textAlign, isValidString),
      generateClassNames('width', width, isValidString),
      generateClassNames('min-width', minWidth, isValidString),
      generateClassNames('height', height, isValidString),
      generateClassNames('color', color, isValidString),
      generateClassNames('background-color', backgroundColor, isValidString),
      generateClassNames('rounded', borderRadius, isValidString),
      generateClassNames('border-style', borderStyle, isValidString),
      generateClassNames('border-color', borderColor, isValidString),
      generateClassNames('border-width', borderWidth, isValidSize),
      {
        // Auto applied classes
        // ---Borders---
        // if borderWidth or borderColor is supplied w/o style, default to solid
        'box--border-style-solid':
          !borderStyle && (Boolean(borderWidth) || Boolean(borderColor)),
        // if borderColor supplied w/o width, default to 1
        'box--border-width-1': !borderWidth && Boolean(borderColor),
      },
    );
    return (
      <Component className={boxClassName} ref={ref} {...props}>
        {children}
      </Component>
    );
  },
);
