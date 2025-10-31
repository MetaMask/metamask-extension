import { JSXElement, GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { hasChildren } from '@metamask/snaps-utils';
import { memoize } from 'lodash';
import { sha256 } from '@noble/hashes/sha256';
import { NonEmptyArray, bytesToHex, remove0x } from '@metamask/utils';
import { unescape as unescapeEntities } from 'he';
import { ChangeEvent as ReactChangeEvent } from 'react';
import { createTheme, ThemeOptions } from '@material-ui/core';
import { MuiPickersOverrides } from '@material-ui/pickers/typings/overrides';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import type { UIComponent } from './components/types';
import type { COMPONENT_MAPPING } from './components';

export type MapToTemplateParams = {
  map: Record<string, number>;
  element: JSXElement;
  form?: string;
  useFooter?: boolean;
  onCancel?: () => void;
  promptLegacyProps?: {
    onInputChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
    inputValue: string;
    placeholder?: string;
  };
  t?: (key: string) => string;
  contentBackgroundColor?: string | undefined;
  componentMap: COMPONENT_MAPPING;
};

/**
 * Get a truncated version of component children to use in a hash.
 *
 * @param component - The component.
 * @returns A truncated version of component children to use in a hash.
 */
function getChildrenForHash(component: JSXElement) {
  if (!hasChildren(component)) {
    return null;
  }

  const { children } = component.props;

  if (typeof children === 'string') {
    // For the hash we reduce long strings
    return children.slice(0, 5000);
  }

  if (Array.isArray(children)) {
    // For arrays of children we just use the types
    return (children as GenericSnapElement[]).map((child) => ({
      type: child?.type ?? null,
    }));
  }

  return children;
}

/**
 * A memoized function for generating a hash that represents a Snap UI component.
 *
 * This can be used to generate React keys for components.
 *
 * @param component - The component.
 * @returns A hash as a string.
 */
const generateHash = memoize((component: JSXElement) => {
  const { type, props } = component;
  const { name } = props as { name?: string };
  const children = getChildrenForHash(component);
  return remove0x(
    bytesToHex(
      sha256(
        JSON.stringify({
          type,
          name: name ?? null,
          children,
        }),
      ),
    ),
  );
});

/**
 * Generate a React key to be used for a Snap UI component.
 *
 * This function also handles collisions between duplicate keys.
 *
 * @param map - A map of previously used keys to be used for collision handling.
 * @param component - The component.
 * @returns A key.
 */
function generateKey(
  map: Record<string, number>,
  component: JSXElement,
): string {
  const hash = generateHash(component);
  const count = (map[hash] ?? 0) + 1;
  map[hash] = count;
  return `${hash}_${count}`;
}

export const mapToTemplate = (params: MapToTemplateParams): UIComponent => {
  const { type, key } = params.element;
  const elementKey = key ?? generateKey(params.map, params.element);
  const mapped = params.componentMap[
    type as Exclude<JSXElement['type'], 'Option' | 'Radio' | 'SelectorOption'>
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ](params as any);
  return { ...mapped, key: elementKey } as UIComponent;
};

export const mapTextToTemplate = (
  elements: NonEmptyArray<JSXElement | string>,
  params: Pick<MapToTemplateParams, 'map' | 'componentMap'>,
): NonEmptyArray<UIComponent | string> =>
  elements.map((element) => {
    // With the introduction of JSX elements here can be strings.
    if (typeof element === 'string') {
      // We unescape HTML entities here, to allow usage of &bull; etc.
      return unescapeEntities(element);
    }

    return mapToTemplate({ ...params, element });
  }) as NonEmptyArray<UIComponent | string>;

/**
 * Registry of element types that are used within Field element.
 */
export const FIELD_ELEMENT_TYPES = [
  'FileInput',
  'AddressInput',
  'Input',
  'Dropdown',
  'RadioGroup',
  'Checkbox',
  'Selector',
  'AssetSelector',
  'AccountSelector',
  'DateTimePicker',
];

/**
 * Search for the element that is considered to be primary child element of a Field.
 *
 * @param children - Children elements specified within Field element.
 * @returns Number, representing index of a primary field in the array of children elements.
 */
export const getPrimaryChildElementIndex = (children: JSXElement[]) => {
  return children.findIndex((c) => FIELD_ELEMENT_TYPES.includes(c.type));
};

/**
 * Map Snap custom color to extension compatible color.
 *
 * @param color - Snap custom color.
 * @returns String, representing color from design system.
 */
export const mapToExtensionCompatibleColor = (color: string) => {
  const backgroundColorMapping: { [key: string]: string | undefined } = {
    default: BackgroundColor.backgroundAlternative, // For Snaps, the default background color is the Alternative
    alternative: BackgroundColor.backgroundDefault,
  };
  return color ? backgroundColorMapping[color] : undefined;
};

/**
 * Map Snap custom size for border radius to extension compatible size.
 *
 * @param snapBorderRadius - Snap custom color.
 * @returns String, representing border radius size from design system.
 */
export const mapSnapBorderRadiusToExtensionBorderRadius = (
  snapBorderRadius: string | undefined,
): BorderRadius => {
  switch (snapBorderRadius) {
    case 'none':
    default:
      return BorderRadius.none;
    case 'medium':
      return BorderRadius.MD;
    case 'full':
      return BorderRadius.full;
  }
};

/**
 * The MUI theme overrides for the date/time pickers to match MetaMask design system.
 */
export const muiPickerTheme = createTheme({
  overrides: {
    MuiPickersModal: {
      dialogRoot: {
        '& *': {
          fontFamily: 'var(--font-family-default)',
        },
        backgroundColor: 'var(--color-background-default)',
        color: 'var(--color-text-default)',
        borderRadius: '8px',
      },
      withAdditionalAction: {
        '& > button': {
          color: 'var(--color-primary-default)',
          fontWeight: 'var(--typography-s-body-md-medium-font-weight)',
          fontSize: 'var(--typography-s-body-md-medium-font-size)',
          lineHeight: 'var(--typography-s-body-md-medium-line-height)',
          letterSpacing: 'var(--typography-s-body-md-medium-letter-spacing)',
          textTransform: 'none',
          '&:hover': {
            textDecoration: 'underline',
            textDecorationThickness: '2px',
            textUnderlineOffset: '4px',
            backgroundColor: 'transparent',
          },
        },
      },
      dialogAction: {
        color: 'var(--color-primary-default)',
      },
    },
    MuiPickersToolbar: {
      toolbar: {
        backgroundColor: 'var(--color-background-alternative)',
      },
    },
    MuiPickersToolbarButton: {
      toolbarBtn: {
        color: 'var(--color-text-alternative)',
      },
    },
    MuiPickersToolbarText: {
      toolbarTxt: {
        color: 'var(--color-text-alternative)',
      },
      toolbarBtnSelected: {
        color: 'var(--color-text-default)',
      },
    },
    MuiPickersCalendarHeader: {
      iconButton: {
        '&:hover': {
          backgroundColor: 'var(--color-background-alternative-hover)',
        },
        color: 'var(--color-icon-alternative)',
        backgroundColor: 'var(--color-background-alternative)',
      },
      dayLabel: {
        color: 'var(--color-text-alternative)',
      },
    },
    MuiPickersDay: {
      day: {
        color: 'var(--color-text-default)',
      },
      current: {
        color: 'var(--color-primary-default)',
      },
      dayDisabled: {
        color: 'var(--color-text-muted)',
      },
      daySelected: {
        '&:hover': {
          backgroundColor: 'var(--color-primary-default-hover)',
        },
        backgroundColor: 'var(--color-primary-default)',
        color: 'var(--color-primary-inverse)',
      },
    },
    MuiPickersClock: {
      clock: {
        backgroundColor: 'var(--color-background-alternative)',
      },
      pin: {
        color: 'var(--color-primary-default)',
        backgroundColor: 'var(--color-primary-default)',
      },
    },
    MuiPickersClockPointer: {
      pointer: {
        backgroundColor: 'var(--color-primary-default)',
      },
      thumb: {
        borderColor: 'var(--color-primary-default)',
        backgroundColor: 'var(--color-primary-inverse)',
      },
      noPoint: {
        backgroundColor: 'var(--color-primary-default)',
      },
    },
    MuiPickersClockNumber: {
      clockNumber: {
        color: 'var(--color-text-default)',
      },
      clockNumberSelected: {
        color: 'var(--color-primary-inverse)',
      },
    },
    MuiPickersYear: {
      root: {
        '&:focus': {
          color: 'var(--color-primary-default)',
        },
      },
      yearSelected: {
        color: 'var(--color-primary-default)',
      },
      yearDisabled: {
        color: 'var(--color-text-muted)',
      },
    },
  } as MuiPickersOverrides,
} as ThemeOptions);
