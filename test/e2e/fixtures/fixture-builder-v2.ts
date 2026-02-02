import { merge, mergeWith } from 'lodash';
import { NetworkStatus } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  FixtureData,
  E2E_SRP,
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  FIXTURE_STATE_METADATA_VERSION,
  LOCALHOST_NETWORK_CLIENT_ID,
  getOnboardingFixture,
  defaultFixture,
  buildAccountTrackerData,
  buildLocalhostNetworkConfig,
  buildNetworkEnablementControllerData,
  buildNetworkOrderControllerData,
} from './default-fixture-v2';
import type {
  AccountTrackerControllerState,
  AddressBookControllerState,
  AlertControllerState,
  AnnouncementControllerState,
  AppStateControllerState,
  AuthenticationController,
  AccountOrderControllerState,
  AccountsControllerState,
  CurrencyRateState,
  GasFeeState,
  KeyringControllerState,
  MetaMetricsControllerState,
  NameControllerState,
  NetworkState,
  NetworkEnablementControllerState,
  NetworkOrderControllerState,
  NftControllerState,
  NotificationServicesController,
  OnboardingControllerState,
  PermissionLogControllerState,
  PreferencesControllerState,
  RemoteFeatureFlagControllerState,
  SelectedNetworkControllerState,
  SmartTransactionsControllerState,
  SnapControllerState,
  SubjectMetadataControllerState,
  TokenBalancesControllerState,
  TokenListState,
  TokensControllerState,
  TransactionControllerState,
  UserStorageController,
  DeepPartial,
  Mutable,
} from './fixture-types';

/**
 * Helper to convert readonly data (from `as const`) to mutable type.
 * This is needed because defaultFixture uses `as const` for literal type preservation.
 */
function asMutable<T>(data: T): Mutable<T> {
  return data as Mutable<T>;
}

// Re-export constants for convenience
export {
  E2E_SRP,
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  FIXTURE_STATE_METADATA_VERSION,
};

/**
 * FixtureBuilderV2 - A fixture builder for the latest state schema.
 *
 * By default, this builder creates a completed onboarding state with vault,
 * account, and other necessary configurations. Use `onboarding: true` to
 * get the raw onboarding fixture without account/vault.
 *
 * All `with*` methods are type-safe and will catch invalid keys at compile time.
 */
export class FixtureBuilderV2 {
  private fixture: FixtureData;

  /**
   * Constructs a new instance of FixtureBuilderV2.
   *
   * @param options - Configuration options
   * @param options.onboarding - If true, uses raw onboarding fixture (no account/vault).
   * If false (default), applies completed onboarding state.
   * @param options.inputChainId - The chain ID for localhost network configuration.
   * Only used when onboarding is false.
   */
  constructor({
    onboarding = false,
    inputChainId = CHAIN_IDS.LOCALHOST,
  }: {
    onboarding?: boolean;
    inputChainId?: string;
  } = {}) {
    this.fixture = getOnboardingFixture();

    if (!onboarding) {
      this.#applyDefaultFixture(inputChainId);
    }
  }

  /**
   * Internal method to apply the default fixture state using withXController methods.
   *
   * @param inputChainId - The chain ID for localhost network configuration
   */
  #applyDefaultFixture(inputChainId: string) {
    // Core account/wallet controllers
    this.withOnboardingController(asMutable(defaultFixture.OnboardingController));
    this.withKeyringController(asMutable(defaultFixture.KeyringController));
    this.withAccountsController(asMutable(defaultFixture.AccountsController));
    this.withAuthenticationController(asMutable(defaultFixture.AuthenticationController));

    // User preferences and app state
    this.withPreferencesController(asMutable(defaultFixture.PreferencesController));
    this.withAppStateController(asMutable(defaultFixture.AppStateController));

    // Metrics and currency
    this.withMetaMetricsController(asMutable(defaultFixture.MetaMetricsController));
    this.withCurrencyController(asMutable(defaultFixture.CurrencyController));

