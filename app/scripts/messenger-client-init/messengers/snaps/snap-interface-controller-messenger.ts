import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SnapInterfaceControllerMessenger } from '@metamask/snaps-controllers';
import type { AssetsControllerState } from '@metamask/assets-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  KnownCaipNamespace,
  parseCaipAssetType,
  type CaipAssetType,
} from '@metamask/utils';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../../shared/lib/environment';
import { RootMessenger } from '../../../lib/messenger';

type MultichainAssetsCompatState = {
  assetsMetadata: Record<
    CaipAssetType,
    {
      fungible: true;
      iconUrl: string;
      units: { decimals: number; symbol: string; name: string }[];
      symbol: string;
      name: string;
    }
  >;
  accountsAssets: Record<string, CaipAssetType[]>;
};

const EMPTY_MULTICHAIN_ASSETS_STATE: MultichainAssetsCompatState = {
  assetsMetadata: {},
  accountsAssets: {},
};

type CompatRootMessenger = {
  call: (actionType: string, ...args: unknown[]) => unknown;
};

/**
 * Derive the MultichainAssetsController-shaped slice snaps still expect from
 * AssetsController + AccountsController. snaps-controllers still calls
 * `MultichainAssetsController:getState` for AssetSelector defaults.
 *
 * @param messenger - Root messenger used to read Assets/Accounts state.
 * @returns Compat state with `accountsAssets` and `assetsMetadata`.
 */
function getMultichainAssetsCompatState(
  messenger: CompatRootMessenger,
): MultichainAssetsCompatState {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return EMPTY_MULTICHAIN_ASSETS_STATE;
  }

  let assetsState: AssetsControllerState;
  try {
    assetsState = messenger.call(
      'AssetsController:getState',
    ) as AssetsControllerState;
  } catch {
    return EMPTY_MULTICHAIN_ASSETS_STATE;
  }

  let accounts: InternalAccount[];
  try {
    accounts = messenger.call(
      'AccountsController:listMultichainAccounts',
    ) as InternalAccount[];
  } catch {
    return EMPTY_MULTICHAIN_ASSETS_STATE;
  }

  const internalAccountsById = Object.fromEntries(
    accounts.map((account) => [account.id, account]),
  );

  const {
    assetsBalance = {},
    customAssets = {},
    assetsInfo = {},
  } = assetsState;

  const accountsAssets: MultichainAssetsCompatState['accountsAssets'] = {};
  const allAssetIdsByAccount = Object.fromEntries(
    [
      ...new Set([...Object.keys(assetsBalance), ...Object.keys(customAssets)]),
    ].map((accountId) => {
      const fromBalance = Object.keys(assetsBalance[accountId] ?? {});
      const fromCustom = customAssets[accountId] ?? [];
      return [
        accountId,
        [...new Set([...fromBalance, ...fromCustom])] as CaipAssetType[],
      ];
    }),
  );

  for (const [accountId, assetIds] of Object.entries(allAssetIdsByAccount)) {
    const internalAccount = internalAccountsById[accountId];
    if (!internalAccount || isEvmAccountType(internalAccount.type)) {
      continue;
    }

    accountsAssets[accountId] = [];
    for (const assetId of assetIds) {
      const assetType = parseCaipAssetType(assetId);
      if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
        continue;
      }
      accountsAssets[accountId].push(assetId);
    }
  }

  const assetsMetadata: MultichainAssetsCompatState['assetsMetadata'] = {};
  for (const [assetId, metadata] of Object.entries(assetsInfo)) {
    const assetType = parseCaipAssetType(assetId as CaipAssetType);
    if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
      continue;
    }

    assetsMetadata[assetId as CaipAssetType] = {
      fungible: true,
      iconUrl: metadata.image ?? '',
      units: [
        {
          decimals: metadata.decimals,
          symbol: metadata.symbol,
          name: metadata.name,
        },
      ],
      symbol: metadata.symbol,
      name: metadata.name,
    };
  }

  return { accountsAssets, assetsMetadata };
}

/**
 * Register a MultichainAssetsController:getState shim backed by AssetsController
 * so SnapInterfaceController keeps working after MultichainAssetsController removal.
 *
 * @param messenger - The root messenger.
 */
function registerMultichainAssetsGetStateCompat(
  messenger: RootMessenger,
): void {
  const compatMessenger = new Messenger({
    namespace: 'MultichainAssetsController',
    parent: messenger,
  });
  // Namespace messenger has no built-in action types; register the compat getState.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (compatMessenger as any).registerActionHandler(
    'MultichainAssetsController:getState',
    () =>
      getMultichainAssetsCompatState(
        messenger as unknown as CompatRootMessenger,
      ),
  );
}

/**
 * Get a restricted messenger for the Snap interface controller. This is scoped
 * to the actions and events that the Snap interface controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapInterfaceControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapInterfaceControllerMessenger>,
    MessengerEvents<SnapInterfaceControllerMessenger>
  >,
) {
  registerMultichainAssetsGetStateCompat(messenger as RootMessenger);

  const controllerMessenger: SnapInterfaceControllerMessenger = new Messenger({
    namespace: 'SnapInterfaceController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'PhishingController:testOrigin',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'SnapController:getSnap',
      // Compat shim: snaps-controllers still requests MultichainAssetsController:getState.
      // Handler derives accountsAssets/assetsMetadata from AssetsController.
      'MultichainAssetsController:getState',
      'AccountsController:getSelectedMultichainAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:listMultichainAccounts',
      'PermissionController:hasPermission',
    ],
    events: ['NotificationServicesController:notificationsListUpdated'],
  });
  return controllerMessenger;
}
