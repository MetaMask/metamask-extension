const listeners = new Set<(payload: unknown) => void>();
let lastUpdate: unknown;
let hasLastUpdate = false;

export function receiveWidgetUpdate(payload: unknown) {
  lastUpdate = payload;
  hasLastUpdate = true;
  for (const listener of listeners) {
    listener(payload);
  }
}

export function onWidgetUpdate(listener: (payload: unknown) => void) {
  listeners.add(listener);
  if (hasLastUpdate) {
    listener(lastUpdate);
  }
  return () => listeners.delete(listener);
}
