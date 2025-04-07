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
 * Defines the possible states of the tourniquet.
 * - 'closed': The default state. Relaxes parameter types at compile time.
 * - 'open': Strict state. Enforces the original function's parameter types.
 */
type TourniquetStatus = 'open' | 'closed';

/**
 * Determines the return type of the TS_TOURNIQUET's inner function based on its status.
 * When the tourniquet is "closed" (Status='closed'), it returns a function
 * type with potentially widened parameter types if the widening is valid according
 * to IsWideningOf.
 * When the tourniquet is "open" (Status='open'), it bypasses widening and returns
 * the original function type, allowing type errors at call sites to surface.
 *
 * @template TFunc - The original function type.
 * @template TWidened - The potential widened parameter types (used when tourniquet is closed).
 * @template Status - The current status of the tourniquet ('open' or 'closed').
 */
type TourniquetReturnType<
  TFunc extends (...args: any[]) => any,
  TWidened extends any[],
  Status extends TourniquetStatus,
> = Status extends 'open'
  ? TFunc // If Status is 'open', bypass widening and return the original function type.
  : IsWideningOf<Parameters<TFunc>, TWidened> extends true
  ? // If Status is 'closed' and IsWideningOf is true, return the widened type.
    (...args: TWidened) => ReturnType<TFunc>
  : // Otherwise (widening is invalid), return 'never' to indicate a type error.
    never;

/**
 * Applies a TypeScript "tourniquet" to a function's type signature.
 * This utility is intended for gradual migrations, especially JS-to-TS conversions,
 * where call sites might temporarily use wider types than the function's strict implementation requires.
 *
 * By default (Status='closed'), the tourniquet "closes" around the function type,
 * relaxing the parameter types at compile time to match TWidened (if valid).
 * This suppresses type errors at call sites, allowing large files to be converted
 * and merged without immediately fixing all downstream type mismatches ("stopping the bleeding").
 *
 * Setting Status='open' "opens" or "releases" the tourniquet, restoring the original
 * function type signature. This allows developers to incrementally fix the type errors
 * at the call sites revealed by the stricter checking.
 *
 * Uses IsWideningOf to ensure TWidened is a valid superset of the original parameters.
 *
 * IMPORTANT: This helper uses 'as any' internally and only affects compile-time checks.
 * It does NOT alter runtime behavior and relies on the assumption that runtime values
 * actually conform to the original function's narrower types. Use with discipline.
 *
 * @example
 * ```typescript
 * function takesHex(hex: `0x${string}`) {  ...  }
 *
 * // Apply tourniquet: appears to take string, suppresses errors if called with string
 * const takesStringTemporarily = TS_TOURNIQUET<[string]>()(takesHex);
 * takesStringTemporarily('0x123'); // OK at compile time
 *
 * // Release tourniquet: enforces original `0x${string}`, reveals errors
 * const takesHexStrictly = TS_TOURNIQUET<[string], 'open'>()(takesHex);
 * declare const myString: string;
 * takesHexStrictly(myString); // Compile-time error: string is not `0x${string}`
 * ```
 *
 * @template TWidened - The parameter types to assume when the tourniquet is closed.
 * @template Status - Controls the tourniquet state ('closed'=relaxed, 'open'=strict). Defaults to 'closed'.
 * @returns A function that accepts the original function and returns it with a potentially modified type signature based on the tourniquet state.
 */
export function TS_TOURNIQUET<
  TWidened extends any[],
  Status extends TourniquetStatus = 'closed',
>() {
  return <TFunc extends (...args: any[]) => any>(
    fn: TFunc,
  ): TourniquetReturnType<TFunc, TWidened, Status> => {
    // Using 'as any' is necessary here to apply the tourniquet effect at compile time.
    // It bypasses strict type checking for the function itself, allowing its signature
    // to appear wider temporarily, while preserving the original runtime behavior.
    return fn as any;
  };
}