    // Network configuration (chain-dependent)
    this.withAccountTracker(buildAccountTrackerData(inputChainId));
    this.withNetworkController({
      networkConfigurationsByChainId: {
        [inputChainId as Hex]: buildLocalhostNetworkConfig(inputChainId),
      },
      networksMetadata: {
        [LOCALHOST_NETWORK_CLIENT_ID]: {
          EIPS: {},
          status: NetworkStatus.Available,
        },
      },
      selectedNetworkClientId: LOCALHOST_NETWORK_CLIENT_ID,
    });
    this.withNetworkEnablementController(
      buildNetworkEnablementControllerData(inputChainId),
    );
    this.withNetworkOrderController(
      buildNetworkOrderControllerData(inputChainId),
    );

    // Transaction-related controllers
    this.withGasFeeController(asMutable(defaultFixture.GasFeeController));
    this.withTokensController(asMutable(defaultFixture.TokensController));
    this.withTransactionController(asMutable(defaultFixture.TransactionController));
    this.withSmartTransactionsController(
      asMutable(defaultFixture.SmartTransactionsController),
    );

    // Permissions and metadata
    this.withSubjectMetadataController(
      asMutable(defaultFixture.SubjectMetadataController),
    );
    this.withPermissionController(asMutable(defaultFixture.PermissionController), true);
    this.withSelectedNetworkController(
      asMutable(defaultFixture.SelectedNetworkController),
      true,
    );

