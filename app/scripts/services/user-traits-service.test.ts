import { toHex } from '@metamask/controller-utils';
import { AddressBookEntry } from '@metamask/address-book-controller';
import { NameEntry, NameType } from '@metamask/name-controller';
import {
  Nft,
  Token,
  TokensControllerState,
} from '@metamask/assets-controllers';
import {
  AuthConnection,
  type SeedlessOnboardingControllerGetStateAction,
  type SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  EthAccountType,
  BtcAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { ThemeType } from '../../../shared/constants/preferences';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  DEVICE_TYPE,
  OS,
  PLATFORM_CHROME,
} from '../../../shared/constants/app';
import {
  MetaMetricsUserTrait,
  type MetaMetricsUserTraits,
} from '../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { KeyringType } from '../../../shared/constants/keyring';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import type { Preferences } from '../../../shared/types/preferences';
import { mockNetworkState } from '../../../test/stub/networks';
import {
  createMockInternalAccount,
  createMockInternalAccounts,
} from '../../../test/data/mock-accounts';
import * as Utils from '../lib/util';
import * as analyticsHelpers from '../controllers/analytics/analytics';
import { getUserTraitsServiceMessenger } from '../messenger-client-init/messengers/user-traits-service-messenger';
import type {
  MetaMetricsControllerGetStateAction,
  MetaMetricsControllerState,
} from '../controllers/metametrics-controller';
import { UserTraitsService } from './user-traits-service';
import type { MetaMaskState } from './user-traits-service';

const TEST_ANALYTICS_ID = '00000000-0000-4000-8000-000000000001';

type WithServiceOptions = {
  seedTraits?: Partial<MetaMetricsUserTraits>;
  seedlessOnboardingState?: Partial<SeedlessOnboardingControllerState>;
  /**
   * When true, `SeedlessOnboardingController:getState` throws, simulating the
   * controller not being registered yet.
   */
  seedlessOnboardingUnavailable?: boolean;
};

type WithServiceCallback<ReturnValue> = (args: {
  service: UserTraitsService;
  updateSeedTraits: (traits: Partial<MetaMetricsUserTraits>) => void;
}) => ReturnValue;

/**
 * Builds a {@link UserTraitsService} wired to a real restricted messenger via
 * {@link getUserTraitsServiceMessenger}, with configurable seed traits and
 * SeedlessOnboardingController state, then runs the provided callback with the
 * service and a helper to mutate the seed traits (mirroring the effect of
 * `MetaMetricsController.updateTraits`).
 *
 * @param args - Either a callback, or an options object followed by a callback.
 * @returns The return value of the callback.
 */
async function withService<ReturnValue>(
  ...args:
    | [WithServiceCallback<ReturnValue>]
    | [WithServiceOptions, WithServiceCallback<ReturnValue>]
): Promise<ReturnValue> {
  const [
    {
      seedTraits = {},
      seedlessOnboardingState = {},
      seedlessOnboardingUnavailable = false,
    },
    fn,
  ] = args.length === 2 ? args : [{}, args[0]];

  let seed = { ...seedTraits } as MetaMetricsUserTraits;

  const rootMessenger: Messenger<
    MockAnyNamespace,
    | MetaMetricsControllerGetStateAction
    | SeedlessOnboardingControllerGetStateAction,
    never
  > = new Messenger({ namespace: MOCK_ANY_NAMESPACE });

  rootMessenger.registerActionHandler(
    'MetaMetricsController:getState',
    () => ({ traits: seed }) as MetaMetricsControllerState,
  );

  rootMessenger.registerActionHandler(
    'SeedlessOnboardingController:getState',
    () => {
      if (seedlessOnboardingUnavailable) {
        throw new Error('SeedlessOnboardingController is not registered');
      }
      return seedlessOnboardingState as SeedlessOnboardingControllerState;
    },
  );

  const service = new UserTraitsService({
    messenger: getUserTraitsServiceMessenger(rootMessenger),
  });

  const updateSeedTraits = (traits: Partial<MetaMetricsUserTraits>) => {
    seed = { ...seed, ...traits };
  };

  return fn({ service, updateSeedTraits });
}

