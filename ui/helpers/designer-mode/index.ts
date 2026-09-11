import { DesignerModeCore } from './core';
import type { DesignerModeOptions } from './core';
import { ReactInspectorAdapter } from './react-adapter';

/**
 * Designer Mode — a dev-only visual inspector. Lets designers Ctrl+Shift+D into
 * the running extension UI, tap any component, edit its styles, and hand the
 * change to an AI agent that applies it to source. See `docs/designer-mode.md`.
 *
 * Gated behind the `DESIGNER_MODE` build flag (see `ui/index.js`); this module is
 * only imported when the flag is on, so it (and the Shadow-DOM panel) is excluded
 * from normal builds.
 *
 * The relay runs on the dev machine; the extension UI is same-machine, so the
 * default `http://localhost:3334` works without any host detection.
 * @param options
 */
export function initDesignerMode(
  options: DesignerModeOptions = {},
): () => void {
  const adapter = new ReactInspectorAdapter();
  const core = new DesignerModeCore({ ...options, adapter });
  core.mount();
  return () => core.unmount();
}
