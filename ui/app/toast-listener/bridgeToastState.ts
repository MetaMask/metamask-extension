const inFlightBridgeToastIds = new Set<string>();

// Bridge pending toasts can start from different sources, so we track them in one shared registry.
export function trackBridgeToast(toastId: string) {
  inFlightBridgeToastIds.add(toastId);
}

// Bridge history removes the toast from the shared registry once it reaches a terminal state.
export function untrackBridgeToast(toastId: string) {
  inFlightBridgeToastIds.delete(toastId);
}

// Bridge resolvers use this to avoid updating historical bridge rows that never started a toast.
export function isBridgeToastTracked(toastId: string) {
  return inFlightBridgeToastIds.has(toastId);
}
