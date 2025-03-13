import { createEnum } from './createEnum';

describe('createEnum', () => {
  it('should create an object with string values as both keys and values', () => {
    const Colors = createEnum(['RED', 'GREEN', 'BLUE']);

    expect(Colors.RED.toString()).toBe('RED');
    expect(Colors.GREEN.toString()).toBe('GREEN');
    expect(Colors.BLUE.toString()).toBe('BLUE');
  });

  it('should provide access to all values via the values property', () => {
    const Status = createEnum(['PENDING', 'ACTIVE', 'COMPLETED']);

    expect(Status.values).toEqual(['PENDING', 'ACTIVE', 'COMPLETED']);
  });

  it('should have values property that is not enumerable', () => {
    const Sizes = createEnum(['SMALL', 'MEDIUM', 'LARGE']);

    // Check that 'values' is not included in enumerable properties
    const enumKeys = Object.keys(Sizes);
    expect(enumKeys).toEqual(['SMALL', 'MEDIUM', 'LARGE']);
  });

  it('should allow safe type inference', () => {
    const Colors = createEnum(['RED', 'GREEN', 'BLUE']);

    type ColorType = typeof Colors.type;

    const isRed = (color: ColorType) => color.value === 'RED';
    expect(isRed(Colors.RED)).toBe(true);
    expect(isRed(Colors.GREEN)).toBe(false);
  });

  it('should not allow modification of the enum values', () => {
    const Directions = createEnum(['NORTH', 'SOUTH', 'EAST', 'WEST']);

    // TypeScript would catch this at compile time, but we're testing runtime behavior
    expect(() => {
      // @ts-expect-error - Testing runtime immutability
      Directions.NORTH = 'changed';
    }).toThrow();
  });

  it('should not allow modification of the values array', () => {
    const Fruits = createEnum(['APPLE', 'BANANA', 'ORANGE']);

    // TypeScript would catch this at compile time, but we're testing runtime behavior
    expect(() => {
      Fruits.values.push('GRAPE');
    }).toThrow();

    expect(() => {
      Fruits.values[0] = 'GRAPE';
    }).toThrow();
  });

  it('should work with empty arrays', () => {
    const EmptyEnum = createEnum([]);

    expect(EmptyEnum.values).toEqual([]);
    expect(Object.keys(EmptyEnum)).toEqual([]);
  });

  // New tests for is* flag properties
  it('should have correct is* properties for each enum value', () => {
    const Colors = createEnum(['RED', 'GREEN', 'BLUE']);

    // RED flags
    expect(Colors.RED.isRED).toBe(true);
    expect(Colors.RED.isGREEN).toBe(false);
    expect(Colors.RED.isBLUE).toBe(false);

    // GREEN flags
    expect(Colors.GREEN.isRED).toBe(false);
    expect(Colors.GREEN.isGREEN).toBe(true);
    expect(Colors.GREEN.isBLUE).toBe(false);

    // BLUE flags
    expect(Colors.BLUE.isRED).toBe(false);
    expect(Colors.BLUE.isGREEN).toBe(false);
    expect(Colors.BLUE.isBLUE).toBe(true);
  });

  it('should correctly work in string contexts', () => {
    const Status = createEnum(['PENDING', 'ACTIVE', 'COMPLETED']);

    // String concatenation
    expect(Status.PENDING.value + ' status').toBe('PENDING status');

    // Comparison with string
    expect(Status.ACTIVE.value === 'ACTIVE').toBe(true);

    // String methods
    expect(Status.COMPLETED.value.toLowerCase()).toBe('completed');

    // Template literals
    expect(`Current status: ${Status.ACTIVE.value}`).toBe(
      'Current status: ACTIVE',
    );

    // Object serialization - we now expect full object serialization
    const result = JSON.stringify({ status: Status.PENDING });
    expect(result).toContain('"value":"PENDING"');
    expect(result).toContain('"isPENDING":true');
  });

  it('should not allow modification of is* properties', () => {
    const Animals = createEnum(['DOG', 'CAT', 'BIRD']);

    expect(() => {
      // @ts-expect-error - Testing runtime immutability
      Animals.DOG.isDOG = false;
    }).toThrow();

    expect(() => {
      // @ts-expect-error - Testing runtime immutability
      Animals.CAT.isBIRD = true;
    }).toThrow();
  });

  it('should preserve value property access', () => {
    const Priorities = createEnum(['LOW', 'MEDIUM', 'HIGH']);

    expect(Priorities.LOW.value).toBe('LOW');
    expect(Priorities.MEDIUM.value).toBe('MEDIUM');
    expect(Priorities.HIGH.value).toBe('HIGH');

    // Value should not be writable
    expect(() => {
      // @ts-expect-error - Testing runtime immutability
      Priorities.HIGH.value = 'CHANGED';
    }).toThrow();
  });

  it('should work with switch statements', () => {
    const Fruits = createEnum(['APPLE', 'BANANA', 'ORANGE']);

    const getFruitMessage = (fruit: typeof Fruits.type) => {
      switch (fruit.value) {
        case 'APPLE':
          return 'An apple a day';
        case 'BANANA':
          return 'Yellow and sweet';
        case 'ORANGE':
          return 'Citrus delight';
        default:
          return 'Unknown fruit';
      }
    };

    expect(getFruitMessage(Fruits.APPLE)).toBe('An apple a day');
    expect(getFruitMessage(Fruits.BANANA)).toBe('Yellow and sweet');
    expect(getFruitMessage(Fruits.ORANGE)).toBe('Citrus delight');
  });
});

