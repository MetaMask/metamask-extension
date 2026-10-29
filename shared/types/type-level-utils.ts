/**
 * General-purpose type-level utilities.
 */

/**
 * Resolves to `true` if `Tau` is `any`, otherwise `false`.
 *
 * @template Tau - The type to check.
 */
export type IsAny<Tau> = 0 extends 1 & Tau ? true : false;

/**
 * Resolves to `true` if `Tau` is `never`, otherwise `false`.
 *
 * Wraps in a tuple to prevent distributive conditional evaluation.
 * @see {@link https://gist.github.com/MajorLift/1cf2f949dbe973a6178dd7ad4bcc7612}
 * @template Tau - The type to check.
 */
export type IsNever<Tau> = [Tau] extends [never] ? true : false;

/**
 * `true` if `Tau` is a union of two or more members, `false` otherwise.
 * Uses distributive conditional types: each union member checks whether
 * the full union `Total` extends just that member.
 *
 * @template Tau - The type to check.
 * @template Total - The full union to check against.
 */
export type IsUnion<Tau, Total = Tau> = [Tau] extends [never]
  ? false
  : Tau extends Total
    ? [Total] extends [Tau]
      ? false
      : true
    : false;

/**
 * Resolves to `true` if `Tau` and `Sigma` are mutually assignable,
 * otherwise `false`.
 *
 * Guards against `any` by detecting it explicitly first
 * (the naive `[A, B] extends [B, A]` check returns true if either input is `any`).
 *
 * @template Tau - The type to check.
 * @template Sigma - The type to check against.
 */
export type IsEquivalent<Tau, Sigma> =
  IsAny<Tau> extends true
    ? IsAny<Sigma>
    : IsAny<Sigma> extends true
      ? false
      : [Tau, Sigma] extends [Sigma, Tau]
        ? true
        : false;
