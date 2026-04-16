// Type augmentation for sidePanel API (not yet in webextension-polyfill types)
export type BrowserWithSidePanel = typeof browser & {
  sidePanel?: {
    open: (options: { windowId?: number }) => Promise<void>;
    // REFERENCE: {@link https://developer.chrome.com/docs/extensions/reference/api/sidePanel#event-onClosed}
    onClosed: {
      addListener: (callback: (args: unknown) => void) => void;
      removeListener: (callback: (args: unknown) => void) => void;
    };
  };
};
