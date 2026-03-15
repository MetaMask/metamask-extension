/**
 * Compile-time assertions for use in `*.spec.ts` type-level tests.
 *
 * @example
 * ```typescript
 * type _Tests = [
 *   Expect<IsEquivalent<string, string>>,
 *   Expect<IsEquivalent<Foo, Bar>, false>,
 * ];
 * ```
 */

import type { IsNever } from './type-level-utils';

/**
 * Uninhabitable branded type used by {@link Expect} to force compile errors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
type _ = {
  readonly _: unique symbol;
};

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
 *
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
