/**
 * The two views of the inspector. They are independent: outlining every owned
 * element and pointing at one to read its details are useful together.
 */
export type InspectorSettings = {
  hover: boolean;
  outline: boolean;
};

const STORAGE_KEY = 'metamask:page-object-inspector';
const CHANGE_EVENT = 'metamask:page-object-inspector-change';

const ALL_OFF: InspectorSettings = { hover: false, outline: false };

/**
 * Reads the inspector settings.
 *
 * They are kept in `localStorage` rather than in the wallet's own state so
 * that a developer-only tool needs no controller, no preference and no state
 * migration.
 *
 * @returns The stored settings, with anything missing or malformed off.
 */
export function readInspectorSettings(): InspectorSettings {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    return ALL_OFF;
  }

  if (!stored) {
    return ALL_OFF;
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      hover: parsed?.hover === true,
      outline: parsed?.outline === true,
    };
  } catch {
    return ALL_OFF;
  }
}

/**
 * Stores the inspector settings and tells the overlay about them.
 *
 * @param settings - The settings to apply.
 */
export function writeInspectorSettings(settings: InspectorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistence is a convenience; the event below still drives the overlay.
  }

  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: settings }));
}

/**
 * Subscribes to settings changes.
 *
 * A custom event is used because the settings page and the overlay render in
 * separate React roots, and a `storage` event does not fire in the document
 * that performed the write.
 *
 * @param listener - Called with the new settings.
 * @returns A function that removes the subscription.
 */
export function subscribeToInspectorSettings(
  listener: (settings: InspectorSettings) => void,
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<InspectorSettings>).detail);
  };

  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
