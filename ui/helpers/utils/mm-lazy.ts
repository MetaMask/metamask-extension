import React from 'react';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- required due to contravariant parameter bound
type AnyComponent = React.ComponentType<any>;

/**
 * Structural type for a module with a default export.
 * This enables the output to be used with `React.lazy` which requires a default export
 * and also allows for named exports to be used as the component.
 *
 * @template Component - The component type, inferred from the module.
 */
type ModuleWithDefaultExport<Component extends AnyComponent = AnyComponent> = {
  default: Component;
};

/**
 * Structural type for extracting a component's display name,
 * including through HOC `.WrappedComponent` chains.
 */
type ComponentLike = {
  name?: string;
  displayName?: string;
  /**
   * React HOC static property.
   * Recursive but safe as only one level is ever accessed.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WrappedComponent?: ComponentLike;
};

/**
 * Resolves to `Value` only if it extends `AnyComponent` and is not `never`,
 * otherwise falls back to `AnyComponent`.
 */
type AssertComponent<Value> = [Value] extends [never]
  ? AnyComponent
  : Value extends AnyComponent
    ? Value
    : AnyComponent;

/**
 * Extracts the React component type from a dynamically imported module.
 *
 * Handles default exports, single named exports, and nested default exports caused by
 * double-wrapping that TypeScript's generic inference produces for `import()` expressions
 * (where `Module` is inferred as `{ default: <module namespace> }` rather
 * than the module namespace itself).
 *
 * @template Module - The module object type, typically inferred from `() => import('...')`.
 */
export type InferComponent<
  Module extends Record<PropertyKey, unknown> = Record<never, never>,
  /**
   * The value of `module.default`. `never` if there is no default export.
   */
  DefaultExport = Module extends { default: infer Value } ? Value : never,
  /**
   * Whether a default export is present.
   */
  IsDefaultExport = [DefaultExport] extends [never] ? false : true,
  /**
   * Unwraps one additional `default` level to handle inference of
   * double-wrapped module namespaces e.g. `connect()`, `compose()`.
   */
  NestedDefaultExport = DefaultExport extends { default: infer Value }
    ? Value
    : never,
  /**
   * Resolves the component from the default export path.
   */
  FromDefaultExport = DefaultExport extends AnyComponent
    ? DefaultExport
    : AssertComponent<NestedDefaultExport>,
  /**
   * Extracts the single component-assignable value from named exports.
   */
  FromNamedExport = AssertComponent<
    Extract<Module[keyof Module], AnyComponent>
  >,
  /**
   * The inferred component type.
   */
  InferredComponent = IsDefaultExport extends true
    ? FromDefaultExport
    : FromNamedExport,
> = InferredComponent;

// This only has to happen once per app load, so do it outside a function
const lazyLoadSubSampleRate = getManifestFlags().sentry?.lazyLoadSubSampleRate;

/**
 * A wrapper around React.lazy that adds two things:
 * 1. Sentry tracing for how long it takes to load the component (not render, just load)
 * 2. React.lazy can only deal with default exports, but the wrapper can handle named exports too
 *
 * For typed modules (`.ts`/`.tsx`), component props are fully inferred.
 * For untyped modules (`.js` without declarations), `Module` is inferred
 * as `any` and the return type degrades to `AnyComponent`. Cast the
 * result to restore type safety:
 *
 * @example
 * ```typescript
 * // Typed module — props inferred automatically
 * const MyPage = mmLazy(() => import('./MyPage'));
 *
 * // Untyped .js module — cast to narrow the return type
 * const LegacyPage = mmLazy(
 *   () => import('./LegacyPage.js'),
 * ) as React.LazyExoticComponent<React.ComponentType<Props>>;
 * ```
 * @param fn - an import of the form `() => import('AAA')`
 */
export function mmLazy<Module extends Record<PropertyKey, unknown>>(
  fn: () => Promise<Module>,
): React.LazyExoticComponent<InferComponent<Module>> {
  type Component = InferComponent<Module>;
  return React.lazy(async () => {
    // We can't start the trace here because we don't have the componentName yet, so we just hold the startTime
    const startTime = Date.now();

    const importedModule = await fn();
    const { componentName, component } =
      convertToDefaultExportModule<Component>(importedModule);

    // Only trace load time of lazy-loaded components if the manifestFlag is set, and then do it by Math.random probability
    if (lazyLoadSubSampleRate && Math.random() < lazyLoadSubSampleRate) {
      trace({
        name: TraceName.LazyLoadComponent,
        data: { componentName },
        startTime,
      });

      endTrace({ name: TraceName.LazyLoadComponent });
    }

    return component;
  });
}

/**
 * Coerces input modules into a default export module with a single named export keyed by component name.
 * This enables the output to be used with React.lazy which requires a default export.
 *
 * @param importedModule - The imported module to coerce.
 * @returns The component name and component.
 * @throws An error if the module has multiple named exports.
 */
function convertToDefaultExportModule<
  Component extends AnyComponent = AnyComponent,
>(
  importedModule: Record<PropertyKey, unknown>,
): {
  componentName: string; // TODO: in many circumstances, the componentName gets minified
  component: ModuleWithDefaultExport<Component>;
} {
  // If there's no default export
  if (!importedModule.default) {
    const keys = Object.keys(importedModule);

    // If there's only one named export
    if (keys.length === 1) {
      const componentName = keys[0];

      return {
        componentName,
        // Force the component to be the default export
        component: {
          default: importedModule[componentName] as Component,
        },
      };
    }

    // If there are multiple named exports, this isn't good for tree-shaking, so throw an error
    throw new Error(
      'mmLazy: You cannot lazy-load a component when there are multiple exported components in one file',
    );
  }

  // If there's a wrapped component, we don't want to see the name reported as `withRouter(Connect(AAA))` we want just `AAA`
  const defaultExport = importedModule.default as ComponentLike;
  const componentName =
    defaultExport.WrappedComponent?.name ||
    defaultExport.name ||
    defaultExport.displayName ||
    'Unknown';

  return {
    componentName,
    component: importedModule as ModuleWithDefaultExport<Component>,
  };
}
