import React from 'react';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- required due to contravariant parameter bound
type AnyComponent = React.ComponentType<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicImportType = () => Promise<any>;
export type ModuleWithDefaultExport<
  Component extends AnyComponent = AnyComponent,
> = {
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
 * Infers the component type from a dynamic import function.
 * If the import returns a module with a `default` export that is a ComponentType,
 * the component type (including its props) is preserved.
 */
type InferComponent<ImportFn extends DynamicImportType> =
  Awaited<ReturnType<ImportFn>> extends {
    default: infer Comp extends AnyComponent;
  }
    ? Comp
    : AnyComponent;

// This only has to happen once per app load, so do it outside a function
const lazyLoadSubSampleRate = getManifestFlags().sentry?.lazyLoadSubSampleRate;

/**
 * A wrapper around React.lazy that adds two things:
 * 1. Sentry tracing for how long it takes to load the component (not render, just load)
 * 2. React.lazy can only deal with default exports, but the wrapper can handle named exports too
 *
 * @param fn - an import of the form `() => import('AAA')`
 */
export function mmLazy<ImportFn extends DynamicImportType>(
  fn: ImportFn,
): React.LazyExoticComponent<InferComponent<ImportFn>> {
  type Component = InferComponent<ImportFn>;
  return React.lazy(async () => {
    // We can't start the trace here because we don't have the componentName yet, so we just hold the startTime
    const startTime = Date.now();

    const importedModule = await fn();
    const { componentName, component } =
      convertToDefaultExportModule(importedModule);

    // Only trace load time of lazy-loaded components if the manifestFlag is set, and then do it by Math.random probability
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

/**
 * Coerces input modules into a default export module with a single named export keyed by component name.
 * This enables the output to be used with React.lazy which requires a default export.
 *
 * @param importedModule - The imported module to coerce.
 * @returns The component name and component.
 * @throws An error if the module has multiple named exports.
 */
function convertToDefaultExportModule(
  importedModule: Record<PropertyKey, unknown>,
): {
  componentName: string; // TODO: in many circumstances, the componentName gets minified
  component: ModuleWithDefaultExport;
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
          default: importedModule[componentName],
        } as ModuleWithDefaultExport,
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
    component: importedModule as ModuleWithDefaultExport,
  };
}
