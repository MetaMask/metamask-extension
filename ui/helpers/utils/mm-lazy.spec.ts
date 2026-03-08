import type React from 'react';
import type { IsEquivalent } from '../../../shared/types/type-level-utils';
import type { Expect } from '../../../shared/types/type-test-utils';
import type { AnyComponent, InferComponent } from './mm-lazy';

/**
 * Fixtures
 */

type ButtonProps = { label: string; onClick: () => void };
type ButtonComponent = React.FC<ButtonProps>;
type ModalProps = { isOpen: boolean };
type ModalComponent = React.FC<ModalProps>;

/**
 * Type-level tests for InferComponent.
 *
 * Each tuple element is a compile-time assertion via `Expect`.
 * A type error here means `InferComponent` resolved incorrectly.
 */

/**
 * Concrete (instantiated) type arguments
 */
type Describe_ConcreteTypeArguments = [
  /**
   * Default export preserves component type.
   */
  Expect<InferComponent<{ default: ButtonComponent }>, ButtonComponent>,

  /**
   * Default export preserves props
   */
  Expect<
    React.ComponentProps<InferComponent<{ default: ButtonComponent }>>,
    ButtonProps
  >,

  /**
   * Single named export extracts component
   */
  Expect<InferComponent<{ MyModal: ModalComponent }>, ModalComponent>,

  /**
   * Single named export preserves props
   */
  Expect<
    React.ComponentProps<InferComponent<{ MyModal: ModalComponent }>>,
    ModalProps
  >,

  /**
   * Default takes precedence over named
   */
  Expect<
    InferComponent<{ default: ButtonComponent; Named: ModalComponent }>,
    ButtonComponent
  >,

  /**
   * Named export extracted from mixed values
   */
  Expect<
    InferComponent<{ helper: string; Page: ButtonComponent }>,
    ButtonComponent
  >,

  /**
   * Non-component default falls back to `AnyComponent`
   */
  Expect<InferComponent<{ default: string }>, AnyComponent>,

  /**
   * Non-function exports fall back to `AnyComponent`
   */
  Expect<InferComponent<{ count: number; label: string }>, AnyComponent>,

  /**
   * Empty module falls back to `AnyComponent`
   */
  Expect<InferComponent<Record<never, never>>, AnyComponent>,
];

/**
 * Nested unwrap — module namespace double-wrapping
 */
type Describe_NestedUnwrap = [
  /**
   * Double-wrapped default resolves to component
   */
  Expect<
    InferComponent<{ default: { default: ButtonComponent } }>,
    ButtonComponent
  >,

  /**
   * Double-wrapped preserves props
   */
  Expect<
    React.ComponentProps<
      InferComponent<{ default: { default: ButtonComponent } }>
    >,
    ButtonProps
  >,

  /**
   * Double-wrapped non-component falls back
   */
  Expect<InferComponent<{ default: { default: string } }>, AnyComponent>,
];

/**
 * Non-component function exports
 *
 * `() => string` does not match `ComponentType<any>` in this project's
 * React types (FC returns `ReactElement | null`), so Extract produces
 * `never` and InferComponent falls back to AnyComponent.
 */
type Describe_NonComponentFunctionExports = [
  Expect<InferComponent<{ util: () => string }>, AnyComponent>,
];

/**
 * Strict mode (`InferComponent<Module, true>`)
 *
 * Mirrors `MMLazyLoadableComponent` (alias for `InferComponent<Module, true>`).
 * Resolves to `never` when `convertToDefaultExportModule` would throw at
 * runtime — no default export and not exactly one named export.
 */
type Describe_StrictMode = [
  /**
   * Default export passes through unchanged
   */
  Expect<InferComponent<{ default: ButtonComponent }, true>, ButtonComponent>,

  /**
   * Single named export passes through
   */
  Expect<InferComponent<{ MyModal: ModalComponent }, true>, ModalComponent>,

  /**
   * Default takes precedence even with multiple named exports.
   */
  Expect<
    IsEquivalent<
      InferComponent<
        {
          default: ButtonComponent;
          NamedA: ModalComponent;
          NamedB: ModalComponent;
        },
        true
      >,
      ButtonComponent
    >
  >,

  /**
   * Single non-component named export falls back to `AnyComponent`
   * (`IsSingleNamedExport` is `true`, `AssertComponent` handles the fallback)
   */
  Expect<InferComponent<{ helper: string }, true>, AnyComponent>,

  /**
   * Mixed named exports without default → never (runtime throws)
   */
  Expect<
    InferComponent<{ helper: string; Page: ButtonComponent }, true>,
    never
  >,

  /**
   * Multiple non-component exports without default → never
   */
  Expect<InferComponent<{ count: number; label: string }, true>, never>,

  /**
   * Empty module → never (runtime throws)
   */
  Expect<InferComponent<Record<never, never>, true>, never>,
];
