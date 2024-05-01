import { JSXElement, GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { memoize } from 'lodash';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, remove0x, Json } from '@metamask/utils';
import { unescape as unescapeEntities } from 'he';
import { COMPONENT_MAPPING } from './components';

export type MapToTemplateParams = {
  map: Record<string, number>;
  element: JSXElement;
  form?: string;
};

/**
 * Get a truncated version of component children to use in a hash.
 *
 * @param children - A JSON blob describing one or more children of a component.
 * @returns A truncated version of component children to use in a hash.
 */
function getChildrenForHash(children: Json) {
  if (typeof children === 'string') {
    // For the hash we reduce long strings
    return children.slice(0, 5000);
  }

  if (Array.isArray(children)) {
    // For arrays of children we just use the types
    return children.map((child) => ({ type: child?.type ?? null }));
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
  const { type, props } = component as GenericSnapElement;
  const { name } = props;
  const children = getChildrenForHash(props.children);
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
function generateKey(map: Record<string, number>, component: JSXElement) {
  const hash = generateHash(component);
  const count = (map[hash] ?? 0) + 1;
  map[hash] = count;
  return `${hash}_${count}`;
}

export const mapToTemplate = (params: MapToTemplateParams) => {
  const { type } = params.element;
  const indexKey = generateKey(params.map, params.element);
  // @ts-expect-error This seems to be compatibility issue between superstruct and this repo.
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = COMPONENT_MAPPING[type](params as any);
  return { ...mapped, key: indexKey };
};

export const mapTextToTemplate = (
  elements: unknown[],
  params: Pick<MapToTemplateParams, 'map'>,
) =>
  elements.map((element) => {
    // With the introduction of JSX elements here can be strings.
    if (typeof element === 'string') {
      // We unescape HTML entities here, to allow usage of &bull; etc.
      return unescapeEntities(element);
    }

    return mapToTemplate({ ...params, element });
  });
