/**
 * snap-management
 *
 * Snap keyring access, snap request routing, state management, and
 * snap-related preference queries.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence:
 *   - getSnapKeyring  (Engine.ts L1041: same SnapController.getKeyringForType pattern)
 *   - getSnapPreferences  (Engine.ts L1016: same fields subset)
 */

/**
 * Subset of the Messenger interface required by snap-management.
 * Structural — satisfied by extension RootMessenger, mobile EngineMessenger,
 * or any test double providing these call overloads.
 *
 * Promotion path: replace with RestrictedMessenger from @metamask/base-controller
 * when extracting to a published package.
 */
type SnapManagementMessenger = {
  call(
    action: 'SnapController:getKeyringForType',
    keyringType: string,
  ): Promise<unknown>;
  call(action: 'PreferencesController:getState'): {
    currentLocale: string;
    currentCurrency: string;
    useTokenDetection: boolean;
    [key: string]: unknown;
  };
  call(
    action: 'SnapController:handleRequest',
    args: {
      snapId: string;
      origin: string;
      handler: string;
      request: { method: string; params?: unknown };
    },
  ): Promise<unknown>;
  call(
    action: 'SnapController:getSnapState',
    snapId: string,
    encrypted: boolean,
  ): Promise<unknown>;
  call(
    action: 'SnapController:updateSnapState',
    snapId: string,
    newState: Record<string, unknown>,
    encrypted: boolean,
  ): Promise<void>;
  call(
    action: 'TokensController:watchAsset',
    args: { asset: unknown; type: string; networkClientId?: string },
  ): Promise<void>;
  call(
    action: 'NftController:watchNft',
    asset: unknown,
    type: string,
    origin: string,
    networkClientId?: string,
  ): Promise<void>;
  registerActionHandler(
    name: string,
    handler: (...args: unknown[]) => unknown,
  ): void;
};

export type SnapManagementDependencies = {
  messenger: SnapManagementMessenger;
};

/**
 * Returns the snap keyring instance, initializing it if necessary.
 * Required before any snap-keyring account operations.
 *
 * Extracted from MetamaskController.getSnapKeyring.
 * Same pattern as mobile Engine.ts L1041.
 *
 * TODO: Requires messenger action: SnapController:getKeyringForType
 */
export async function getSnapKeyring(
  deps: SnapManagementDependencies,
): Promise<unknown> {
  return deps.messenger.call(
    'SnapController:getKeyringForType',
    'Snap Account',
  );
}

/**
 * Returns the snap-relevant subset of user preferences.
 * Used by snap-keyring to deliver locale and currency context to snaps.
 *
 * Extracted from MetamaskController snap preferences helper.
 * Same fields as mobile Engine.ts L1016.
 *
 * TODO: Requires messenger action: PreferencesController:getState
 */
export function getSnapPreferences(deps: SnapManagementDependencies): {
  locale: string;
  currency: string;
  useTokenDetection: boolean;
} {
  const state = deps.messenger.call('PreferencesController:getState');
  return {
    locale: state.currentLocale,
    currency: state.currentCurrency,
    useTokenDetection: state.useTokenDetection,
  };
}

/**
 * Routes a JSON-RPC request to a snap for execution.
 * Direct passthrough to SnapController:handleRequest.
 *
 * Extracted from MetamaskController.handleSnapRequest.
 *
 * TODO: Requires messenger action: SnapController:handleRequest
 */
export async function handleSnapRequest(
  deps: SnapManagementDependencies,
  args: {
    snapId: string;
    origin: string;
    handler: string;
    request: { method: string; params?: unknown };
  },
): Promise<unknown> {
  return deps.messenger.call('SnapController:handleRequest', args);
}

/**
 * Returns isolated state for a snap.
 * Used by snaps to persist data across sessions.
 *
 * Extracted from MetamaskController getApi() inline at L7003–7005.
 *
 * TODO: Requires messenger action: SnapController:getSnapState
 */
