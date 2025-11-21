import { hasProperty, isPlainObject, type Json } from '@metamask/utils';

/**
 * Used in a mask to specify that all properties should be masked in the same
 * way.
 */
export const AllProperties = Symbol('*');

/**
 * A JSON-serializable primitive value.
 */
type JsonPrimitive = string | number | boolean | null;

/**
 * A primitive value that can be masked. Must be JSON-serializable.
 */
type MaskablePrimitive = JsonPrimitive;

/**
 * An array that can be masked. Must be JSON-serializable.
 */
type MaskableArray = Json[];

/**
 * A JSON-serializable plain object; the input to `maskObject`.
 */
type MaskablePlainObject = { [prop: string]: Json };

/**
 * A value that can be masked. Must be JSON-serializable.
 */
type MaskableValue = MaskablePrimitive | MaskableArray | MaskablePlainObject;

/**
 * Common interface for all masks.
 */
type BaseSubmask = boolean | undefined;

/**
 * Instructs `maskPrimitive` how to mask a (JSON-serializable) primitive.
 */
type PrimitiveMask = BaseSubmask;

/**
 * Instructs `maskPlainObject` to mask all properties of an object.
 */
type MaskWithAllProperties = { [AllProperties]: NonNullable<Mask> };

/**
 * A mask with string keys.
 */
type MaskWithStringKeys = { [prop: string]: Mask };

/**
 * Instructs `maskObject` how to mask a (root) plain object.
 */
type StrictPlainObjectMask = MaskWithAllProperties | MaskWithStringKeys;

/**
 * Instructs `maskPlainObject` how to mask a plain object.
 */
type ArrayMask = BaseSubmask | MaskWithAllProperties;

/**
 * Instructs `maskPlainObject` how to mask a plain object.
 */
type PlainObjectMask = BaseSubmask | StrictPlainObjectMask;

/**
 * Instructs `maskValue` how to mask a JSON-serializable value.
 */
type Mask = PrimitiveMask | ArrayMask | PlainObjectMask;

/**
 * The result of masking a JSON-serializable primitive.
 */
// Note that this implicitly includes 'string', 'number', etc.
type MaskedPrimitive = JsonPrimitive;

/**
 * The result of masking a JSON-serializable array.
 */
type MaskedArray = MaskedValue[] | 'array';

/**
 * The result of masking the root object.
 */
type MaskedStrictPlainObject = { [prop: string]: MaskedValue };

/**
 * The result of masking a JSON-serializable plain object.
 */
type MaskedPlainObject = MaskedStrictPlainObject | 'object';

/**
 * The result of masking a JSON-serializable value.
 */
type MaskedValue = MaskedPrimitive | MaskedArray | MaskedPlainObject;

/**
 * Determines if the given mask contains the special "AllProperties" key.
 *
 * @param mask - The mask to check.
 * @returns True if the mask contains the special "AllProperties" key, false
 * otherwise.
 */
function isMaskWithAllProperties(mask: Mask): mask is MaskWithAllProperties {
  return typeof mask === 'object' && hasProperty(mask, AllProperties);
}

/**
 * When `AllProperties` is present in a mask, it must be the only key. This
 * function makes sure no other keys are present.
 *
 * @param mask - The mask to validate.
 * @throws If other keys are present alongside AllProperties.
 */
function validateMaskWithAllProperties(mask: NonNullable<Mask>): void {
  const symbolKeys = Object.getOwnPropertySymbols(mask);
  const stringKeys = Object.keys(mask);
  const totalKeys = symbolKeys.length + stringKeys.length;
  if (totalKeys > 1) {
    console.log('mask', mask);
    throw new Error(
      'A mask with AllProperties cannot contain any other properties',
    );
  }
}

/**
 * Masks a primitive (must be JSON-compatible, so string, number, boolean, and
 * null).
 *
 * @param value - The primitive value to mask
 * @param mask - The mask to apply (must be true, false, or undefined).
 * @returns The masked value
 */
function maskPrimitive(
  value: MaskablePrimitive,
  mask: PrimitiveMask,
): MaskedPrimitive {
  if (mask === true) {
    // Preserve value as-is
    return value;
  }

  // Return the type description
  return value === null ? 'null' : typeof value;
}

/**
 * Ensures that a mask for an array is valid.
 *
 * @param mask - The mask to validate.
 * @throws If the mask is not valid.
 */
function validateArrayMask(mask: Mask): asserts mask is ArrayMask {
  if (
    typeof mask !== 'boolean' &&
    mask !== undefined &&
    !isMaskWithAllProperties(mask)
  ) {
    throw new Error(
      'The mask for an array must be a boolean, a plain object with a single AllProperties property, or undefined',
    );
  }

  if (isMaskWithAllProperties(mask)) {
    validateMaskWithAllProperties(mask);
  }
}

/**
 * Masks an array.
 *
 * @param array - The array to mask.
 * @param mask - The mask to apply to the array.
 * @returns The masked array.
 * @throws If mask is not a boolean, a plain object, or undefined.
 */
