// Type augmentation for sidePanel API (not yet in webextension-polyfill types)
export type BrowserWithSidePanel = typeof browser & {
  sidePanel?: {
    open: (options: { windowId?: number }) => Promise<void>;
  };
};
