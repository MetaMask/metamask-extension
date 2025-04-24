/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const symbol: unique symbol;

/**
 * Creates a branded type of {@link T} with the brand {@link U}.
 *
 * @param T - Type to brand
 * @param U - Label
 * @returns Branded type
 * @example
 * type Result = Branded<string, 'foo'>
 * //   ^? type Result = string & { [symbol]: 'foo' }
 */
export type Branded<T, U> = T & { [symbol]: U };

/**
 * Filters out all members of {@link T} that are not {@link P}
 *
 * @param T - Items to filter
 * @param P - Type to filter out
 * @returns Filtered items
 * @example
 * type Result = Filter<['a', 'b', 'c'], 'b'>
 * //   ^? type Result = ['a', 'c']
 */
export type Filter<
  T extends readonly unknown[],
  P,
  Acc extends readonly unknown[] = [],
> = T extends readonly [infer F, ...infer Rest extends readonly unknown[]]
  ? [F] extends [P]
    ? Filter<Rest, P, [...Acc, F]>
    : Filter<Rest, P, Acc>
  : readonly [...Acc];

/**
 * @description Checks if {@link T} can be narrowed further than {@link U}
 * @param T - Type to check
 * @param U - Type to against
 * @example
 * type Result = IsNarrowable<'foo', string>
 * //   ^? true
 */
export type IsNarrowable<T, U> = IsNever<
  (T extends U ? true : false) & (U extends T ? false : true)
> extends true
  ? false
  : true;

/**
 * @description Checks if {@link T} is `never`
 * @param T - Type to check
 * @example
 * type Result = IsNever<never>
 * //   ^? type Result = true
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/** Removes `readonly` from all properties of an object. */
export type Mutable<type extends object> = {
  -readonly [key in keyof type]: type[key];
};

/**
 * @description Evaluates boolean "or" condition for {@link T} properties.
 * @param T - Type to check
 * @example
 * type Result = Or<[false, true, false]>
 * //   ^? type Result = true
 * @example
 * type Result = Or<[false, false, false]>
 * //   ^? type Result = false
 */
export type Or<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? Head extends true
    ? true
    : Or<Tail>
  : false;

/**
 * @description Checks if {@link T} is `undefined`
 * @param T - Type to check
 * @example
 * type Result = IsUndefined<undefined>
 * //   ^? type Result = true
 */
export type IsUndefined<T> = [undefined] extends [T] ? true : false;

export type MaybePromise<T> = T | Promise<T>;

/**
 * @description Makes attributes on the type T required if required is true.
 * @example
 * MaybeRequired<{ a: string, b?: number }, true>
 * => { a: string, b: number }
 *
 * MaybeRequired<{ a: string, b?: number }, false>
 * => { a: string, b?: number }
 */
export type MaybeRequired<T, required extends boolean> = required extends true
  ? ExactRequired<T>
  : T;

/**
 * @description Assigns the properties of U onto T.
 * @example
 * Assign<{ a: string, b: number }, { a: undefined, c: boolean }>
 * => { a: undefined, b: number, c: boolean }
 */
export type Assign<T, U> = Assign_<T, U> & U;
type Assign_<T, U> = {
  [K in keyof T as K extends keyof U
    ? U[K] extends void
      ? never
      : K
    : K]: K extends keyof U ? U[K] : T[K];
};

// TODO: Remove when peer dep `typescript@>=4.5` (NoInfer is native)
export type NoInfer<type> = [type][type extends any ? 0 : never];

/**
 * @description Constructs a type by excluding `undefined` from `T`.
 * @example
 * NoUndefined<string | undefined>
 * => string
 * @internal
 */
export type NoUndefined<T> = T extends undefined ? never : T;

/** Strict version of built-in Omit type */
export type Omit<type, keys extends keyof type> = Pick<
  type,
  Exclude<keyof type, keys>
>;

/**
 * @description Creates a type that is a partial of T, but with the required keys K.
 * @example
 * PartialBy<{ a: string, b: number }, 'a'>
 * => { a?: string, b: number }
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> &
  ExactPartial<Pick<T, K>>;

/**
 * @description Combines members of an intersection into a readable type.
 * @see {@link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg}
 * @example
 * Prettify<{ a: string } & { b: string } & { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/** @internal */
