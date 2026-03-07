import type React from 'react';
import type { InferComponent } from './mm-lazy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- contravariant parameter bound
type AnyComponent = React.ComponentType<any>;

/**
 * Test helpers
 */

type IsEquivalent<TypeA, TypeB> = [TypeA, TypeB] extends [TypeB, TypeA]
  ? true
  : false;

// eslint-disable-next-line @typescript-eslint/naming-convention
type _ = {
  readonly _: unique symbol;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
type Expect<
  TypeX extends IsEquivalent<TypeX, TypeV> extends true ? TypeV : TypeV & _,
  TypeV = true,
> = IsEquivalent<TypeV, never> extends true
  ? TypeX
  : IsEquivalent<TypeX, never> extends true
    ? Expect<TypeX, TypeV>
    : TypeX;

/**
 * Fixtures
 */

type ButtonProps = { label: string; onClick: () => void };
type ButtonComponent = React.FC<ButtonProps>;
type ModalProps = { isOpen: boolean };
type ModalComponent = React.FC<ModalProps>;

/**
 * Section 1: Concrete (instantiated) type arguments
 *
 * With a concrete Module type, InferComponent resolves to the specific
 * component type and preserves props through ComponentProps.
 */

export type Test_DefaultExportPreservesComponentType = Expect<
  InferComponent<{ default: ButtonComponent }>,
  ButtonComponent
>;

export type Test_DefaultExportPreservesProps = Expect<
  React.ComponentProps<InferComponent<{ default: ButtonComponent }>>,
  ButtonProps
>;

export type Test_SingleNamedExportExtractsComponent = Expect<
  InferComponent<{ MyModal: ModalComponent }>,
  ModalComponent
>;

export type Test_SingleNamedExportPreservesProps = Expect<
  React.ComponentProps<InferComponent<{ MyModal: ModalComponent }>>,
  ModalProps
>;

export type Test_DefaultTakesPrecedenceOverNamed = Expect<
  InferComponent<{ default: ButtonComponent; Other: ModalComponent }>,
  ButtonComponent
>;

export type Test_NamedExportExtractedFromMixedValues = Expect<
  InferComponent<{ helper: string; Page: ButtonComponent }>,
  ButtonComponent
>;

export type Test_NonComponentDefaultFallsBackToAnyComponent = Expect<
  InferComponent<{ default: string }>,
  AnyComponent
>;

export type Test_NonFunctionExportsFallBackToAnyComponent = Expect<
  InferComponent<{ count: number; label: string }>,
  AnyComponent
>;

export type Test_EmptyModuleFallsBackToAnyComponent = Expect<
  InferComponent<Record<never, never>>,
  AnyComponent
>;

/**
 * Section 2: Nested unwrap — module namespace double-wrapping
 *
 * TypeScript infers `Module` from `() => import('...')` as
 * `{ default: <module namespace> }` rather than the module namespace
 * itself. When `default` is not directly a component but is itself a
 * module namespace with its own `default` export, InferComponent
 * unwraps one additional level to reach the component.
 */

export type Test_DoubleWrappedDefaultResolvesToComponent = Expect<
  InferComponent<{ default: { default: ButtonComponent } }>,
  ButtonComponent
>;

export type Test_DoubleWrappedPreservesProps = Expect<
  React.ComponentProps<
    InferComponent<{ default: { default: ButtonComponent } }>
  >,
  ButtonProps
>;

export type Test_DoubleWrappedNonComponentFallsBack = Expect<
  InferComponent<{ default: { default: string } }>,
  AnyComponent
>;

/**
 * Section 3: Non-component function exports
 *
 * Whether `() => string` matches `ComponentType<any>` depends on the
 * React type definitions in use. With definitions where FC returns
 * `ReactElement | null`, `() => string` does NOT match, so Extract
 * produces `never` and InferComponent falls back to AnyComponent.
 */

export type Test_NonComponentFunctionFallsBackToAnyComponent = Expect<
  InferComponent<{ util: () => string }>,
  AnyComponent
>;