export async function getSnapState(
  deps: SnapManagementDependencies,
  snapId: string,
  encrypted: boolean,
): Promise<unknown> {
  return deps.messenger.call('SnapController:getSnapState', snapId, encrypted);
}

/**
 * Persists isolated state for a snap.
 *
 * Extracted from MetamaskController getApi() inline at L7008–7010.
 *
 * TODO: Requires messenger action: SnapController:updateSnapState
 */
export async function updateSnapState(
  deps: SnapManagementDependencies,
  snapId: string,
  newState: Record<string, unknown>,
  encrypted: boolean,
): Promise<void> {
  await deps.messenger.call(
    'SnapController:updateSnapState',
    snapId,
    newState,
    encrypted,
  );
}

/**
 * Routes a watch-asset request to the appropriate token controller based on type.
 * ERC-20 → TokensController; ERC-721/ERC-1155 → NftController.
 *
 * Extracted from MetamaskController.handleWatchAssetRequest.
 *
 * TODO: Requires messenger actions:
 *   - TokensController:watchAsset
 *   - NftController:watchNft
 */
export async function handleWatchAssetRequest(
  deps: SnapManagementDependencies,
  args: {
    asset: unknown;
    type: string;
    origin: string;
    networkClientId?: string;
  },
): Promise<void> {
  const { asset, type, origin, networkClientId } = args;
  switch (type) {
    case 'ERC20':
      await deps.messenger.call('TokensController:watchAsset', {
        asset,
        type,
        networkClientId,
      });
      break;
    case 'ERC721':
    case 'ERC1155':
      await deps.messenger.call(
        'NftController:watchNft',
        asset,
        type,
        origin,
        networkClientId,
      );
      break;
    default:
      throw new Error(`Asset type ${type} not supported`);
  }
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for snap-management messenger actions. */
export const SNAP_MANAGEMENT_ACTIONS = {
  getSnapKeyring: 'SnapManagement:getSnapKeyring',
  getSnapPreferences: 'SnapManagement:getSnapPreferences',
  handleSnapRequest: 'SnapManagement:handleSnapRequest',
  getSnapState: 'SnapManagement:getSnapState',
  updateSnapState: 'SnapManagement:updateSnapState',
  handleWatchAssetRequest: 'SnapManagement:handleWatchAssetRequest',
} as const;

/**
 * Registers all snap-management functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: SnapManagementMessenger): void {
  const deps: SnapManagementDependencies = { messenger };
  messenger.registerActionHandler(SNAP_MANAGEMENT_ACTIONS.getSnapKeyring, () =>
    getSnapKeyring(deps),
  );
  messenger.registerActionHandler(
    SNAP_MANAGEMENT_ACTIONS.getSnapPreferences,
    () => getSnapPreferences(deps),
  );
  messenger.registerActionHandler(
    SNAP_MANAGEMENT_ACTIONS.handleSnapRequest,
    (args: {
      snapId: string;
      origin: string;
      handler: string;
      request: { method: string; params?: unknown };
    }) => handleSnapRequest(deps, args),
  );
  messenger.registerActionHandler(
    SNAP_MANAGEMENT_ACTIONS.getSnapState,
    (snapId: string, encrypted: boolean) =>
      getSnapState(deps, snapId, encrypted),
  );
  messenger.registerActionHandler(
    SNAP_MANAGEMENT_ACTIONS.updateSnapState,
    (snapId: string, newState: Record<string, unknown>, encrypted: boolean) =>
      updateSnapState(deps, snapId, newState, encrypted),
  );
  messenger.registerActionHandler(
    SNAP_MANAGEMENT_ACTIONS.handleWatchAssetRequest,
    (args: {
      asset: unknown;
      type: string;
      origin: string;
      networkClientId?: string;
    }) => handleWatchAssetRequest(deps, args),
  );
}