    // UI state
    this.withAnnouncementController(asMutable(defaultFixture.AnnouncementController));
    this.withNotificationServicesController(
      asMutable(defaultFixture.NotificationServicesController),
    );
  }

  // ============================================================
  // Generic Controller Methods
  // ============================================================

  withAccountTracker(data: DeepPartial<AccountTrackerControllerState>) {
    this.fixture.data.AccountTracker = merge(
      this.fixture.data.AccountTracker ?? {},
      data,
    );
    return this;
  }

  withAddressBookController(data: DeepPartial<AddressBookControllerState>) {
    this.fixture.data.AddressBookController = merge(
      this.fixture.data.AddressBookController ?? {},
      data,
    );
    return this;
  }

  withAlertController(data: DeepPartial<AlertControllerState>) {
    merge(this.fixture.data.AlertController, data);
    return this;
  }

  withAnnouncementController(data: DeepPartial<AnnouncementControllerState>) {
    merge(this.fixture.data.AnnouncementController, data);
    return this;
  }

  withAppStateController(data: DeepPartial<AppStateControllerState>) {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withAuthenticationController(
    data: DeepPartial<AuthenticationController.AuthenticationControllerState>,
  ) {
    merge(this.fixture.data.AuthenticationController, data);
    return this;
  }

  withAccountOrderController(data: DeepPartial<AccountOrderControllerState>) {
    merge(this.fixture.data.AccountOrderController, data);
    return this;
  }

  withAccountsController(data: DeepPartial<AccountsControllerState>) {
    merge(this.fixture.data.AccountsController, data);
    return this;
  }

  withCurrencyController(data: DeepPartial<CurrencyRateState>) {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withGasFeeController(data: DeepPartial<GasFeeState>) {
    merge(this.fixture.data.GasFeeController, data);
    return this;
  }

  withKeyringController(data: DeepPartial<KeyringControllerState>) {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withMetaMetricsController(data: DeepPartial<MetaMetricsControllerState>) {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withNameController(data: DeepPartial<NameControllerState>) {
    merge(this.fixture.data.NameController, data);
    return this;
  }

  withNetworkController(data: DeepPartial<NetworkState>) {
    merge(this.fixture.data.NetworkController, data);
    return this;
  }

  withNetworkEnablementController(
    data: DeepPartial<NetworkEnablementControllerState>,
  ) {
    this.fixture.data.NetworkEnablementController =
      data as typeof this.fixture.data.NetworkEnablementController;
    return this;
  }

  withNetworkOrderController(data: DeepPartial<NetworkOrderControllerState>) {
    merge(this.fixture.data.NetworkOrderController, data);
    return this;
  }

  withNftController(data: DeepPartial<NftControllerState>) {
    this.fixture.data.NftController = merge(
      this.fixture.data.NftController ?? {},
      data,
    );
    return this;
  }

  withNotificationServicesController(
    data: DeepPartial<NotificationServicesController.NotificationServicesControllerState>,
  ) {
    mergeWith(
      this.fixture.data.NotificationServicesController,
      data,
      (objValue, srcValue) => {
        if (Array.isArray(objValue)) {
          return objValue.concat(srcValue);
        }
        return undefined;
      },
    );
    return this;
  }

  withOnboardingController(data: DeepPartial<OnboardingControllerState>) {
    merge(this.fixture.data.OnboardingController, data);
    return this;
  }

  // Note: PermissionControllerState is a complex generic type, using Record<string, unknown> for flexibility
  withPermissionController(data: Record<string, unknown>, replace = false) {
    if (replace) {
      this.fixture.data.PermissionController =
        data as typeof this.fixture.data.PermissionController;
    } else {
      merge(this.fixture.data.PermissionController, data);
    }
    return this;
  }

  withPermissionLogController(data: DeepPartial<PermissionLogControllerState>) {
    this.fixture.data.PermissionLogController = merge(
      this.fixture.data.PermissionLogController ?? {},
      data,
    );
    return this;
  }

  withPreferencesController(data: DeepPartial<PreferencesControllerState>) {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  withRemoteFeatureFlagController(
    data: DeepPartial<RemoteFeatureFlagControllerState>,
  ) {
    merge(this.fixture.data.RemoteFeatureFlagController, data);
    return this;
  }

  withSelectedNetworkController(
    data: DeepPartial<SelectedNetworkControllerState>,
    replace = false,
  ) {
    if (replace) {
      this.fixture.data.SelectedNetworkController =
        data as typeof this.fixture.data.SelectedNetworkController;
    } else {
      merge(this.fixture.data.SelectedNetworkController, data);
    }
    return this;
  }

  withSmartTransactionsController(
    data: DeepPartial<SmartTransactionsControllerState>,
  ) {
    (this.fixture.data as Record<string, unknown>).SmartTransactionsController =
      merge(
        (this.fixture.data as Record<string, unknown>)
          .SmartTransactionsController ?? {},
        data,
      );
    return this;
  }

  withSnapController(data: DeepPartial<SnapControllerState>) {
    merge(this.fixture.data.SnapController, data);
    return this;
  }

  withSubjectMetadataController(
    data: DeepPartial<SubjectMetadataControllerState>,
  ) {
    merge(this.fixture.data.SubjectMetadataController, data);
    return this;
  }

  withTokenBalancesController(
    data: DeepPartial<TokenBalancesControllerState>,
  ) {
    merge(this.fixture.data.TokenBalancesController, data);
    return this;
  }

  withTokenListController(data: DeepPartial<TokenListState>) {
    (this.fixture.data as Record<string, unknown>).TokenListController = merge(
      (this.fixture.data as Record<string, unknown>).TokenListController ?? {},
      data,
    );
    return this;
  }

  withTokensController(data: DeepPartial<TokensControllerState>) {
    merge(this.fixture.data.TokensController, data);
    return this;
  }

  withTransactionController(data: DeepPartial<TransactionControllerState>) {
    merge(this.fixture.data.TransactionController, data);
    return this;
  }

  withUserStorageController(
    data: DeepPartial<UserStorageController.UserStorageControllerState>,
  ) {
    merge(this.fixture.data.UserStorageController, data);
    return this;
  }

  // ============================================================
  // Build Method
  // ============================================================

  /**
   * Builds and returns the fixture object.
   * This should be called at the end of the builder chain.
   *
   * @returns The complete fixture object
   */
  build(): FixtureData {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
