import React from 'react';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- contravariant parameter bound
type AnyComponent = React.ComponentType<any>;

type ModuleWithDefaultExport<Component extends AnyComponent = AnyComponent> = {
  default: Component;
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
 * Handles default exports, single named exports, and the double-wrapping
 * that TypeScript's generic inference produces for `import()` expressions
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
   * double-wrapped module namespaces e.g. `connect()`, `compose()`, etc.
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

type ComponentLike = {
  name?: string;
  displayName?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- mirrors React HOC static property
  WrappedComponent?: ComponentLike; // recursive, but only one level deep is accessed
};

const lazyLoadSubSampleRate = getManifestFlags().sentry?.lazyLoadSubSampleRate;

/**
 * A wrapper around React.lazy that adds two things:
 * 1. Sentry tracing for how long it takes to load the component (not render, just load)
 * 2. React.lazy can only deal with default exports, but the wrapper can handle named exports too
 *
 * @param fn - an import of the form `() => import('AAA')`
 */
export function mmLazy<Module extends Record<PropertyKey, unknown>>(
  fn: () => Promise<Module>,
): React.LazyExoticComponent<InferComponent<Module>> {
  type Component = InferComponent<Module>;
  return React.lazy(async () => {
    const startTime = Date.now();

    const importedModule = await fn();
    const { componentName, component } = parseImportedComponent(importedModule);

    if (lazyLoadSubSampleRate && Math.random() < lazyLoadSubSampleRate) {
      trace({
        name: TraceName.LazyLoadComponent,
        data: { componentName },
        startTime,
      });

      endTrace({ name: TraceName.LazyLoadComponent });
    }

    return component as ModuleWithDefaultExport<Component>;
  });
}

function parseImportedComponent(importedModule: Record<PropertyKey, unknown>): {
  componentName: string;
  component: ModuleWithDefaultExport;
} {
  if (!importedModule.default) {
    const keys = Object.keys(importedModule);

    if (keys.length === 1) {
      const componentName = keys[0];

      return {
        componentName,
        component: {
          default: importedModule[componentName],
        } as ModuleWithDefaultExport,
      };
    }

    throw new Error(
      'mmLazy: You cannot lazy-load a component when there are multiple exported components in one file',
    );
  }

  const defaultExport = importedModule.default as ComponentLike;
  const componentName =
    defaultExport.WrappedComponent?.name ||
    defaultExport.name ||
    defaultExport.displayName ||
    'Unknown';

  return {
    componentName,
    component: importedModule as ModuleWithDefaultExport,
  };
}
