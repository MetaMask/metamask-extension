/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Type helper that checks if TWidened is an element-wise widening
 * of the elements in TOriginal
 *
 * @example
 * const oFn = (a: `0x${string}`, b: number) => a + b;
 * const wFn = (a: string, b: number) => a + b;
 *
 * IsWideningOf<Parameters<typeof oFn>, Parameters<typeof wFn>> // true
 * IsWideningOf<Parameters<typeof wFn>, Parameters<typeof oFn>> // false
 */
type IsWideningOf<
  TOriginal extends any[],
  TWidened extends any[],
> = TOriginal extends [infer OHead, ...infer OTail]
  ? TWidened extends [infer WHead, ...infer WTail]
    ? OHead extends WHead
      ? IsWideningOf<OTail, WTail>
      : false
    : false
  : TOriginal extends []
  ? TWidened extends []
    ? true
    : false
  : false;

/**
 * Determines the return type of the FUNCTION_TOURNIQUET's inner function based
 * on whether the tourniquet is open and if the widened types are valid.
 *
 * @template TFunc - The original function type.
 * @template TWidened - The potential widened parameter types.
 * @template IsOpen - A flag to bypass widening and return the original type.
 */
type TourniquetReturnType<
  TFunc extends (...args: any[]) => any,
  TWidened extends any[],
  IsOpen extends boolean,
> = IsOpen extends true
  ? TFunc // If IsOpen is true, bypass widening and return the original function type.
  : IsWideningOf<Parameters<TFunc>, TWidened> extends true
  ? // If IsWideningOf is true, return the function type with widened parameters.
    (...args: TWidened) => ReturnType<TFunc>
  : // Otherwise (widening is invalid), return 'never' to indicate a type error.
    never;

/**
 * Type helper that widens the signature of a function. Should be used when callers
 * are already using the widened types and allows for a gradual narrowing of the signature
 * to the desired types. Designed to help keep PRs small and focused.
 *
 * Uses IsWideningOf to enforce that the widened types are a superset of the original types.
 *
 * Does not alter runtime behavior as it returns the original function with a modified type signature.
 *
 * @example
 * function takesHex(hex: `0x${string}`) {
 *   return hex;
 * }
 *
 * // type is (string) => `0x${string}`
 * const takesString = FUNCTION_TOURNIQUET<[string]>()(takesHex);
 *
 * takesString('a string'); // No type error, even though the original function expects `0x${string}`
 * @template TWidened - The widened parameter types as a tuple
 * @returns A function that accepts the original function and returns it with widened parameter types
 */
export function FUNCTION_TOURNIQUET<
  TWidened extends any[],
  IsOpen extends boolean = false,
>() {
  return <TFunc extends (...args: any[]) => any>(
    fn: TFunc,
  ): TourniquetReturnType<TFunc, TWidened, IsOpen> => {
    // Using 'as any' is necessary here to bypass type checking during migration.
    // This allows us to temporarily widen parameter types without TypeScript errors,
    // while preserving runtime behavior of the original function.
    return fn as any;
  };
}
