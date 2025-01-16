import { JSXElement, GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { hasChildren } from '@metamask/snaps-utils';
import { memoize } from 'lodash';
import { sha256 } from '@noble/hashes/sha256';
import { NonEmptyArray, bytesToHex, remove0x } from '@metamask/utils';
import { unescape as unescapeEntities } from 'he';
import { ChangeEvent as ReactChangeEvent } from 'react';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import { COMPONENT_MAPPING } from './components';
import { UIComponent } from './components/types';

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
  const mapped = COMPONENT_MAPPING[
    type as Exclude<JSXElement['type'], 'Option' | 'Radio' | 'SelectorOption'>
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ](params as any);
  return { ...mapped, key: elementKey } as UIComponent;
};

export const mapTextToTemplate = (
  elements: NonEmptyArray<JSXElement | string>,
  params: Pick<MapToTemplateParams, 'map'>,
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
  'Input',
  'Dropdown',
  'RadioGroup',
  'Checkbox',
  'Selector',
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
