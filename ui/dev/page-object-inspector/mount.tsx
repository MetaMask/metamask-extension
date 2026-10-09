import React from 'react';
import { createRoot } from 'react-dom/client';
import { PageObjectInspector } from './inspector';
import runtimeIndex from './runtime-index.json';
import { INSPECTOR_ROOT_ATTRIBUTE, type PageObjectIndex } from './types';

const CONTAINER_ID = 'page-object-inspector-root';

/**
 * Mounts the page-object inspector into its own React root, separate from the
 * wallet's, so that inspecting the UI cannot re-render or otherwise disturb
 * the application being inspected.
 *
 * Everything reachable from here, including the generated index, is loaded
 * only through the dynamic import in `ui/index.js`, which keeps it in a chunk
 * webpack drops from builds where the inspector is off.
 */
export function mountPageObjectInspector(): void {
  if (document.getElementById(CONTAINER_ID)) {
    return;
  }

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.setAttribute(INSPECTOR_ROOT_ATTRIBUTE, '');
  document.body.appendChild(container);

  // TypeScript widens the literal kinds in an imported JSON file to `string`.
  // The generator writes the file from the same shape, so the cast restores
  // the type rather than asserting anything new.
  const index = runtimeIndex as unknown as PageObjectIndex;

  createRoot(container).render(<PageObjectInspector index={index} />);
}
