/**
 * UI-side Perps Controller Access
 *
 * Phase 2: The UI no longer instantiates a PerpsController.
 * All streaming data arrives via perpsStreamUpdate background notifications
 * routed through PerpsStreamManager.handleBackgroundUpdate().
 *
 * The facade returned here delegates all method calls to the background
 * controller via submitRequestToBackground. There is no UI-side WebSocket.
 *
 * State reads should use Redux selectors from ui/selectors/perps-controller.ts.
 */

import { createPerpsControllerFacade } from './createPerpsControllerFacade';
import type { PerpsController } from '@metamask/perps-controller';

export class PerpsControllerInitializationCancelledError extends Error {
  constructor() {
    super('Perps controller initialization was superseded');
    this.name = 'PerpsControllerInitializationCancelledError';
  }
}

export function isPerpsControllerInitializationCancelledError(
  error: unknown,
): error is PerpsControllerInitializationCancelledError {
  return (
    error instanceof PerpsControllerInitializationCancelledError ||
    (error instanceof Error &&
      error.name === 'PerpsControllerInitializationCancelledError')
  );
}

export function getFallbackBlockedRegions(): string[] {
  const raw = process.env.MM_PERPS_BLOCKED_REGIONS;
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  return raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

// Track current address and initialization state without a real controller
let currentAddress: string | null = null;
let initializedAddress: string | null = null;

/** Cached facade — there is no underlying controller; all calls go to background. */
let cachedFacade: PerpsController | null = null;

function getOrCreateFacade(): PerpsController {
  if (cachedFacade !== null) {
    return cachedFacade;
  }
  // The facade has no streaming controller — it only delegates to background
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cachedFacade = createPerpsControllerFacade(null as any);
  return cachedFacade;
}

/**
 * Mark the controller as initialized for the given address.
 * Called by PerpsStreamManager.init() after the address is confirmed.
 */
export function markPerpsControllerInitialized(address: string): void {
  currentAddress = address;
  initializedAddress = address;
}

/**
 * Get the PerpsController facade for the UI.
 * All methods delegate to the background controller via submitRequestToBackground.
 * No UI-side WebSocket is created.
 *
 * @param selectedAddress - The currently selected account address
 * @returns The PerpsController facade
 */
export async function getPerpsStreamingController(
  selectedAddress: string,
): Promise<PerpsController> {
  if (!selectedAddress) {
    throw new Error(
      'No account selected. Please select an account before using Perps.',
    );
  }

  if (currentAddress !== null && currentAddress !== selectedAddress) {
    // Address changed — clear cached address; PerpsStreamManager handles cache clearing
    currentAddress = null;
    initializedAddress = null;
  }

  currentAddress = selectedAddress;
  return getOrCreateFacade();
}

/**
 * @deprecated Use getPerpsStreamingController. The returned controller is a
 * facade: use it for mutations (e.g. controller.placeOrder).
 */
export const getPerpsController = getPerpsStreamingController;

export async function resetPerpsController(): Promise<void> {
  currentAddress = null;
  initializedAddress = null;
  cachedFacade = null;
}

export function getPerpsControllerCurrentAddress(): string | null {
  return currentAddress;
}

export function isPerpsControllerInitialized(address?: string): boolean {
  if (address) {
    return initializedAddress === address;
  }
  return initializedAddress !== null;
}

export function getPerpsControllerInstance(): PerpsController | null {
  // No real controller instance in Phase 2 — return facade if initialized
  if (initializedAddress === null) {
    return null;
  }
  return getOrCreateFacade();
}

/**
 * Get the PerpsController facade when the controller is already initialized.
 * Used by the provider to seed context on re-navigation (sync path).
 */
export function getPerpsControllerFacade(): PerpsController | null {
  if (initializedAddress === null) {
    return null;
  }
  return getOrCreateFacade();
}

export type { PerpsControllerState } from '@metamask/perps-controller';