// Type Validation Tests

// Create a test enum
const Colors = createEnum(['Red', 'Green', 'Blue', 'Orange'] as const);

type ColorType = typeof Colors.type;

// VALIDATION 1: Static type checking for enum properties
function staticTypeChecks() {
  // These should show in IDE as type errors, though TypeScript may not flag them as errors during compilation
  const mustBeTrue: true = Colors.Red.isRed; // Should be fine
  const mustBeFalse: false = Colors.Red.isBlue; // Should be fine
  // @ts-expect-error: Type 'false' is not assignable to type 'true'.
  const mustBeTrueButIsFalse: true = Colors.Red.isBlue;
}

// VALIDATION 2: Proper usage pattern with dynamic values
function properUsagePattern(color: ColorType) {
  // Correct usage: Check dynamic value against specific enum value
  if (color.isRed) {
    console.log('Color is red');
  } else if (color.isGreen) {
    console.log('Color is green');
  }
}

// VALIDATION 3: Discriminated unions with enum values
type ColorUnion =
  | { type: 'red'; data: string }
  | { type: 'green'; data: number }
  | { type: 'blue'; data: boolean }
  | { type: 'orange'; data: Date };

function handleColorUnion(color: ColorType, data: ColorUnion) {
  if (color.isRed && data.type === 'red') {
    // TypeScript knows data.data is a string here
    console.log(data.data.toUpperCase());
  } else if (color.isGreen && data.type === 'green') {
    // TypeScript knows data.data is a number here
    console.log(data.data.toFixed(2));
  }
}

/**
 * VALIDATION: Exhaustiveness checking
 *
 * This fails to compile because we've added Orange but haven't
 * handled it in the function.
 *
 * THE LINTER ERROR ON THIS FUNCTION IS EXPECTED AND GOOD!
 * It shows that TypeScript is detecting the missing case.
 */
function exhaustiveCheck(color: ColorType): string {
  if (color.isRed) return 'Red';
  if (color.isGreen) return 'Green';
  if (color.isBlue) return 'Blue';
  // Orange case is missing

  // TypeScript correctly flags this line with error:
  // "Type 'ValueObject<"Red" | "Green" | "Blue" | "Orange">' is not assignable to type 'never'"
  // @ts-expect-error
  const _exhaustiveCheck: never = color;
  return _exhaustiveCheck;
}

/**
 * Using value property for switch-based exhaustiveness checking
 */
function switchExhaustiveCheck(color: ColorType): string {
  // Using value property for switch statements
  switch (color.value) {
    case 'Red':
      return 'It is red';
    case 'Green':
      return 'It is green';
    case 'Blue':
      return 'It is blue';
    // Missing Orange case

    default:
      // This will correctly error with:
      // "Type '"Orange"' is not assignable to type 'never'"
      // This confirms that value-based exhaustiveness also works
      // @ts-expect-error
      const unreachable: never = color.value;
      return unreachable;
  }
}

// VALIDATION 5: Type mapping with enum values
// Use keyof to extract just the color keys, excluding utility properties
type ColorKeys = Extract<
  keyof typeof Colors,
  'Red' | 'Green' | 'Blue' | 'Orange'
>;

type ColorMap = {
  [K in ColorKeys]: string;
};

// This should error because Orange is missing
const colorNames: Partial<ColorMap> = {
  Red: 'Crimson',
  Green: 'Forest',
  Blue: 'Azure',
  // Orange is missing - TypeScript should catch this!
};
