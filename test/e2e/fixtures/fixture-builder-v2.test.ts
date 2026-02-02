import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  FixtureBuilderV2,
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  E2E_SRP,
  FIXTURE_STATE_METADATA_VERSION,
} from './fixture-builder-v2';
import onboardingFixtureJson from './onboarding-fixture.json';

describe('FixtureBuilderV2', () => {
  describe('constructor - default (completed onboarding)', () => {
    it('applies completed onboarding state by default', () => {
      const fixture = new FixtureBuilderV2().build();

      expect(fixture.data.OnboardingController.completedOnboarding).toBe(true);
      expect(fixture.data.OnboardingController.seedPhraseBackedUp).toBe(true);
    });

    it('sets up vault by default', () => {
      const fixture = new FixtureBuilderV2().build();

      expect(
        (fixture.data.KeyringController as { vault?: string }).vault,
      ).toBeDefined();
    });

    it('sets up default account by default', () => {
      const fixture = new FixtureBuilderV2().build();

      expect(
        fixture.data.AccountsController.internalAccounts.selectedAccount,
      ).toBe(DEFAULT_FIXTURE_ACCOUNT_ID);
      const { accounts } = fixture.data.AccountsController.internalAccounts;
      expect(accounts[DEFAULT_FIXTURE_ACCOUNT_ID]).toBeDefined();
      expect(accounts[DEFAULT_FIXTURE_ACCOUNT_ID].address).toBe(
        DEFAULT_FIXTURE_ACCOUNT,
      );
    });

    it('sets AuthenticationController.isSignedIn to true by default', () => {
      const fixture = new FixtureBuilderV2().build();
      expect(fixture.data.AuthenticationController.isSignedIn).toBe(true);
    });

    it('uses LOCALHOST chain ID by default', () => {
      const fixture = new FixtureBuilderV2().build();

      expect(fixture.data.AccountTracker.accountsByChainId).toHaveProperty(
        CHAIN_IDS.LOCALHOST,
      );
    });

    it('respects custom inputChainId', () => {
      const customChainId = '0x5';
      const fixture = new FixtureBuilderV2({
        inputChainId: customChainId,
      }).build();

      expect(fixture.data.AccountTracker.accountsByChainId).toHaveProperty(
        customChainId,
      );
    });

    it('sets up localhost network as selected in NetworkController', () => {
      const fixture = new FixtureBuilderV2().build();

      // Check localhost is selected
      expect(fixture.data.NetworkController.selectedNetworkClientId).toBe(
        'networkConfigurationId',
      );

      // Check localhost network configuration exists
      expect(
        fixture.data.NetworkController.networkConfigurationsByChainId,
      ).toHaveProperty(CHAIN_IDS.LOCALHOST);

      const localhostConfig =
        fixture.data.NetworkController.networkConfigurationsByChainId[
          CHAIN_IDS.LOCALHOST
        ];
      expect(localhostConfig.name).toBe('Localhost 8545');
      expect(localhostConfig.nativeCurrency).toBe('ETH');
      expect(localhostConfig.rpcEndpoints[0].url).toBe('http://localhost:8545');

      // Check localhost is in networksMetadata
      expect(fixture.data.NetworkController.networksMetadata).toHaveProperty(
        'networkConfigurationId',
      );
    });

    it('includes localhost in NetworkOrderController', () => {
      const fixture = new FixtureBuilderV2().build();

      const orderedList =
        fixture.data.NetworkOrderController.orderedNetworkList;
      const localhostEntry = orderedList.find(
        (n: { networkId: string }) => n.networkId === CHAIN_IDS.LOCALHOST,
      );

      expect(localhostEntry).toBeDefined();
      expect(localhostEntry.networkRpcUrl).toBe('http://localhost:8545');
    });
  });

  describe('constructor - onboarding: true', () => {
    it('uses raw onboarding fixture when onboarding: true', () => {
      const fixture = new FixtureBuilderV2({ onboarding: true }).build();

      expect(fixture.data.OnboardingController.completedOnboarding).toBe(false);
      expect(fixture.data.OnboardingController.seedPhraseBackedUp).toBeNull();
      expect(fixture.data.KeyringController).toEqual({});
      expect(
        fixture.data.AccountsController.internalAccounts.selectedAccount,
      ).toBe('');
    });

    it('has AuthenticationController.isSignedIn = false when onboarding: true', () => {
      const fixture = new FixtureBuilderV2({ onboarding: true }).build();
      expect(fixture.data.AuthenticationController.isSignedIn).toBe(false);
    });
  });

  describe('immutability', () => {
    it('does not mutate the original onboarding fixture', () => {
      const originalOnboardingState = JSON.stringify(onboardingFixtureJson);

      // Create builder and modify it
      new FixtureBuilderV2()
        .withPreferencesController({ theme: 'dark' })
        .build();

      // Original should be unchanged
      expect(JSON.stringify(onboardingFixtureJson)).toBe(
        originalOnboardingState,
      );
    });

    it('each builder instance is independent', () => {
      const builder1 = new FixtureBuilderV2();
      const builder2 = new FixtureBuilderV2();

      builder1.withPreferencesController({ theme: 'dark' });
      builder2.withPreferencesController({ theme: 'light' });

      const fixture1 = builder1.build();
      const fixture2 = builder2.build();

      expect(fixture1.data.PreferencesController.theme).toBe('dark');
      expect(fixture2.data.PreferencesController.theme).toBe('light');
    });
  });

  describe('exports', () => {
    it('exports E2E_SRP', () => {
      expect(E2E_SRP).toBe(
        'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
      );
    });

    it('exports DEFAULT_FIXTURE_ACCOUNT', () => {
      expect(DEFAULT_FIXTURE_ACCOUNT).toBe(
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      );
    });

    it('exports DEFAULT_FIXTURE_ACCOUNT_ID', () => {
      expect(DEFAULT_FIXTURE_ACCOUNT_ID).toBe(
        'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
      );
    });

    it('exports FIXTURE_STATE_METADATA_VERSION from onboarding fixture', () => {
      expect(FIXTURE_STATE_METADATA_VERSION).toBe(
        onboardingFixtureJson.meta.version,
      );
    });
  });

  describe('generic controller methods', () => {
    const controllerMethods: [string, Record<string, unknown>][] = [
      ['withAccountTracker', { accountsByChainId: {} }],
      ['withAddressBookController', { addressBook: {} }],
      ['withAlertController', {}],
      ['withAnnouncementController', {}],
      ['withAppStateController', {}],
      ['withAuthenticationController', {}],
      ['withAccountOrderController', {}],
      ['withAccountsController', {}],
      ['withCurrencyController', {}],
      ['withGasFeeController', {}],
      ['withKeyringController', {}],
      ['withMetaMetricsController', {}],
      ['withNameController', {}],
      ['withNetworkController', {}],
      ['withNetworkEnablementController', {}],
      ['withNetworkOrderController', {}],
      ['withNftController', {}],
      ['withNotificationServicesController', {}],
      ['withOnboardingController', {}],
      ['withPermissionController', {}],
      ['withPermissionLogController', {}],
      ['withPreferencesController', {}],
      ['withRemoteFeatureFlagController', {}],
      ['withSelectedNetworkController', {}],
      ['withSmartTransactionsController', {}],
      ['withSnapController', {}],
      ['withSubjectMetadataController', {}],
      ['withTokenBalancesController', {}],
      ['withTokenListController', {}],
      ['withTokensController', {}],
      ['withTransactionController', {}],
      ['withUserStorageController', {}],
    ];

    it.each(controllerMethods)('%s does not throw', (method, args) => {
      const builder = new FixtureBuilderV2();
      expect(() =>
        (builder as unknown as Record<string, (data: unknown) => unknown>)[
          method
        ](args),
      ).not.toThrow();
    });

    it.each(controllerMethods)(
      '%s returns builder for chaining',
      (method, args) => {
        const builder = new FixtureBuilderV2();
        const result = (
          builder as unknown as Record<string, (data: unknown) => unknown>
        )[method](args);
        expect(result).toBe(builder);
      },
    );
  });

  describe('chaining', () => {
    it('supports chaining multiple methods', () => {
      const fixture = new FixtureBuilderV2()
        .withNetworkController({ selectedNetworkClientId: 'mainnet' })
        .withPreferencesController({ theme: 'dark' })
        .build();

      expect(fixture).toBeDefined();
      expect(fixture.data.NetworkController.selectedNetworkClientId).toBe(
        'mainnet',
      );
      expect(fixture.data.PreferencesController.theme).toBe('dark');
    });
  });

  describe('fixture structure', () => {
    it('all controllers in fixture exist in onboarding fixture or allowed additions', () => {
      const fixture = new FixtureBuilderV2().build();
      const onboardingKeys = new Set(Object.keys(onboardingFixtureJson.data));

      // Controllers that are intentionally added by the default fixture
      // but not present in onboarding fixture
      const allowedAdditions = new Set(['SmartTransactionsController']);

      for (const key of Object.keys(fixture.data)) {
        const existsInOnboarding = onboardingKeys.has(key);
        const isAllowedAddition = allowedAdditions.has(key);
        expect(existsInOnboarding || isAllowedAddition).toBe(true);
      }
    });
  });
});
