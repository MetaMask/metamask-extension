/**
 * Type-level utilities and compile-time assertions
 * for use in `*.spec.ts` type-level tests.
 *
 * @example
 * ```typescript
 * type _Tests = [
 *   Expect<IsEquivalent<string, string>>,
 *   Expect<IsEquivalent<Foo, Bar>, false>,
 * ];
 * ```
 */

/**
 * Uninhabitable branded type used by {@link Expect} to force compile errors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
type _ = {
  readonly _: unique symbol;
};

/**
 * Resolves to `true` if `Type` is `any`, otherwise `false`.
 */
export type IsAny<Type> = 0 extends 1 & Type ? true : false;

/**
 * Resolves to `true` if `Type` is `never`, otherwise `false`.
 *
 * Wraps in a tuple to prevent distributive conditional evaluation.
 *
 * @see {@link https://gist.github.com/MajorLift/1cf2f949dbe973a6178dd7ad4bcc7612}
 */
export type IsNever<Type> = [Type] extends [never] ? true : false;

/**
 * Resolves to `true` if `TypeA` and `TypeB` are mutually assignable,
 * otherwise `false`.
 *
 * Guards against `any` by detecting it explicitly first
 * (the naive `[A, B] extends [B, A]` check returns true if either input is `any`).
 *
 * @template TypeA - The type to check.
 * @template TypeB - The type to check.
 */
export type IsEquivalent<TypeA, TypeB> =
  IsAny<TypeA> extends true
    ? IsAny<TypeB>
    : IsAny<TypeB> extends true
      ? false
      : [TypeA, TypeB] extends [TypeB, TypeA]
        ? true
        : false;

/**
 * Compile-time assertion. Produces a type error when `TypeX` does not
 * match `TypeV` (defaults to `true`).
 *
 * Use `Expect<IsEquivalent<A, B>>` when `any`-safety is needed.
 * `Expect<IsEquivalent<any, string>>` will throw an error, but
 * `Expect<any, string>` passes silently.
 *
 * The constraint uses a naive mutual-extends check because `IsEquivalent`
 * (which guards against `any`) causes a circular constraint error when
 * referenced in `TypeX`'s own bound.
 *
 * The body has two explicit `never` guards:
 * `TypeV = never` prevents infinite recursion (`Expect<never, never>` resolves to `never`).
 * `TypeX = never` passes the constraint silently (since `never extends T`
 * is always true), so this triggers TS2589 ("excessively deep") as the failure signal.
 * @template TypeX - The type to assert.
 * @template TypeV - The expected type.
 */
export type Expect<
  TypeX extends [TypeX, TypeV] extends [TypeV, TypeX] ? TypeV : TypeV & _,
  TypeV = true,
> =
  IsNever<TypeV> extends true
    ? TypeX
    : IsNever<TypeX> extends true
      ? Expect<TypeX, TypeV>
      : TypeX;
