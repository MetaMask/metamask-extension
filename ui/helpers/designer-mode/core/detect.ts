import type { Framework, InspectorAdapter } from './types';
import { buildFallbackInfo } from './utils';

export function createAdapter(framework: Framework): InspectorAdapter {
  // Lazy import to avoid bundling all adapters
  // In practice, the user imports the specific adapter they need
  // This is used for auto-detection in the extension / auto-init
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