describe('UserTraitsService', function () {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function buildStateWithAccounts(
    accounts: Record<string, InternalAccount>,
  ): Parameters<UserTraitsService['_buildUserTraitsObject']>[0] {
    return {
      addressBook: {},
      allNfts: {},
      allTokens: {},
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      internalAccounts: {
        accounts,
        selectedAccount: Object.keys(accounts)[0] ?? '',
      },
      multichainNetworkConfigurationsByChainId: {},
      ledgerTransportType: LedgerTransportTypes.webhid,
      openSeaEnabled: false,
      useNftDetection: false,
      theme: 'default' as ThemeType,
      useTokenDetection: false,
      names: {
        [NameType.ETHEREUM_ADDRESS]: {},
      },
      currentCurrency: 'usd',
      securityAlertsEnabled: false,
      consentDecisionMade: true,
      optedIn: true,
      analyticsId: '',
      dataCollectionForMarketing: false,
      preferences: {
        privacyMode: false,
        tokenNetworkFilter: {},
        tokenSortConfig: {
          key: '',
          order: 'dsc',
          sortCallback: 'stringNumeric',
        },
        showNativeTokenAsMainBalance: false,
      } as Preferences,
      srpSessionData: undefined,
      keyrings: [],
      firstTimeFlowType: FirstTimeFlowType.create,
    };
  }

  const buildKeyringAccount = (id: string, keyringType: string) => ({
    id,
    metadata: { keyring: { type: keyringType } },
  });

  const buildMnemonicEntropyAccount = ({
    id,
    entropyId,
    groupIndex,
    derivationPath,
    keyringType = KeyringType.hdKeyTree,
  }: {
    id: string;
    entropyId: string;
    groupIndex: number;
    derivationPath?: string;
    keyringType?: string;
  }) => ({
    ...buildKeyringAccount(id, keyringType),
    options: {
      entropy: {
        type: 'mnemonic' as const,
        id: entropyId,
        groupIndex,
        ...(derivationPath ? { derivationPath } : {}),
      },
    },
  });

  describe('_buildUserTraitsObject', function () {
    beforeEach(() => {
      jest.spyOn(Utils, 'getPlatform').mockReturnValue(PLATFORM_CHROME);
      jest.spyOn(Utils, 'getDeviceType').mockReturnValue(DEVICE_TYPE.DESKTOP);
      jest.spyOn(Utils, 'getOs').mockReturnValue(OS.MACOS);
    });

    it('should return full user traits object on first call', async function () {
      const MOCK_ALL_TOKENS: TokensControllerState['allTokens'] = {
        [toHex(1)]: {
          '0x1235ce91d74254f29d4609f25932fe6d97bf4842': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
            {
              address: '0xabc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
            },
          ] as Token[],
          '0xe364b0f9d1879e53e8183055c9d7dd2b7375d86b': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
          ] as Token[],
        },
        [toHex(4)]: {
          '0x1235ce91d74254f29d4609f25932fe6d97bf4842': [
            {
              address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
            },
            {
              address: '0x12317F958D2ee523a2206206994597C13D831ec7',
            },
          ] as Token[],
        },
      };

      await withService(({ service, updateSeedTraits }) => {
        updateSeedTraits({
          [MetaMetricsUserTrait.StorageKind]: 'split',
        });

        const traits = service._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allNfts: {
            '0xac706cE8A9BF27Afecf080fB298d0ee13cfb978A': {
              [toHex(56)]: [
                {
                  address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
                  tokenId: '100',
                },
                {
                  address: '0xd2cea331e5f5d8ee9fb1055c297795937645de91',
                  tokenId: '101',
                },
                {
                  address: '0x7488d2ce5deb26db021285b50b661d655eb3d3d9',
                  tokenId: '99',
                },
              ] as Nft[],
            },
            '0xe04AB39684A24D8D4124b114F3bd6FBEB779cacA': {
              [toHex(59)]: [
                {
                  address: '0x63d646bc7380562376d5de205123a57b1718184d',
                  tokenId: '14',
                },
              ] as Nft[],
            },
          },
          allTokens: MOCK_ALL_TOKENS,
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.GOERLI },
            { chainId: '0xaf' },
          ),
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          multichainNetworkConfigurationsByChainId: {
            'bip122:000000000019d6689c085ae165831e93': {
              chainId: 'bip122:000000000019d6689c085ae165831e93',
              isEvm: false,
              name: 'Bitcoin Mainnet',
              nativeCurrency:
                'bip122:000000000019d6689c085ae165831e93/slip44:0',
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
              isEvm: false,
              name: 'Solana Mainnet',
              nativeCurrency:
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            },
          },
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          useNftDetection: false,
          securityAlertsEnabled: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          names: {
            [NameType.ETHEREUM_ADDRESS]: {
              '0x123': {
                '0x1': {
                  name: 'Test 1',
                } as NameEntry,
                '0x2': {
                  name: 'Test 2',
                } as NameEntry,
                '0x3': {
                  name: null,
                } as NameEntry,
              },
              '0x456': {
                '0x1': {
                  name: 'Test 3',
                } as NameEntry,
              },
              '0x789': {
                '0x1': {
                  name: null,
                } as NameEntry,
              },
            },
          },
          consentDecisionMade: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          currentCurrency: 'usd',
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          srpSessionData: undefined,
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.create,
        });

        expect(traits).toStrictEqual({
          [MetaMetricsUserTrait.AddressBookEntries]: 3,
          [MetaMetricsUserTrait.ChainIdList]: [
            'eip155:1',
            'eip155:5',
            'eip155:175',
            'bip122:000000000019d6689c085ae165831e93',
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          ],
          [MetaMetricsUserTrait.InstallDateExt]: '',
          [MetaMetricsUserTrait.StorageKind]: 'split',
          [MetaMetricsUserTrait.LedgerConnectionType]:
            LedgerTransportTypes.webhid,
          [MetaMetricsUserTrait.NetworksAdded]: [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.GOERLI,
            '0xaf',
          ],
          [MetaMetricsUserTrait.NetworksWithoutTicker]: ['0xaf'],
          [MetaMetricsUserTrait.NftAutodetectionEnabled]: false,
          [MetaMetricsUserTrait.NumberOfAccounts]: 2,
          [MetaMetricsUserTrait.NumberOfNftCollections]: 3,
          [MetaMetricsUserTrait.NumberOfNfts]: 4,
          [MetaMetricsUserTrait.NumberOfTokens]: 5,
          [MetaMetricsUserTrait.NumberOfHDEntropies]: 0,
          [MetaMetricsUserTrait.NumberOfAccountGroups]: 2,
          [MetaMetricsUserTrait.NumberOfImportedAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfLedgerAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfTrezorAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfLatticeAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfQrHardwareAccounts]: 0,
          [MetaMetricsUserTrait.NumberOfHardwareWallets]: 0,
          [MetaMetricsUserTrait.OpenSeaApiEnabled]: true,
          [MetaMetricsUserTrait.ThreeBoxEnabled]: false,
          [MetaMetricsUserTrait.Theme]: 'default',
          [MetaMetricsUserTrait.TokenDetectionEnabled]: true,
          [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]: true,
          [MetaMetricsUserTrait.CurrentCurrency]: 'usd',
          [MetaMetricsUserTrait.HasMarketingConsent]: false,
          [MetaMetricsUserTrait.SecurityProviders]: ['blockaid'],
          [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
          [MetaMetricsUserTrait.CanonicalProfileId]: undefined,
          [MetaMetricsUserTrait.AccountType]: 'metamask',
          [MetaMetricsUserTrait.PetnameAddressCount]: 3,
          [MetaMetricsUserTrait.TokenSortPreference]: 'token-sort-key',
          [MetaMetricsUserTrait.PrivacyModeEnabled]: true,
          [MetaMetricsUserTrait.NetworkFilterPreference]: [],
          [MetaMetricsUserTrait.Platform]: 'Chrome',
          [MetaMetricsUserTrait.InstallType]: 'unknown',
          [MetaMetricsUserTrait.DeviceType]: DEVICE_TYPE.DESKTOP,
          [MetaMetricsUserTrait.Os]: OS.MACOS,
        });
      });
    });

    it('uses the social create flow to build the account type trait', async function () {
      await withService(
        {
          seedlessOnboardingState: {
            authConnection: AuthConnection.Google,
          },
        },
        ({ service }) => {
          const traits = service._buildUserTraitsObject({
            addressBook: {},
            allTokens: {},
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            ledgerTransportType: LedgerTransportTypes.webhid,
            openSeaEnabled: true,
            internalAccounts: {
              accounts: {
                mock1: {} as InternalAccount,
              },
              selectedAccount: 'mock1',
            },
            useNftDetection: false,
            theme: 'default' as ThemeType,
            useTokenDetection: true,
            allNfts: {},
            consentDecisionMade: true,
            optedIn: true,
            analyticsId: TEST_ANALYTICS_ID,
            dataCollectionForMarketing: false,
            preferences: {
              privacyMode: false,
              tokenNetworkFilter: {},
              tokenSortConfig: {
                key: 'token-sort-key',
                order: 'dsc',
                sortCallback: 'stringNumeric',
              },
              showNativeTokenAsMainBalance: false,
            } as Preferences,
            securityAlertsEnabled: false,
            names: {
              ethereumAddress: {},
            },
            currentCurrency: 'usd',
            srpSessionData: undefined,
            keyrings: [],
            firstTimeFlowType: FirstTimeFlowType.socialCreate,
            multichainNetworkConfigurationsByChainId: {},
          });

          expect(traits?.[MetaMetricsUserTrait.AccountType]).toBe(
            'metamask_google',
          );
        },
      );
    });

    it('uses the social import flow to build the account type trait', async function () {
      await withService(
        {
          seedlessOnboardingState: {
            authConnection: AuthConnection.Google,
          },
        },
        ({ service }) => {
          const traits = service._buildUserTraitsObject({
            addressBook: {},
            allTokens: {},
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            ledgerTransportType: LedgerTransportTypes.webhid,
            openSeaEnabled: true,
            internalAccounts: {
              accounts: {
                mock1: {} as InternalAccount,
              },
              selectedAccount: 'mock1',
            },
            useNftDetection: false,
            theme: 'default' as ThemeType,
            useTokenDetection: true,
            allNfts: {},
            consentDecisionMade: true,
            optedIn: true,
            analyticsId: TEST_ANALYTICS_ID,
            dataCollectionForMarketing: false,
            preferences: {
              privacyMode: false,
              tokenNetworkFilter: {},
              tokenSortConfig: {
                key: 'token-sort-key',
                order: 'dsc',
                sortCallback: 'stringNumeric',
              },
              showNativeTokenAsMainBalance: false,
            } as Preferences,
            securityAlertsEnabled: false,
            names: {
              ethereumAddress: {},
            },
            currentCurrency: 'usd',
            srpSessionData: undefined,
            keyrings: [],
            firstTimeFlowType: FirstTimeFlowType.socialImport,
            multichainNetworkConfigurationsByChainId: {},
          });

          expect(traits?.[MetaMetricsUserTrait.AccountType]).toBe(
            'imported_google',
          );
        },
      );
    });

    it('should return only changed traits object on subsequent calls', async function () {
      await withService(({ service }) => {
        const networkState = mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        );
        service._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allTokens: {},
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: false,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          allNfts: {},
          consentDecisionMade: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          securityAlertsEnabled: true,
          names: {
            ethereumAddress: {},
          },
          currentCurrency: 'usd',
          srpSessionData: undefined,
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.create,
          multichainNetworkConfigurationsByChainId: {},
        } as MetaMaskState);

        const updatedTraits = service._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x1': {
                address: '0x1',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allTokens: {
            [toHex(1)]: {
              '0xabcde': [{ address: '0xtestAddress' } as Token],
            },
          },
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: false,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
              mock3: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: false,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          names: {
            ethereumAddress: {},
          },
          currentCurrency: 'usd',
          allNfts: {},
          consentDecisionMade: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: false,
          } as Preferences,
          securityAlertsEnabled: true,
          srpSessionData: {
            entropySourceId1: {
              token: {
                accessToken: '',
                expiresIn: 0,
                obtainedAt: 0,
              },
              profile: {
                identifierId: 'identifierId',
                profileId: 'profileId',
                canonicalProfileId: 'canonicalProfileId',
                metaMetricsId: 'testid',
              },
            },
          },
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.import,
          multichainNetworkConfigurationsByChainId: {},
        } as MetaMaskState);

        expect(updatedTraits).toStrictEqual({
          [MetaMetricsUserTrait.AddressBookEntries]: 4,
          [MetaMetricsUserTrait.NumberOfAccounts]: 3,
          [MetaMetricsUserTrait.NumberOfAccountGroups]: 3,
          [MetaMetricsUserTrait.NumberOfTokens]: 1,
          [MetaMetricsUserTrait.OpenSeaApiEnabled]: false,
          [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]: false,
          [MetaMetricsUserTrait.CanonicalProfileId]: 'canonicalProfileId',
          [MetaMetricsUserTrait.AccountType]: 'imported',
        });
      });
    });

    it('should return null if no traits changed', async function () {
      await withService(({ service }) => {
        const networkState = mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        );
        service._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': {
                address: '0x0',
              } as AddressBookEntry,
            },
          },
          allTokens: {},
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          allNfts: {},
          consentDecisionMade: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          names: {
            ethereumAddress: {},
          },
          securityAlertsEnabled: true,
          currentCurrency: 'usd',
          srpSessionData: {
            entropySourceId1: {
              token: {
                accessToken: '',
                expiresIn: 0,
                obtainedAt: 0,
              },
              profile: {
                identifierId: 'identifierId',
                profileId: 'profileId',
                canonicalProfileId: 'canonicalProfileId',
                metaMetricsId: 'testid',
              },
            },
          },
          keyrings: [],
          multichainNetworkConfigurationsByChainId: {},
          firstTimeFlowType: FirstTimeFlowType.create,
        });

        const updatedTraits = service._buildUserTraitsObject({
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
            },
            [CHAIN_IDS.GOERLI]: {
              '0x': {
                address: '0x',
              } as AddressBookEntry,
              '0x0': { address: '0x0' } as AddressBookEntry,
            },
          },
          allTokens: {},
          ...networkState,
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
              mock2: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          useNftDetection: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          allNfts: {},
          consentDecisionMade: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          names: {
            ethereumAddress: {},
          },
          securityAlertsEnabled: true,
          currentCurrency: 'usd',
          srpSessionData: {
            entropySourceId1: {
              token: {
                accessToken: '',
                expiresIn: 0,
                obtainedAt: 0,
              },
              profile: {
                identifierId: 'identifierId',
                profileId: 'profileId',
                canonicalProfileId: 'canonicalProfileId',
                metaMetricsId: 'testid',
              },
            },
          },
          keyrings: [],
          multichainNetworkConfigurationsByChainId: {},
          firstTimeFlowType: FirstTimeFlowType.create,
        });
        expect(updatedTraits).toStrictEqual(null);
      });
    });

    it('should count BIP44 multichain accounts as one account group per entropy+index pair', async function () {
      const srp1 = 'entropy-source-id-1';
      function mockBip44Account(
        id: string,
        type: InternalAccount['type'],
        keyringType: InternalAccount['metadata']['keyring']['type'],
        groupIndex: number,
      ) {
        return createMockInternalAccount({
          id,
          type,
          metadata: { keyring: { type: keyringType } },
          options: {
            entropy: {
              type: 'mnemonic',
              id: srp1,
              groupIndex,
              derivationPath: '',
            },
          },
        });
      }

      // 2 account groups from 1 SRP, each with EVM + BTC + SOL addresses.
      const evm0 = mockBip44Account(
        'evm-0',
        EthAccountType.Eoa,
        KeyringType.hdKeyTree,
        0,
      );
      const btc0 = mockBip44Account(
        'btc-0',
        BtcAccountType.P2wpkh,
        KeyringType.snap,
        0,
      );
      const sol0 = mockBip44Account(
        'sol-0',
        SolAccountType.DataAccount,
        KeyringType.snap,
        0,
      );
      const evm1 = mockBip44Account(
        'evm-1',
        EthAccountType.Eoa,
        KeyringType.hdKeyTree,
        1,
      );
      const btc1 = mockBip44Account(
        'btc-1',
        BtcAccountType.P2wpkh,
        KeyringType.snap,
        1,
      );
      const sol1 = mockBip44Account(
        'sol-1',
        SolAccountType.DataAccount,
        KeyringType.snap,
        1,
      );

      const mockAccounts: Record<string, InternalAccount> = {
        [evm0.id]: evm0,
        [btc0.id]: btc0,
        [sol0.id]: sol0,
        [evm1.id]: evm1,
        [btc1.id]: btc1,
        [sol1.id]: sol1,
      };
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(mockAccounts),
        );

        // 6 internal accounts but only 2 unique {srp, groupIndex} pairs → 2 groups.
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(2);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(0);
        // 1 unique entropy id → 1 HD entropy.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
      });
    });

    it('should correctly count imported and hardware wallet account types', async function () {
      const mockAccounts = createMockInternalAccounts([
        buildMnemonicEntropyAccount({
          id: 'hd-acc',
          entropyId: 'srp1',
          groupIndex: 0,
          derivationPath: "m/44'/60'/0'/0/0",
        }),
        buildKeyringAccount('imported-acc', KeyringType.imported),
        buildKeyringAccount('snap-acc', KeyringType.snap),
        buildKeyringAccount('ledger-acc', KeyringType.ledger),
        buildKeyringAccount('trezor-acc', KeyringType.trezor),
        buildKeyringAccount('lattice-acc', KeyringType.lattice),
        buildKeyringAccount('qr-acc', KeyringType.qr),
        buildKeyringAccount('onekey-acc', KeyringType.oneKey),
      ]);
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(mockAccounts),
        );

        // 8 accounts: 1 HD group + 1 imported + 1 snap + 1 ledger +
        //             1 trezor + 1 lattice + 1 qr + 1 onekey = 8 distinct groups.
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(8);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfTrezorAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLatticeAccounts]).toBe(1);
        // QR hardware includes both 'QR Hardware Wallet Device' and 'OneKey Hardware'.
        expect(traits?.[MetaMetricsUserTrait.NumberOfQrHardwareAccounts]).toBe(
          2,
        );
        // 1 mnemonic entropy id → 1 HD entropy; hardware wallets don't contribute.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(1);
        // 1 of each type paired → 4 distinct hardware wallets (one per type).
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(4);
      });
    });
  });

  describe('#getAccountCompositionTraits', function () {
    it('returns zeros for an empty accounts object', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts({}),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfTrezorAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLatticeAccounts]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfQrHardwareAccounts]).toBe(
          0,
        );
      });
    });

    it('counts a single SRP with multiple account groups as one HD entropy', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildMnemonicEntropyAccount({
                id: 'evm-0',
                entropyId: 'srp1',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-1',
                entropyId: 'srp1',
                groupIndex: 1,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-2',
                entropyId: 'srp1',
                groupIndex: 2,
              }),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(3);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
      });
    });

    it('counts multiple distinct SRPs as separate HD entropies', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildMnemonicEntropyAccount({
                id: 'evm-srp1',
                entropyId: 'srp1',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-srp2',
                entropyId: 'srp2',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-srp3',
                entropyId: 'srp3',
                groupIndex: 0,
              }),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(3);
        expect(traits?.[MetaMetricsUserTrait.NumberOfAccountGroups]).toBe(3);
      });
    });

    it('does not count hardware wallets toward HD entropies', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildKeyringAccount('ledger-1', KeyringType.ledger),
              buildKeyringAccount('ledger-2', KeyringType.ledger),
              buildKeyringAccount('trezor-1', KeyringType.trezor),
              buildKeyringAccount('lattice-1', KeyringType.lattice),
              buildKeyringAccount('qr-1', KeyringType.qr),
              buildKeyringAccount('onekey-1', KeyringType.oneKey),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLedgerAccounts]).toBe(2);
        expect(traits?.[MetaMetricsUserTrait.NumberOfTrezorAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfLatticeAccounts]).toBe(1);
        expect(traits?.[MetaMetricsUserTrait.NumberOfQrHardwareAccounts]).toBe(
          2,
        );
        // 1 Ledger device + 1 Trezor + 1 Lattice + 1 QR (OneKey) = 4 distinct hardware wallets.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(4);
      });
    });

    it('does not count imported accounts toward HD entropies or hardware wallets', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildKeyringAccount('imported-1', KeyringType.imported),
              buildKeyringAccount('imported-2', KeyringType.imported),
            ]),
          ),
        );
        expect(traits?.[MetaMetricsUserTrait.NumberOfHDEntropies]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(0);
        expect(traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts]).toBe(2);
      });
    });

    it('computes number_of_hardware_wallets as the sum of all hardware wallet types', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildKeyringAccount('ledger-1', KeyringType.ledger),
              buildKeyringAccount('ledger-2', KeyringType.ledger),
              buildKeyringAccount('trezor-1', KeyringType.trezor),
              buildKeyringAccount('lattice-1', KeyringType.lattice),
              buildKeyringAccount('lattice-2', KeyringType.lattice),
              buildKeyringAccount('qr-1', KeyringType.qr),
              buildKeyringAccount('onekey-1', KeyringType.oneKey),
            ]),
          ),
        );
        // 1 Ledger device + 1 Trezor + 1 Lattice + 1 QR (includes OneKey) = 4 distinct hardware wallets.
        expect(traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets]).toBe(4);
      });
    });

    it('handles accounts with unknown keyring type without throwing', async function () {
      await withService(({ service }) => {
        expect(() =>
          service._buildUserTraitsObject(
            buildStateWithAccounts(
              createMockInternalAccounts([
                buildKeyringAccount('unknown-acc', 'SomeUnknownKeyring'),
              ]),
            ),
          ),
        ).not.toThrow();
      });
    });

    it('handles accounts with missing metadata without throwing', async function () {
      await withService(({ service }) => {
        expect(() =>
          service._buildUserTraitsObject(
            buildStateWithAccounts(
              createMockInternalAccounts([
                {
                  ...buildKeyringAccount(
                    'no-metadata-acc',
                    KeyringType.hdKeyTree,
                  ),
                  metadata: undefined,
                },
              ]),
            ),
          ),
        ).not.toThrow();
      });
    });

    it('derives total wallets from hd_entropies + hardware_wallets + imported_accounts', async function () {
      await withService(({ service }) => {
        const traits = service._buildUserTraitsObject(
          buildStateWithAccounts(
            createMockInternalAccounts([
              buildMnemonicEntropyAccount({
                id: 'evm-0',
                entropyId: 'srp1',
                groupIndex: 0,
              }),
              buildMnemonicEntropyAccount({
                id: 'evm-1',
                entropyId: 'srp2',
                groupIndex: 0,
              }),
              buildKeyringAccount('ledger-1', KeyringType.ledger),
              buildKeyringAccount('imported-1', KeyringType.imported),
              // Snap accounts are excluded from total wallet count.
              buildKeyringAccount('snap-1', KeyringType.snap),
            ]),
          ),
        );
        const hdEntropies =
          traits?.[MetaMetricsUserTrait.NumberOfHDEntropies] ?? 0;
        const hardwareWallets =
          traits?.[MetaMetricsUserTrait.NumberOfHardwareWallets] ?? 0;
        const importedAccounts =
          traits?.[MetaMetricsUserTrait.NumberOfImportedAccounts] ?? 0;
        // 2 SRPs + 1 hardware + 1 imported = 4 total wallets.
        expect(hdEntropies + hardwareWallets + importedAccounts).toBe(4);
      });
    });
  });

  describe('handleMetaMaskStateUpdate', function () {
    it('falls back to the base account type when SeedlessOnboardingController is unavailable', async function () {
      await withService(
        { seedlessOnboardingUnavailable: true },
        ({ service }) => {
          const state = buildStateWithAccounts({});

          expect(() =>
            service._buildUserTraitsObject({
              ...state,
              firstTimeFlowType: FirstTimeFlowType.socialCreate,
            }),
          ).not.toThrow();

          const traits = service._buildUserTraitsObject({
            ...state,
            firstTimeFlowType: FirstTimeFlowType.socialImport,
          });

          expect(traits?.[MetaMetricsUserTrait.AccountType]).toBe('imported');
        },
      );
    });

    it('refreshes the cached profile session data from the new state', async function () {
      await withService(({ service }) => {
        const updateProfileSessionDataSpy = jest
          .spyOn(analyticsHelpers, 'updateProfileSessionData')
          .mockImplementation(() => undefined);
        jest.spyOn(service, '_buildUserTraitsObject').mockReturnValue(null);

        const srpSessionData = { entropySourceId1: {} };

        service.handleMetaMaskStateUpdate({
          srpSessionData,
        } as unknown as MetaMaskState);

        expect(updateProfileSessionDataSpy).toHaveBeenCalledTimes(1);
        expect(updateProfileSessionDataSpy).toHaveBeenCalledWith(
          srpSessionData,
        );
      });
    });

    it('updates the profile when install attribution traits arrive after opt-in', async function () {
      await withService({}, async ({ service, updateSeedTraits }) => {
        const identifySpy = jest
          .spyOn(analyticsHelpers, 'identify')
          .mockImplementation(() => undefined);

        const metaMaskState = {
          addressBook: {},
          allNfts: {},
          allTokens: {},
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          internalAccounts: {
            accounts: {
              mock1: {} as InternalAccount,
            },
            selectedAccount: 'mock1',
          },
          multichainNetworkConfigurationsByChainId: {},
          ledgerTransportType: LedgerTransportTypes.webhid,
          openSeaEnabled: true,
          useNftDetection: false,
          securityAlertsEnabled: true,
          theme: 'default' as ThemeType,
          useTokenDetection: true,
          names: {
            ethereumAddress: {},
          },
          consentDecisionMade: true,
          optedIn: true,
          analyticsId: TEST_ANALYTICS_ID,
          currentCurrency: 'usd',
          dataCollectionForMarketing: false,
          preferences: {
            privacyMode: true,
            tokenNetworkFilter: {},
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
            showNativeTokenAsMainBalance: true,
          } as Preferences,
          srpSessionData: undefined,
          keyrings: [],
          firstTimeFlowType: FirstTimeFlowType.create,
        };

        service.handleMetaMaskStateUpdate(metaMaskState);

        expect(identifySpy).toHaveBeenCalledTimes(1);

        updateSeedTraits({
          [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
          [MetaMetricsUserTrait.GaClientId]: '12345.67890',
        });

        service.handleMetaMaskStateUpdate(metaMaskState);

        expect(identifySpy).toHaveBeenCalledTimes(2);
        expect(identifySpy).toHaveBeenLastCalledWith({
          [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
          [MetaMetricsUserTrait.GaClientId]: '12345.67890',
        });
      });
    });
  });
});
