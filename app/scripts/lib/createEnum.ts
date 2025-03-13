/**
 * A simplified enum implementation that provides type safety and runtime access to enum values
 * @example
 * // Create a simple enum with color values
 * const Colors = createEnum([
 *   'Red',
 *   'Green',
 *   'Blue',
 * ] as const);
 *
 * // Access enum values directly
 * Colors.Red.value === 'Red' // true
 *
 * // Use boolean flags for convenient checks
 * Colors.Red.isRed === true
 * Colors.Red.isBlue === false
 *
 * // Get all enum values as an array
 * Colors.values // ['Red', 'Green', 'Blue']
 *
 * // Use with TypeScript for type safety
 * type ColorType = typeof Colors.type;
 * const isRed = (color: ColorType) => color.value === 'Red';
 *
 * @param values - Array of string values for the enum
 * @returns An object with the enum values as both keys and values, plus a 'values' property
 */
export const createEnum = <T extends readonly string[]>(values: T) => {
  type Value = T[number];

  // For any specific enum value V, define a type where:
  // - The `value` property is exactly V
  // - Only the `is${V}` property is true, all other `is${OtherValue}` properties are false
  type ValueObject<V extends Value> = {
    readonly value: V;
    toString(): string;
  } & {
    // For each possible is* property:
    readonly [K in `is${Value}`]: K extends `is${infer U}`
      ? U extends V
        ? true
        : false
      : never;
  };

  type EnumObject = {
    readonly [V in Value]: ValueObject<V>;
  } & {
    readonly values: Value[];
    readonly type: ValueObject<Value>;
  };

  // Create the enum values
  const createValueObject = (value: Value) => {
    // Create the base object with value and toString
    const enumValue = {
      value,
      toString() {
        return value;
      },
    } as Record<string, unknown>;

    // Add 'is' properties for each possible value
    values.forEach((val: Value) => {
      enumValue[`is${val}`] = value === val;
    });

    return Object.freeze(enumValue) as ValueObject<typeof value>;
  };

  const enumObj = {} as Record<Value, ValueObject<Value>>;
  const valuesArray = [] as Value[];

  values.forEach((val: Value) => {
    const enumValue = createValueObject(val);
    enumObj[val] = enumValue;
    valuesArray.push(val);
  });

  Object.defineProperty(enumObj, 'values', {
    value: Object.freeze(valuesArray),
    enumerable: false,
  });

  return Object.freeze(enumObj) as EnumObject;
};