function maskArray(array: MaskableArray, mask: ArrayMask): MaskedArray {
  if (mask === true) {
    // Don't mask the array at all
    return array;
  }

  if (mask === undefined || mask === false) {
    // Mask the entire array
    return 'array';
  }

  // Consult the mask to know which properties to mask within the object
  const effectiveMask = isMaskWithAllProperties(mask)
    ? mask[AllProperties]
    : mask;
  return array.map((item) => maskValue(item, effectiveMask));
}

/**
 * Ensures that a mask for a plain object is valid.
 *
 * @param mask - The mask to validate.
 * @param useStrictMaskValidation - If true, only allow mask to be a plain
 * object. If false, allow it to be a plain object but also boolean or
 * undefined.
 * @throws If the mask is not valid.
 */
function validatePlainObjectMask(
  mask: Mask,
  useStrictMaskValidation: boolean,
): asserts mask is PlainObjectMask {
  if (useStrictMaskValidation) {
    if (!isPlainObject(mask)) {
      throw new Error('The mask for a plain object must be a plain object');
    }
  } else if (
    !(typeof mask === 'boolean' || isPlainObject(mask) || mask === undefined)
  ) {
    throw new Error(
      'The mask for a plain object must be a boolean, a plain object, or undefined',
    );
  }

  if (isMaskWithAllProperties(mask)) {
    validateMaskWithAllProperties(mask);
  }
}

/**
 * Masks a root plain object.
 *
 * @param plainObject - The object to mask.
 * @param mask - The mask to apply to the object.
 * @returns The masked object.
 */
function maskPlainObject(
  plainObject: MaskablePlainObject,
  mask: StrictPlainObjectMask,
): MaskedStrictPlainObject;

/**
 * Masks a non-root plain object.
 *
 * @param plainObject - The object to mask.
 * @param mask - The mask to apply to the object.
 * @returns The masked object.
 */
function maskPlainObject(
  plainObject: MaskablePlainObject,
  mask: PlainObjectMask,
): MaskedPlainObject;

function maskPlainObject(
  plainObject: MaskablePlainObject,
  mask: PlainObjectMask | StrictPlainObjectMask,
): MaskedPlainObject | StrictPlainObjectMask {
  if (mask === true) {
    // Don't mask any properties in the object
    return plainObject;
  }

  if (mask === undefined || mask === false) {
    // Mask the entire object
    return 'object';
  }

  // Consult the mask to know which properties to mask within the object
  return Object.entries(plainObject).reduce<
    Exclude<MaskedPlainObject, 'object'>
  >((obj, [key, value]) => {
    const maskForKey = isMaskWithAllProperties(mask)
      ? mask[AllProperties]
      : mask[key];
    if (maskForKey === true) {
      // Don't mask the value
      return { ...obj, [key]: value };
    }
    // Mask the value
    return { ...obj, [key]: maskValue(value, maskForKey) };
  }, {});
}

/**
 * Mask anything that is JSON-serializable. Called recursively to mask
 * sub-values.
 *
 * @param value - The value to mask.
 * @param mask - The mask to apply to the value.
 * @returns The masked value.
 * @throws If mask is not a boolean, a plain object, or undefined.
 */
function maskValue(value: MaskableValue, mask: Mask): MaskedValue {
  if (value === undefined) {
    // There is no value to mask, so use it as-is
    return value;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    if (!(typeof mask === 'boolean' || mask === undefined)) {
      throw new Error(
        'The mask for a primitive must be a boolean or undefined',
      );
    }

    return maskPrimitive(value, mask);
  }

  if (Array.isArray(value)) {
    validateArrayMask(mask);
    return maskArray(value, mask);
  }

  if (isPlainObject(value)) {
    validatePlainObjectMask(mask, false);
    return maskPlainObject(value, mask);
  }

  throw new Error('Cannot mask a non-JSON-serializable value');
}

/* eslint-disable jsdoc/check-indentation */
/**
 * Return a "masked" copy of the given plain object (which must be
 * JSON-serializable).
 *
 * The mask may either be:
 *
 * - an object with the same shape as the given object, except the only values
 *   are `true`, `false`, or a sub-mask.
 *   - `true` causes the value of the property to be preserved.
 *   - `false` causes the value of the property to be replaced with its type.
 * - an object with a single `AllProperties` key, in which case the value
 *   becomes the mask, and the values must be the same as those specified above.
 *
 * @param plainObject - The object to mask.
 * @param mask - The mask to apply to the object.
 * @returns The object with properties masked according the rules given above.
 */
/* eslint-enable jsdoc/check-indentation */
export function maskObject(
  plainObject: MaskablePlainObject,
  mask: StrictPlainObjectMask,
): MaskedStrictPlainObject {
  if (!isPlainObject(plainObject)) {
    throw new Error('Cannot mask a non-JSON-serializable object');
  }
  validatePlainObjectMask(mask, true);

  return maskPlainObject(plainObject, mask);
}
