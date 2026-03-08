/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';

type DynamicImportType = () => Promise<any>;
export type ModuleWithDefaultExport<
  Component extends React.ComponentType<any> = React.ComponentType,
> = {
  default: Component;
};

/**
 * Infers the component type from a dynamic import function.
 * If the import returns a module with a `default` export that is a ComponentType,
 * the component type (including its props) is preserved.
 */
type InferComponent<ImportFn extends DynamicImportType> =
  Awaited<ReturnType<ImportFn>> extends {
    default: infer Comp extends React.ComponentType<any>;
  }
    ? Comp
    : React.ComponentType;

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToDefaultExportModule(importedModule: any): {
  componentName: string; // TODO: in many circumstances, the componentName gets minified
  component: ModuleWithDefaultExport;
} {
  let componentName: string;

  // If there's no default export
  if (!importedModule.default) {
    const keys = Object.keys(importedModule);

    // If there's only one named export
    if (keys.length === 1) {
      componentName = keys[0];

      return {
        componentName,
        // Force the component to be the default export
        component: { default: importedModule[componentName] },
      };
    }

    // If there are multiple named exports, this isn't good for tree-shaking, so throw an error
    throw new Error(
      'mmLazy: You cannot lazy-load a component when there are multiple exported components in one file',
    );
  }

  if (importedModule.default.WrappedComponent) {
    // If there's a wrapped component, we don't want to see the name reported as `withRouter(Connect(AAA))` we want just `AAA`
    componentName = importedModule.default.WrappedComponent.name;
  } else {
    componentName =
      importedModule.default.name || importedModule.default.displayName;
  }

  return {
    componentName,
    component: importedModule,
  };
}
