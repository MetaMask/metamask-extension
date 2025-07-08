import type {
  IsEquivalent,
  ControllerStatePropertiesEnumerated,
  FlattenedBackgroundStateProxy,
} from './background';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type _ = {
  readonly _: unique symbol;
};

/**
 * The purpose of this function is to cause a compiler error to be emitted if the types are not equivalent.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type Expect<X extends IsEquivalent<X, V> extends true ? V : V & _, V = true> =
  IsEquivalent<V, never> extends true
    ? X
    : IsEquivalent<X, never> extends true
      ? Expect<X, V>
      : X;

/**
 * If this type triggers the following error
 * `Type instantiation is excessively deep and possibly infinite.ts(2589)`
 * it indicates one of the following regarding `ControllerStatePropertiesEnumerated`:
 * 1) One or more properties are missing.
 * 2) One or more properties need to be marked as optional (`?:`).
 * Superfluous properties will trigger an error in `ControllerStatePropertiesEnumerated` itself.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type Test_FlattenedBackgroundStateProxy = Expect<
  FlattenedBackgroundStateProxy,
  { isInitialized: boolean } & ControllerStatePropertiesEnumerated
>;
