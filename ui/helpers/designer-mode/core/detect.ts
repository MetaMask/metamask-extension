import type { InspectorAdapter } from './types';
import { buildFallbackInfo } from './utils';

/**
 * DOM-only fallback adapter, used by `DesignerModeCore.autoInit` when no
 * framework-specific adapter is wired up. The extension entry point
 * (`initDesignerMode`) uses `ReactInspectorAdapter` directly instead.
 */
export function createAdapter(): InspectorAdapter {
  return {
    getComponentInfo(el: HTMLElement) {
      return buildFallbackInfo(el);
    },
    onActivate() {
      // No activation work needed for the fallback adapter.
    },
    onDeactivate() {
      // No teardown needed for the fallback adapter.
    },
  };
}

export { detectFramework } from './utils';
