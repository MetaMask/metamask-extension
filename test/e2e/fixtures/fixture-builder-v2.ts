import { merge, mergeWith } from 'lodash';
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
  FixturePartial,
} from './fixture-types';

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
    this.withOnboardingController(defaultFixture.OnboardingController);
    this.withKeyringController(defaultFixture.KeyringController);
    this.withAccountsController(defaultFixture.AccountsController);
    this.withAuthenticationController(defaultFixture.AuthenticationController);

    // User preferences and app state
    this.withPreferencesController(defaultFixture.PreferencesController);
    this.withAppStateController(defaultFixture.AppStateController);

    // Metrics and currency
    this.withMetaMetricsController(defaultFixture.MetaMetricsController);
    this.withCurrencyController(defaultFixture.CurrencyController);

    // Network configuration (chain-dependent)
    this.withAccountTracker(buildAccountTrackerData(inputChainId));
    this.withNetworkController({
      networkConfigurationsByChainId: {
        [inputChainId]: buildLocalhostNetworkConfig(inputChainId),
      },
      networksMetadata: {
        [LOCALHOST_NETWORK_CLIENT_ID]: {
          EIPS: {},
          status: 'available',
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
    this.withGasFeeController(defaultFixture.GasFeeController);
    this.withTokensController(defaultFixture.TokensController);
    this.withTransactionController(defaultFixture.TransactionController);
    this.withSmartTransactionsController(
      defaultFixture.SmartTransactionsController,
    );

    // Permissions and metadata
    this.withSubjectMetadataController(
      defaultFixture.SubjectMetadataController,
    );
    this.withPermissionController(defaultFixture.PermissionController, true);
    this.withSelectedNetworkController(
      defaultFixture.SelectedNetworkController,
      true,
    );

    // UI state
    this.withAnnouncementController(defaultFixture.AnnouncementController);
    this.withNotificationServicesController(
      defaultFixture.NotificationServicesController,
    );
  }

  // ============================================================
  // Generic Controller Methods
  // ============================================================

  withAccountTracker(data: FixturePartial<AccountTrackerControllerState>) {
    this.fixture.data.AccountTracker = merge(
      this.fixture.data.AccountTracker ?? {},
      data,
    );
    return this;
  }

  withAddressBookController(data: FixturePartial<AddressBookControllerState>) {
    this.fixture.data.AddressBookController = merge(
      this.fixture.data.AddressBookController ?? {},
      data,
    );
    return this;
  }

  withAlertController(data: FixturePartial<AlertControllerState>) {
    merge(this.fixture.data.AlertController, data);
    return this;
  }

  withAnnouncementController(data: FixturePartial<AnnouncementControllerState>) {
    merge(this.fixture.data.AnnouncementController, data);
    return this;
  }

  withAppStateController(data: FixturePartial<AppStateControllerState>) {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withAuthenticationController(
    data: FixturePartial<AuthenticationController.AuthenticationControllerState>,
  ) {
    merge(this.fixture.data.AuthenticationController, data);
    return this;
  }

  withAccountOrderController(data: FixturePartial<AccountOrderControllerState>) {
    merge(this.fixture.data.AccountOrderController, data);
    return this;
  }

  withAccountsController(data: FixturePartial<AccountsControllerState>) {
    merge(this.fixture.data.AccountsController, data);
    return this;
  }

  withCurrencyController(data: FixturePartial<CurrencyRateState>) {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withGasFeeController(data: FixturePartial<GasFeeState>) {
    merge(this.fixture.data.GasFeeController, data);
    return this;
  }

  withKeyringController(data: FixturePartial<KeyringControllerState>) {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withMetaMetricsController(data: FixturePartial<MetaMetricsControllerState>) {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withNameController(data: FixturePartial<NameControllerState>) {
    merge(this.fixture.data.NameController, data);
    return this;
  }

  withNetworkController(data: FixturePartial<NetworkState>) {
    merge(this.fixture.data.NetworkController, data);
    return this;
  }

  withNetworkEnablementController(
    data: FixturePartial<NetworkEnablementControllerState>,
  ) {
    this.fixture.data.NetworkEnablementController =
      data as typeof this.fixture.data.NetworkEnablementController;
    return this;
  }

  withNetworkOrderController(data: FixturePartial<NetworkOrderControllerState>) {
    merge(this.fixture.data.NetworkOrderController, data);
    return this;
  }

  withNftController(data: FixturePartial<NftControllerState>) {
    this.fixture.data.NftController = merge(
      this.fixture.data.NftController ?? {},
      data,
    );
    return this;
  }

  withNotificationServicesController(
    data: FixturePartial<NotificationServicesController.NotificationServicesControllerState>,
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

  withOnboardingController(data: FixturePartial<OnboardingControllerState>) {
    merge(this.fixture.data.OnboardingController, data);
    return this;
  }

  withPermissionController(
    data: FixturePartial<Record<string, unknown>>,
    replace = false,
  ) {
    if (replace) {
      this.fixture.data.PermissionController =
        data as typeof this.fixture.data.PermissionController;
    } else {
      merge(this.fixture.data.PermissionController, data);
    }
    return this;
  }

  withPermissionLogController(data: FixturePartial<PermissionLogControllerState>) {
    this.fixture.data.PermissionLogController = merge(
      this.fixture.data.PermissionLogController ?? {},
      data,
    );
    return this;
  }

  withPreferencesController(data: FixturePartial<PreferencesControllerState>) {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  withRemoteFeatureFlagController(
    data: FixturePartial<RemoteFeatureFlagControllerState>,
  ) {
    merge(this.fixture.data.RemoteFeatureFlagController, data);
    return this;
  }

  withSelectedNetworkController(
    data: FixturePartial<SelectedNetworkControllerState>,
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
    data: FixturePartial<SmartTransactionsControllerState>,
  ) {
    (this.fixture.data as Record<string, unknown>).SmartTransactionsController =
      merge(
        (this.fixture.data as Record<string, unknown>)
          .SmartTransactionsController ?? {},
        data,
      );
    return this;
  }

  withSnapController(data: FixturePartial<SnapControllerState>) {
    merge(this.fixture.data.SnapController, data);
    return this;
  }

  withSubjectMetadataController(
    data: FixturePartial<SubjectMetadataControllerState>,
  ) {
    merge(this.fixture.data.SubjectMetadataController, data);
    return this;
  }

  withTokenBalancesController(
    data: FixturePartial<TokenBalancesControllerState>,
  ) {
    merge(this.fixture.data.TokenBalancesController, data);
    return this;
  }

  withTokenListController(data: FixturePartial<TokenListState>) {
    (this.fixture.data as Record<string, unknown>).TokenListController = merge(
      (this.fixture.data as Record<string, unknown>).TokenListController ?? {},
      data,
    );
    return this;
  }

  withTokensController(data: FixturePartial<TokensControllerState>) {
    merge(this.fixture.data.TokensController, data);
    return this;
  }

  withTransactionController(data: FixturePartial<TransactionControllerState>) {
    merge(this.fixture.data.TransactionController, data);
    return this;
  }

  withUserStorageController(
    data: FixturePartial<UserStorageController.UserStorageControllerState>,
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