export type Evaluate<type> = {
  [key in keyof type]: type[key];
} & {};

/**
 * @description Creates a type that is T with the required keys K.
 * @example
 * RequiredBy<{ a?: string, b: number }, 'a'>
 * => { a: string, b: number }
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  ExactRequired<Pick<T, K>>;

/**
 * @description Returns truthy if `array` contains `value`.
 * @example
 * Some<[1, 2, 3], 2>
 * => true
 */
export type Some<
  array extends readonly unknown[],
  value,
> = array extends readonly [value, ...unknown[]]
  ? true
  : array extends readonly [unknown, ...infer rest]
  ? Some<rest, value>
  : false;

/**
 * @description Creates a type that extracts the values of T.
 * @example
 * ValueOf<{ a: string, b: number }>
 * => string | number
 * @internal
 */
export type ValueOf<T> = T[keyof T];

export type UnionToTuple<
  union,
  // /
  last = LastInUnion<union>,
> = [union] extends [never]
  ? []
  : [...UnionToTuple<Exclude<union, last>>, last];
type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer l) => 0
  ? l
  : never;
type UnionToIntersection<union> = (
  union extends unknown ? (arg: union) => 0 : never
) extends (arg: infer i) => 0
  ? i
  : never;

export type IsUnion<
  union,
  // /
  union2 = union,
> = union extends union2 ? ([union2] extends [union] ? false : true) : never;

export type MaybePartial<
  type,
  enabled extends boolean | undefined,
> = enabled extends true ? Prettify<ExactPartial<type>> : type;

export type ExactPartial<type> = {
  [key in keyof type]?: type[key] | undefined;
};

export type ExactRequired<type> = {
  [P in keyof type]-?: Exclude<type[P], undefined>;
};

export type OneOf<
  union extends object,
  fallback extends object | undefined = undefined,
  // /
  keys extends KeyofUnion<union> = KeyofUnion<union>,
> = union extends infer item
  ? Prettify<
      item & {
        [key in Exclude<keys, keyof item>]?: fallback extends object
          ? key extends keyof fallback
            ? fallback[key]
            : undefined
          : undefined;
      }
    >
  : never;
type KeyofUnion<type> = type extends type ? keyof type : never;

// /////////////////////////////////////////////////////////////////////////
// Loose types

/**
 * Loose version of {@link Omit}
 *
 * @internal
 */
export type LooseOmit<type, keys extends string> = Pick<
  type,
  Exclude<keyof type, keys>
>;

// /////////////////////////////////////////////////////////////////////////
// Union types

export type UnionEvaluate<type> = type extends object ? Prettify<type> : type;

export type UnionLooseOmit<type, keys extends string> = type extends any
  ? LooseOmit<type, keys>
  : never;

/**
 * @description Construct a type with the properties of union type T except for those in type K.
 * @example
 * type Result = UnionOmit<{ a: string, b: number } | { a: string, b: undefined, c: number }, 'a'>
 * => { b: number } | { b: undefined, c: number }
 */
export type UnionOmit<type, keys extends keyof type> = type extends any
  ? Omit<type, keys>
  : never;

/**
 * @description Construct a type with the properties of union type T except for those in type K.
 * @example
 * type Result = UnionOmit<{ a: string, b: number } | { a: string, b: undefined, c: number }, 'a'>
 * => { b: number } | { b: undefined, c: number }
 */
export type UnionPick<type, keys extends keyof type> = type extends any
  ? Pick<type, keys>
  : never;

/**
 * @description Creates a type that is a partial of T, but with the required keys K.
 * @example
 * PartialBy<{ a: string, b: number } | { a: string, b: undefined, c: number }, 'a'>
 * => { a?: string, b: number } | { a?: string, b: undefined, c: number }
 */
export type UnionPartialBy<T, K extends keyof T> = T extends any
  ? PartialBy<T, K>
  : never;

/**
 * @description Creates a type that is T with the required keys K.
 * @example
 * RequiredBy<{ a?: string, b: number } | { a?: string, c?: number }, 'a'>
 * => { a: string, b: number } | { a: string, c?: number }
 */
export type UnionRequiredBy<T, K extends keyof T> = T extends any
  ? RequiredBy<T, K>
  : never;
