/**
 * Controller state types for fixture validation.
 *
 * These types are re-exported from their source packages to provide
 * compile-time validation for fixture builder methods. When a controller's
 * state shape changes, TypeScript will catch invalid keys at build time.
 */

// External package types
export type {
  CurrencyRateState,
  TokenListState,
  TokensControllerState,
  TokenBalancesControllerState,
  NftControllerState,
  AccountTrackerControllerState,
} from '@metamask/assets-controllers';
export type { KeyringControllerState } from '@metamask/keyring-controller';
export type { AddressBookControllerState } from '@metamask/address-book-controller';
export type { AnnouncementControllerState } from '@metamask/announcement-controller';
export type { NetworkState } from '@metamask/network-controller';
export type { GasFeeState } from '@metamask/gas-fee-controller';
export type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
export type {
  PermissionControllerState,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
export type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
export type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
export type { PermissionLogControllerState } from '@metamask/permission-log-controller';
export type { SnapControllerState } from '@metamask/snaps-controllers';
export type { AccountsControllerState } from '@metamask/accounts-controller';
export type { NameControllerState } from '@metamask/name-controller';
export type { TransactionControllerState } from '@metamask/transaction-controller';
export type {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
export type { NotificationServicesController } from '@metamask/notification-services-controller';
export type { SmartTransactionsControllerState } from '@metamask/smart-transactions-controller';

// Local controller types
export type { NetworkOrderControllerState } from '../../../app/scripts/controllers/network-order';
export type { AccountOrderControllerState } from '../../../app/scripts/controllers/account-order';
export type { PreferencesControllerState } from '../../../app/scripts/controllers/preferences-controller';
export type { AppStateControllerState } from '../../../app/scripts/controllers/app-state-controller';
export type { AlertControllerState } from '../../../app/scripts/controllers/alert-controller';
export type { OnboardingControllerState } from '../../../app/scripts/controllers/onboarding';
export type { MetaMetricsControllerState } from '../../../app/scripts/controllers/metametrics-controller';

/**
 * DeepPartial utility type for deeply nested partial updates.
 * Use this when you need to update nested properties without providing the full object.
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * FixturePartial utility type for fixture data.
 * This type validates that top-level keys exist in the controller state type,
 * but accepts any values (including placeholder strings like "__FIXTURE_SUBSTITUTION__").
 *
 * Use this for fixture builder methods where data may not match exact controller types.
 */
export type FixturePartial<T> = {
  [K in keyof T]?: unknown;
};
