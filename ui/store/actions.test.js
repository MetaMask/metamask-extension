import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  USER_STORAGE_GROUPS_FEATURE_KEY,
  USER_STORAGE_WALLETS_FEATURE_KEY,
} from '@metamask/account-tree-controller';
import { EthAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { RequestSourceFlow } from '@metamask/phishing-controller';
import { stringToBytes } from '@metamask/utils';
import { TransactionStatus } from '@metamask/transaction-controller';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { SubscriptionUserEvent } from '@metamask/subscription-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import enLocale from '../../app/_locales/en/messages.json';
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { GAS_LIMITS } from '../../shared/constants/gas';
import { ORIGIN_METAMASK } from '../../shared/constants/app';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
  MetaMetricsUserTrait,
} from '../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../shared/lib/trace';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../shared/constants/onboarding';
import { stripWalletTypePrefixFromWalletId } from '../hooks/multichain-accounts/utils';
import { createMockNotificationPreferences } from '../hooks/metamask-notifications/mocks';
import * as actions from './actions';
import * as actionConstants from './actionConstants';
import { setBackgroundConnection } from './background-connection';
import { listenForHardwareSigningCompletion } from './hardware-wallet-signing';

const toSerializedSeedPhraseBuffer = (seedPhrase) => ({
  type: 'Buffer',
  data: actions.encodeSeedPhraseForBackground(seedPhrase),
});

jest.mock(
  '../../app/scripts/messenger-client-init/perps-controller-init',
  () => ({
    PerpsControllerInit: jest.fn().mockReturnValue({
      messengerClient: {
        state: {},
        name: 'PerpsController',
      },
      api: {},
    }),
  }),
);

jest.mock('./hardware-wallet-signing', () => ({
  ...jest.requireActual('./hardware-wallet-signing'),
  listenForHardwareSigningCompletion: jest.fn(),
}));

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

const mockUlid = '01JMPHQSH1A4DQAAS6ES7NDJ38';

const middleware = [thunk];
const defaultState = {
  appState: {
    modal: {
      modalState: {},
    },
  },
  metamask: {
    currentLocale: 'test',
    networkConfigurationsByChainId: {
      [CHAIN_IDS.MAINNET]: {
        chainId: CHAIN_IDS.MAINNET,
        rpcEndpoints: [{}],
      },
    },
    accounts: {
      '0xFirstAddress': {
        balance: '0x0',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [
          {
            address: '0xFirstAddress',
          },
        ],
        metadata: {
          id: mockUlid,
          name: '',
        },
      },
    ],
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0xFirstAddress',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: ETH_EOA_METHODS,
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    accountIdByAddress: {
      '0xFirstAddress': 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
  },
};
const mockStore = (state = defaultState) => configureStore(middleware)(state);

describe('Actions', () => {
  let background;

  const currentChainId = '0x5';

  let originalNavigator;

  beforeEach(async () => {
    // Save original navigator for restoring after tests
    originalNavigator = global.navigator;

    background = {
      messengerCall: sinon.stub().resolves(),
      getStatePatches: sinon.stub().resolves([]),
      setDataCollectionForMarketing: sinon.stub().resolves(),
    };

    // Make sure navigator.hid is defined for WebHID tests
    if (!global.navigator) {
      global.navigator = {};
    }

    if (!global.navigator.hid) {
      global.navigator.hid = {
        requestDevice: sinon.stub(),
      };
    }
  });

  afterEach(() => {
    // Restore original window.navigator after each test
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });

    sinon.restore();
  });

  describe('createAndBackupSeedPhrase', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should create KeyChain, vault and Backup in the background', async () => {
      const mockSeedPhrase = 'mock seed phrase';
      const mockSerializedSeedPhrase =
        toSerializedSeedPhraseBuffer(mockSeedPhrase);
      const store = mockStore();

      const createNewVaultAndGetSeedPhraseStub = sinon
        .stub()
        .resolves(mockSerializedSeedPhrase);

      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs(
          'LegacyBackgroundApiService:createSeedPhraseBackup',
          sinon.match.array,
        )
        .resolves();
      background.messengerCall = messengerCallStub;
      messengerCallStub
        .withArgs('LegacyBackgroundApiService:createNewVaultAndGetSeedPhrase', [
          'password',
        ])
        .callsFake(createNewVaultAndGetSeedPhraseStub);
      Object.assign(background, {
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background);

      await store.dispatch(actions.createNewVaultAndSyncWithSocial('password'));

      expect(createNewVaultAndGetSeedPhraseStub.callCount).toStrictEqual(1);
      expect(
        messengerCallStub.calledWithExactly(
          'LegacyBackgroundApiService:createSeedPhraseBackup',
          ['password', mockSerializedSeedPhrase.data, mockUlid],
        ),
      ).toBe(true);
    });
  });

  describe('#restoreSocialBackupAndGetSeedPhrase', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('returns the seed phrase and syncs marketing consent', async () => {
      const store = mockStore();
      const mnemonic = 'seed phrase';
      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs(
          'LegacyBackgroundApiService:restoreSocialBackupAndGetSeedPhrase',
          ['password'],
        )
        .resolves(mnemonic);
      messengerCallStub
        .withArgs('OAuthService:getMarketingConsent', [])
        .resolves(true);
      background.setDataCollectionForMarketing = sinon.stub().resolves();

      setBackgroundConnection({
        ...background,
        getStatePatches: background.getStatePatches,
        setDataCollectionForMarketing: background.setDataCollectionForMarketing,
        messengerCall: messengerCallStub,
      });

      const result = await store.dispatch(
        actions.restoreSocialBackupAndGetSeedPhrase('password'),
      );

      expect(result).toStrictEqual(mnemonic);
      expect(
        messengerCallStub.firstCall.calledWithExactly(
          'LegacyBackgroundApiService:restoreSocialBackupAndGetSeedPhrase',
          ['password'],
        ),
      ).toBe(true);
      expect(
        messengerCallStub.calledWithExactly(
          'OAuthService:getMarketingConsent',
          [],
        ),
      ).toBe(true);
      expect(
        background.setDataCollectionForMarketing.calledOnceWith(true),
      ).toStrictEqual(true);
      expect(background.getStatePatches.calledOnce).toStrictEqual(true);
      expect(store.getActions()).toStrictEqual([
        {
          type: actionConstants.SET_DATA_COLLECTION_FOR_MARKETING,
          value: true,
        },
      ]);
    });

    it('tracks the onboarding analytics preference event when a tracking function is provided', async () => {
      const store = mockStore();
      const trackEventStub = sinon.stub().resolves();
      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs(
          'LegacyBackgroundApiService:restoreSocialBackupAndGetSeedPhrase',
          ['password'],
        )
        .resolves('seed phrase');
      messengerCallStub
        .withArgs('OAuthService:getMarketingConsent', [])
        .resolves(false);

      background.setDataCollectionForMarketing = sinon.stub().resolves();

      setBackgroundConnection({
        ...background,
        getStatePatches: background.getStatePatches,
        setDataCollectionForMarketing: background.setDataCollectionForMarketing,
        messengerCall: messengerCallStub,
      });

      await store.dispatch(
        actions.restoreSocialBackupAndGetSeedPhrase('password', trackEventStub),
      );

      expect(
        messengerCallStub.calledWithExactly(
          'LegacyBackgroundApiService:restoreSocialBackupAndGetSeedPhrase',
          ['password'],
        ),
      ).toBe(true);
      expect(
        messengerCallStub.calledWithExactly(
          'OAuthService:getMarketingConsent',
          [],
        ),
      ).toBe(true);
      expect(
        trackEventStub.calledOnceWith({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.AnalyticsPreferenceSelected,
          properties: {
            [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
            [MetaMetricsUserTrait.HasMarketingConsent]: false,
            location: 'onboarding_social_login_rehydration',
          },
        }),
      ).toStrictEqual(true);
    });

    it('throws an error when restoring the social backup fails', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:restoreSocialBackupAndGetSeedPhrase',
          ['password'],
        )
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await expect(
        store.dispatch(actions.restoreSocialBackupAndGetSeedPhrase('password')),
      ).rejects.toThrow('error');
    });
  });

  describe('#changePassword', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should change the password for both seedless onboarding and keyring controller', async () => {
      const store = mockStore({
        metamask: {
          ...defaultState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      const oldPassword = 'old-password';
      const newPassword = 'new-password';

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:changePassword', [
          newPassword,
          oldPassword,
        ])
        .resolves();

      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.changePassword(newPassword, oldPassword));

      expect(messengerCallStub.calledOnce).toBe(true);
    });
  });

  describe('#checkIsSeedlessPasswordOutdated', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should return true if the password is outdated', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: true, captureSentryError: true }],
        )
        .resolves(true);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(),
      );
      expect(result).toStrictEqual(true);
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: true, captureSentryError: true }],
        ),
      ).toBe(true);
    });

    it('should return false if the password is not outdated', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: true, captureSentryError: true }],
        )
        .resolves(false);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(),
      );
      expect(result).toStrictEqual(false);
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: true, captureSentryError: true }],
        ),
      ).toBe(true);
    });

    it('passes skipCache and captureSentryError to the background check', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: false, captureSentryError: false }],
        )
        .resolves(true);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(false, false),
      );

      expect(result).toStrictEqual(true);
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: false, captureSentryError: false }],
        ),
      ).toBe(true);
    });

    it('should not throw an error if the checkIsSeedlessPasswordOutdated fails', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: true, captureSentryError: true }],
        )
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const result = await store.dispatch(
        actions.checkIsSeedlessPasswordOutdated(),
      );
      expect(result).toStrictEqual(false);
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          [{ skipCache: true, captureSentryError: true }],
        ),
      ).toBe(true);
    });
  });

  describe('#tryUnlockMetamask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls syncPasswordAndUnlockWallet', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
          sinon.match.array,
        )
        .resolves(true);
      Object.assign(background, { getStatePatches: sinon.stub().resolves([]) });

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.tryUnlockMetamask());

      expect(
        background.messengerCall.withArgs(
          'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
          sinon.match.array,
        ).callCount,
      ).toStrictEqual(1);

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors on syncPasswordAndUnlockWallet will fail', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
          sinon.match.array,
        )
        .rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.tryUnlockMetamask('test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('encodeSeedPhraseForBackground', () => {
    it('encodes a seed phrase as UTF-8 byte values', () => {
      const seedPhrase = 'abandon abandon abandon';

      expect(actions.encodeSeedPhraseForBackground(seedPhrase)).toStrictEqual(
        Array.from(stringToBytes(seedPhrase)),
      );
    });
  });

  describe('decodeSeedPhraseFromBackground', () => {
    const seedPhrase = 'abandon abandon abandon';

    it('decodes a JSON-serialized Buffer from the background', () => {
      expect(
        actions.decodeSeedPhraseFromBackground(
          toSerializedSeedPhraseBuffer(seedPhrase),
        ),
      ).toStrictEqual(seedPhrase);
    });

    it('decodes a Uint8Array from the background', () => {
      expect(
        actions.decodeSeedPhraseFromBackground(
          new Uint8Array(actions.encodeSeedPhraseForBackground(seedPhrase)),
        ),
      ).toStrictEqual(seedPhrase);
    });
  });

  describe('#createNewVaultAndGetSeedPhrase', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createNewVaultAndGetSeedPhrase in a single background request', async () => {
      const store = mockStore();
      const mockSeedPhrase = 'test seed phrase';
      const mockSerializedSeedPhrase =
        toSerializedSeedPhraseBuffer(mockSeedPhrase);

      const createNewVaultAndGetSeedPhraseStub = sinon
        .stub()
        .resolves(mockSerializedSeedPhrase);
      setBackgroundConnection({
        messengerCall: createNewVaultAndGetSeedPhraseStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const seedPhrase = await store.dispatch(
        actions.createNewVaultAndGetSeedPhrase('password'),
      );

      expect(
        createNewVaultAndGetSeedPhraseStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:createNewVaultAndGetSeedPhrase',
          ['password'],
        ),
      ).toBe(true);
      expect(seedPhrase).toStrictEqual(mockSeedPhrase);
    });
  });

  describe('#unlockAndGetSeedPhrase', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls unlockAndGetSeedPhrase in a single background request', async () => {
      const store = mockStore();
      const mockSeedPhrase = 'test seed phrase';
      const mockSerializedSeedPhrase =
        toSerializedSeedPhraseBuffer(mockSeedPhrase);

      const unlockAndGetSeedPhraseStub = sinon
        .stub()
        .resolves(mockSerializedSeedPhrase);
      setBackgroundConnection({
        messengerCall: unlockAndGetSeedPhraseStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const seedPhrase = await store.dispatch(
        actions.unlockAndGetSeedPhrase('password'),
      );

      expect(
        unlockAndGetSeedPhraseStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:unlockAndGetSeedPhrase',
          ['password'],
        ),
      ).toBe(true);
      expect(seedPhrase).toStrictEqual(mockSeedPhrase);
    });
  });

  describe('#createNewVaultAndRestore', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createNewVaultAndRestore', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.createNewVaultAndRestore('password', 'test'),
      );
      expect(
        messengerCallStub.calledWithExactly(
          'LegacyBackgroundApiService:createNewVaultAndRestore',
          ['password', actions.encodeSeedPhraseForBackground('test')],
        ),
      ).toBe(true);
    });

    it('calls the expected actions', async () => {
      const store = mockStore();

      setBackgroundConnection({
        messengerCall: sinon.stub().resolves(),
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'SHOW_ACCOUNTS_PAGE' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.createNewVaultAndRestore('password', 'test'),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors when callback in createNewVaultAndRestore throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs('LegacyBackgroundApiService:createNewVaultAndRestore', [
          'password',
          actions.encodeSeedPhraseForBackground('test'),
        ])
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.createNewVaultAndRestore('password', 'test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#requestRevealSeedWords', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls verifyPassword in background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs('KeyringController:verifyPassword', sinon.match.array)
        .resolves();
      const getSeedPhraseStub = sinon
        .stub()
        .resolves(toSerializedSeedPhraseBuffer('test'));
      messengerCallStub
        .withArgs('LegacyBackgroundApiService:getSeedPhrase', [
          undefined,
          undefined,
        ])
        .callsFake(getSeedPhraseStub);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      await store.dispatch(actions.requestRevealSeedWords());
      expect(
        messengerCallStub.calledWithExactly(
          'KeyringController:verifyPassword',
          [undefined],
        ),
      ).toBe(true);
      expect(
        getSeedPhraseStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:getSeedPhrase',
          [undefined, undefined],
        ),
      ).toBe(true);
    });

    it('hides loading indicator and rethrows when callback in background errors', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs('KeyringController:verifyPassword', sinon.match.array)
        .resolves();
      const getSeedPhraseStub = sinon.stub().rejects(new Error('error'));
      messengerCallStub
        .withArgs('LegacyBackgroundApiService:getSeedPhrase', [
          undefined,
          undefined,
        ])
        .callsFake(getSeedPhraseStub);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.requestRevealSeedWords()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#removeAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeAccount in background and expect actions to show account', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:removeAccount', sinon.match.array)
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'HIDE_LOADING_INDICATION',
        'SHOW_ACCOUNTS_PAGE',
      ];

      await store.dispatch(
        actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'),
      );
      expect(messengerCallStub.calledOnce).toBe(true);
      const actionTypes = store.getActions().map((action) => action.type);
      expect(actionTypes).toStrictEqual(expectedActions);
    });

    it('hides loading indicator and rethrows when removeAccount callback errors', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:removeAccount', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'),
        ),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#resetAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('resets account', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:resetAccount', sinon.match.array)
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'SHOW_ACCOUNTS_PAGE' },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.resetAccount());
      expect(messengerCallStub.calledOnce).toBe(true);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('throws if resetAccount throws', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:resetAccount', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.resetAccount())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#importNewAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls importAccountWithStrategies in background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:importAccountWithStrategy',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.importNewAccount(
          'Private Key',
          ['c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'],
          '',
        ),
      );
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('hides loading indicator and rethrows when importAccount in background callback errors', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:importAccountWithStrategy',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: undefined,
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.importNewAccount())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#checkHardwareStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls checkHardwareStatus in background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:checkHardwareStatus',
          sinon.match.array,
        )
        .resolves();

      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.checkHardwareStatus(
          HardwareDeviceNames.ledger,
          `m/44'/60'/0'/0`,
        ),
      );
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('hides loading indicator and rethrows on error', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:checkHardwareStatus',
          sinon.match.array,
        )
        .rejects(new Error('error'));

      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.checkHardwareStatus()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#updateAndApproveTx QR account', () => {
    const qrAccountAddress = '0xQrAddress';
    const qrAccountId = 'b3f1a0c2-7d4e-4f6a-9b8c-1d2e3f4a5b6c';
    const txMeta = {
      id: 'tx-1',
      txParams: { from: qrAccountAddress, to: '0xTo', value: '0x0' },
    };

    const getQrAccountState = () => ({
      ...defaultState,
      metamask: {
        ...defaultState.metamask,
        internalAccounts: {
          ...defaultState.metamask.internalAccounts,
          accounts: {
            ...defaultState.metamask.internalAccounts.accounts,
            [qrAccountId]: {
              address: qrAccountAddress,
              id: qrAccountId,
              metadata: {
                name: 'Keystone',
                keyring: { type: 'QR Hardware Wallet Device' },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
          },
        },
        accountIdByAddress: {
          ...defaultState.metamask.accountIdByAddress,
          [qrAccountAddress]: qrAccountId,
        },
      },
    });

    const getLoadingActionTypes = (store) =>
      store
        .getActions()
        .map(({ type }) => type)
        .filter(
          (type) =>
            type === 'SHOW_LOADING_INDICATION' ||
            type === 'HIDE_LOADING_INDICATION',
        );

    afterEach(() => {
      sinon.restore();
    });

    it('does not show the loading indicator for a hardware wallet when dontShowLoadingIndicator is true', async () => {
      const store = mockStore(getQrAccountState());
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:approveHardwareWalletTransaction',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.updateAndApproveTx(txMeta, true, ''));

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(getLoadingActionTypes(store)).toStrictEqual([
        'HIDE_LOADING_INDICATION',
      ]);
    });

    it('shows the loading indicator for a hardware wallet when dontShowLoadingIndicator is false', async () => {
      const store = mockStore(getQrAccountState());

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:approveHardwareWalletTransaction',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.updateAndApproveTx(
          txMeta,
          false,
          'Confirm with your hardware wallet',
        ),
      );

      expect(store.getActions()).toContainEqual({
        type: 'SHOW_LOADING_INDICATION',
        payload: 'Confirm with your hardware wallet',
      });
      expect(getLoadingActionTypes(store)).toStrictEqual([
        'SHOW_LOADING_INDICATION',
        'HIDE_LOADING_INDICATION',
      ]);
    });

    it('does not show the loading indicator for a software account when dontShowLoadingIndicator is true', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs(
          'LegacyBackgroundApiService:resolvePendingApproval',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.updateAndApproveTx(
          {
            ...txMeta,
            txParams: { ...txMeta.txParams, from: '0xFirstAddress' },
          },
          true,
          '',
        ),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(getLoadingActionTypes(store)).toStrictEqual([
        'HIDE_LOADING_INDICATION',
      ]);
    });
  });

  describe('#getLedgerAppConfiguration', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls getLedgerAppConfiguration in background', async () => {
      const mockConfiguration = {
        arbitraryDataEnabled: 1,
        erc20ProvisioningNecessary: 0,
        starkEnabled: 0,
        starkv2Supported: 0,
        version: '1.0.0',
      };

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getLedgerAppConfiguration', [])
        .resolves(mockConfiguration);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const result = await actions.getLedgerAppConfiguration();

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(result).toStrictEqual(mockConfiguration);
    });
  });

  describe('#getAppNameAndVersion', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls getAppNameAndVersion in background', async () => {
      const mockResponse = { appName: 'Ethereum', version: '1.10.4' };

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getAppNameAndVersion', [])
        .resolves(mockResponse);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const result = await actions.getAppNameAndVersion();

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(result).toStrictEqual(mockResponse);
    });
  });

  describe('#getLedgerPublicKey', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls getLedgerPublicKey in background with hdPath', async () => {
      const mockResponse = {
        publicKey: '0x1234',
        address: '0xabcd',
        chainCode: '0x5678',
      };
      const hdPath = "m/44'/60'/0'/0/0";

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getLedgerPublicKey', [hdPath])
        .resolves(mockResponse);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const result = await actions.getLedgerPublicKey(hdPath);

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(result).toStrictEqual(mockResponse);
    });
  });

  describe('#getLedgerMode', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls getLedgerMode in background and returns the active handler mode', async () => {
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getLedgerMode', [])
        .resolves('dmk');
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const result = await actions.getLedgerMode();

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(result).toStrictEqual('dmk');
    });
  });

  describe('#forgetDevice', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls forgetDevice in background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:forgetDevice', sinon.match.array)
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.forgetDevice(HardwareDeviceNames.ledger));
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('hides loading indicator and rethrows on error', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:forgetDevice', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.forgetDevice())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#connectHardware', () => {
    const translateHardwareMessage = (key, substitutions = []) =>
      key === 'hardwareWalletLookingForDevice'
        ? enLocale.hardwareWalletLookingForDevice.message.replace(
            '$1',
            substitutions[0],
          )
        : `translated_${key}`;

    afterEach(() => {
      sinon.restore();
    });

    it('calls connectHardware in background', async () => {
      const store = mockStore();
      const page = 0;
      const hdPath = `m/44'/60'/0'/0`;

      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.ledger,
          page,
          hdPath,
          false,
          translateHardwareMessage,
        ),
      );
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:connectHardware',
          [HardwareDeviceNames.ledger, page, hdPath],
        ),
      ).toBe(true);
    });

    it('hides loading indicator and rethrows on error', async () => {
      const store = mockStore();
      const page = 0;
      const hdPath = `m/44'/60'/0'/0`;

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.ledger,
            page,
            hdPath,
            false,
            translateHardwareMessage,
          ),
        ),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles WebHID connection when loadHid=true for Ledger devices', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockHidDevice = { vendorId: 11415 };
      const mockRequestDevice = sinon.stub().resolves([mockHidDevice]);

      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .resolves([{ address: '0xLedgerAddress' }]);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const accounts = await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.ledger,
          0,
          `m/44'/60'/0'/0`,
          true,
          translateHardwareMessage,
        ),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(mockRequestDevice.callCount).toStrictEqual(1);
      expect(accounts).toStrictEqual([{ address: '0xLedgerAddress' }]);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('throws a specific error when user denies WebHID permissions with loadHid=true', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockRequestDevice = sinon.stub();
      mockRequestDevice.resolves([]);
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      setBackgroundConnection(background);

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.ledger,
            0,
            `m/44'/60'/0'/0`,
            true,
            translateHardwareMessage,
          ),
        ),
      ).rejects.toThrow('translated_ledgerWebHIDNotConnectedErrorMessage');

      expect(mockRequestDevice.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    // Added for coverage requirement.
    it('skips the WebHID device picker during E2E test runs', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const originalInTest = process.env.IN_TEST;
      const originalJestWorkerId = process.env.JEST_WORKER_ID;
      process.env.IN_TEST = 'true';
      process.env.JEST_WORKER_ID = 'undefined';

      const mockRequestDevice = sinon.stub();
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      try {
        const messengerCallStub = sinon
          .stub()
          .withArgs(
            'LegacyBackgroundApiService:connectHardware',
            sinon.match.array,
          )
          .resolves([{ address: '0xLedgerAddress' }]);
        setBackgroundConnection({
          messengerCall: messengerCallStub,
          getStatePatches: sinon.stub().resolves([]),
        });

        const accounts = await store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.ledger,
            0,
            `m/44'/60'/0'/0`,
            true,
            translateHardwareMessage,
          ),
        );

        // E2E runs bypass the picker entirely and proceed to the background.
        expect(mockRequestDevice.callCount).toStrictEqual(0);
        expect(messengerCallStub.calledOnce).toBe(true);
        expect(accounts).toStrictEqual([{ address: '0xLedgerAddress' }]);
      } finally {
        if (originalInTest === undefined) {
          delete process.env.IN_TEST;
        } else {
          process.env.IN_TEST = originalInTest;
        }
        if (originalJestWorkerId === undefined) {
          delete process.env.JEST_WORKER_ID;
        } else {
          process.env.JEST_WORKER_ID = originalJestWorkerId;
        }
      }
    });

    it('translates Trezor Suite Desktop missing errors during connect', async () => {
      const store = mockStore();
      const page = 0;
      const hdPath = `m/44'/60'/0'/0`;

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .rejects(
          Object.assign(new Error('Desktop_ConnectionMissing'), {
            code: 'Desktop_ConnectionMissing',
          }),
        );
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Trezor...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.trezor,
            page,
            hdPath,
            false,
            translateHardwareMessage,
          ),
        ),
      ).rejects.toThrow('translated_trezorDesktopAppRequiredError');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles loadHid=false and skips WebHID request process', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockRequestDevice = sinon.spy();
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .resolves([{ address: '0xLedgerAddress' }]);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const accounts = await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.ledger,
          0,
          `m/44'/60'/0'/0`,
          false,
          translateHardwareMessage,
        ),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(mockRequestDevice.callCount).toStrictEqual(0);
      expect(accounts).toStrictEqual([{ address: '0xLedgerAddress' }]);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles specific Ledger WebHID device open failure error', async () => {
      const store = mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          ledgerTransportType: 'webhid',
        },
      });

      const mockHidDevice = { vendorId: 11415 };
      const mockRequestDevice = sinon.stub();
      mockRequestDevice.resolves([mockHidDevice]);
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const deviceOpenError = new Error('Failed to open the device');
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .rejects(deviceOpenError);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Ledger...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.connectHardware(
            HardwareDeviceNames.ledger,
            0,
            `m/44'/60'/0'/0`,
            true,
            translateHardwareMessage,
          ),
        ),
      ).rejects.toThrow('translated_ledgerDeviceOpenFailureMessage');

      expect(mockRequestDevice.callCount).toStrictEqual(1);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('handles non-Ledger hardware devices', async () => {
      const store = mockStore();

      const mockRequestDevice = sinon.spy();
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          hid: {
            requestDevice: mockRequestDevice,
          },
        },
        writable: true,
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:connectHardware',
          sinon.match.array,
        )
        .resolves([{ address: '0xTrezorAddress' }]);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        {
          type: 'SHOW_LOADING_INDICATION',
          payload: 'Looking for your Trezor...',
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      const accounts = await store.dispatch(
        actions.connectHardware(
          HardwareDeviceNames.trezor,
          0,
          `m/44'/60'/0'/0`,
          true,
          translateHardwareMessage,
        ),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(mockRequestDevice.callCount).toStrictEqual(0);
      expect(accounts).toStrictEqual([{ address: '0xTrezorAddress' }]);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#unlockHardwareWalletAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls unlockHardwareWalletAccount in background', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:unlockHardwareWalletAccount',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.unlockHardwareWalletAccounts(
          [0],
          HardwareDeviceNames.ledger,
          `m/44'/60'/0'/0`,
          '',
        ),
      );
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('forwards a null hd path to the background handler', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:unlockHardwareWalletAccount',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.unlockHardwareWalletAccounts(
          [0],
          HardwareDeviceNames.trezor,
          null,
          '',
        ),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:unlockHardwareWalletAccount',
          [0, HardwareDeviceNames.trezor, null, ''],
        ),
      ).toBe(true);
    });

    it('shows loading indicator', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:unlockHardwareWalletAccount',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.unlockHardwareWalletAccounts([null])),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setCurrentCurrency', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setCurrentCurrency', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:setCurrentCurrency', ['jpy'])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.setCurrentCurrency('jpy'));
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('throws if setCurrentCurrency throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:setCurrentCurrency',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setCurrentCurrency());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setWatchEthereumAccountEnabled', () => {
    it('calls background setWatchEthereumAccountEnabled with value', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.setWatchEthereumAccountEnabled(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setWatchEthereumAccountEnabled',
          [true],
        ),
      ).toBe(true);

      await store.dispatch(actions.setWatchEthereumAccountEnabled(false));
      expect(
        messengerCallStub.secondCall.calledWithExactly(
          'PreferencesController:setWatchEthereumAccountEnabled',
          [false],
        ),
      ).toBe(true);
    });
  });

  describe('#setAddSnapAccountEnabled', () => {
    if (typeof actions.setAddSnapAccountEnabled !== 'function') {
      it.todo('setAddSnapAccountEnabled not available in this build');
      return;
    }

    it('calls background setAddSnapAccountEnabled with value', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.setAddSnapAccountEnabled(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setAddSnapAccountEnabled',
          [true],
        ),
      ).toBe(true);

      await store.dispatch(actions.setAddSnapAccountEnabled(false));
      expect(
        messengerCallStub.secondCall.calledWithExactly(
          'PreferencesController:setAddSnapAccountEnabled',
          [false],
        ),
      ).toBe(true);
    });
  });

  describe('#updateAndApproveTx hardware wallet signing', () => {
    const LEDGER_ADDRESS = '0x2222222222222222222222222222222222222222';
    const txMeta = {
      id: 'pay-tx',
      chainId: CHAIN_IDS.MAINNET,
      status: TransactionStatus.unapproved,
      txParams: { from: LEDGER_ADDRESS },
    };

    function createLedgerStore(transactionData = {}) {
      return mockStore({
        ...defaultState,
        metamask: {
          ...defaultState.metamask,
          internalAccounts: {
            ...defaultState.metamask.internalAccounts,
            accounts: {
              ...defaultState.metamask.internalAccounts.accounts,
              'ledger-account': {
                address: LEDGER_ADDRESS,
                id: 'ledger-account',
                metadata: { keyring: { type: KeyringTypes.ledger } },
              },
            },
          },
          accountIdByAddress: {
            ...defaultState.metamask.accountIdByAddress,
            [LEDGER_ADDRESS]: 'ledger-account',
          },
          transactionData,
        },
      });
    }

    beforeEach(() => {
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:approveHardwareWalletTransaction',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });
      jest
        .mocked(listenForHardwareSigningCompletion)
        .mockReset()
        .mockResolvedValue(async () => undefined);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('hides the loading indication once a hardware wallet signs the Pay funding transactions', async () => {
      const store = createLedgerStore({ [txMeta.id]: { quotes: [{}, {}] } });

      await store.dispatch(
        actions.updateAndApproveTx(txMeta, false, 'Confirm on device'),
      );

      expect(listenForHardwareSigningCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'pay-tx',
          expectedQuoteCount: 2,
        }),
      );

      const [{ onComplete }] = jest.mocked(listenForHardwareSigningCompletion)
        .mock.calls[0];
      store.clearActions();
      onComplete();

      expect(store.getActions()).toStrictEqual([
        { type: actionConstants.HIDE_LOADING },
      ]);
    });

    it('does not wait for funding signatures when the transaction has no Pay quotes', async () => {
      const store = createLedgerStore();

      await store.dispatch(
        actions.updateAndApproveTx(txMeta, false, 'Confirm on device'),
      );

      expect(listenForHardwareSigningCompletion).not.toHaveBeenCalled();
    });
  });

  describe('#updateTransaction', () => {
    const txParams = {
      from: '0x1',
      gas: GAS_LIMITS.SIMPLE,
      gasPrice: '0x3b9aca00',
      to: '0x2',
      value: '0x0',
    };

    const txData = {
      id: '1',
      status: TransactionStatus.unapproved,
      chainId: currentChainId,
      txParams,
    };

    afterEach(() => {
      sinon.restore();
    });

    it('updates transaction', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs('TransactionController:updateTransaction', sinon.match.array)
        .resolves();
      Object.assign(background, { getStatePatches: sinon.stub().resolves([]) });

      setBackgroundConnection(background);

      await store.dispatch(actions.updateTransaction(txData));

      const resultantActions = store.getActions();
      expect(
        background.messengerCall.withArgs(
          'TransactionController:updateTransaction',
          sinon.match.array,
        ).callCount,
      ).toStrictEqual(1);
      expect(resultantActions[1]).toStrictEqual({
        type: 'UPDATE_TRANSACTION_PARAMS',
        id: txData.id,
        value: txParams,
      });
    });

    it('rejects with error message', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('TransactionController:updateTransaction', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        {
          type: 'UPDATE_TRANSACTION_PARAMS',
          id: '1',
          value: {
            from: '0x1',
            gas: GAS_LIMITS.SIMPLE,
            gasPrice: '0x3b9aca00',
            to: '0x2',
            value: '0x0',
          },
        },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'GO_HOME' },
      ];

      await expect(
        store.dispatch(actions.updateTransaction(txData)),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#lockMetamask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setLocked', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:setLocked', [])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.lockMetamask());
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('hides loading indicator and dispatches lock action when background callback errors', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:setLocked', [])
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'LOCK_METAMASK' },
      ];

      await store.dispatch(actions.lockMetamask());

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setSelectedAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('#setSelectedAccount', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          alertEnabledness: {},
          internalAccounts: {
            accounts: {
              'mock-id': {
                address: '0x123',
                id: 'mock-id',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [
                  'personal_sign',
                  'eth_signTransaction',
                  'eth_signTypedData_v1',
                  'eth_signTypedData_v3',
                  'eth_signTypedData_v4',
                ],
                scopes: ['eip155:0'],
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-id',
          },
          accountIdByAddress: { '0x123': 'mock-id' },
        },
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:setSelectedInternalAccount', [
          'mock-id',
        ])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.setSelectedAccount('0x123'));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:setSelectedInternalAccount',
          ['mock-id'],
        ),
      ).toBe(true);
    });

    it('hides loading indicator if setSelectedAccount throws', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          alertEnabledness: {},
          internalAccounts: {
            accounts: {
              'mock-id': {
                address: '0x123',
                id: 'mock-id',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [
                  'personal_sign',
                  'eth_signTransaction',
                  'eth_signTypedData_v1',
                  'eth_signTypedData_v3',
                  'eth_signTypedData_v4',
                ],
                scopes: ['eip155:0'],
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-id',
          },
          accountIdByAddress: { '0x123': 'mock-id' },
        },
      });

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:setSelectedInternalAccount',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setSelectedAccount('0x123'));
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setSelectedMultichainAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('#setSelectedMultichainAccount', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          accountTree: {},
        },
      });

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.setSelectedMultichainAccount(
          'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
        ),
      );
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AccountTreeController:setSelectedAccountGroup',
          ['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default'],
        ),
      ).toBe(true);
    });

    it('handles gracefully when setSelectedMultichainAccount throws', async () => {
      const store = mockStore({
        activeTab: {},
        metamask: {
          alertEnabledness: {},
          accountTree: {},
        },
      });

      const messengerCallStub = sinon.stub().rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.setSelectedMultichainAccount(
          'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
        ),
      );
      // No fullscreen loading indication — pending UI is owned by useTransition
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#createNextMultichainAccountGroup', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createNextMultichainAccountGroup in background', () => {
      const store = mockStore();
      const walletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
      const walletIdWithoutPrefix = stripWalletTypePrefixFromWalletId(walletId);
      const messengerCallStub = sinon
        .stub()
        .withArgs('MultichainAccountService:createNextMultichainAccountGroup', [
          sinon.match({ entropySource: walletIdWithoutPrefix }),
        ])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      store.dispatch(actions.createNextMultichainAccountGroup(walletId));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'MultichainAccountService:createNextMultichainAccountGroup',
          [{ entropySource: walletIdWithoutPrefix }],
        ),
      ).toBe(true);
    });
  });

  describe('#setAccountGroupName', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setAccountGroupName in background with correct parameters', async () => {
      const store = mockStore();
      const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
      const newAccountName = 'New Account Name';
      const messengerCallStub = sinon
        .stub()
        .withArgs('AccountTreeController:setAccountGroupName', [
          accountGroupId,
          newAccountName,
        ])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.setAccountGroupName(accountGroupId, newAccountName),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'AccountTreeController:setAccountGroupName',
          [accountGroupId, newAccountName],
        ),
      ).toBe(true);
    });

    it('returns false when the background call fails', async () => {
      const store = mockStore();
      const accountGroupId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
      const newAccountName = 'New Account Name';
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'AccountTreeController:setAccountGroupName',
          sinon.match.array,
        )
        .rejects(new Error('Failed to set account name'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const result = await store.dispatch(
        actions.setAccountGroupName(accountGroupId, newAccountName),
      );

      expect(result).toStrictEqual(false);
    });
  });

  describe('#addToken', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls addToken in background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.addToken({
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          networkClientId: 'networkClientId1',
        }),
      );
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:addToken',
          [
            {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
              image: undefined,
              networkClientId: 'networkClientId1',
            },
          ],
        ),
      ).toBe(true);
    });

    it('expected actions', async () => {
      const store = mockStore();

      const tokenDetails = {
        address: 'tokenAddress',
        symbol: 'token',
        decimal: 18,
      };

      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:addToken', sinon.match.array)
        .resolves(tokenDetails);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.addToken({
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          networkClientId: 'networkClientId1',
        }),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#ignoreTokens', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls ignoreTokens in background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('TokensController:ignoreTokens', [
          { tokensToIgnore: '0x0000001' },
          undefined,
        ])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.ignoreTokens({ tokensToIgnore: '0x0000001' }),
      );
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('hides loading indicator when ignoreTokens in background fails', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('TokensController:ignoreTokens', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.ignoreTokens({ tokensToIgnore: '0x0000001' }),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#hideAsset', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls hideAsset in background with the assetId', async () => {
      const store = mockStore();
      const assetId =
        'eip155:1:erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:hideAsset', [assetId])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.hideAsset(assetId));

      expect(messengerCallStub.calledOnce).toBe(true);
      const actionTypes = store.getActions().map((action) => action.type);
      expect(actionTypes).toContain('HIDE_LOADING_INDICATION');
    });

    it('hides loading indicator when hideAsset in background fails', async () => {
      const store = mockStore();
      const assetId =
        'eip155:1:erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const error = new Error('Failed to hide asset');

      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:hideAsset', [assetId])
        .rejects(error);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.hideAsset(assetId));

      const dispatchedActions = store.getActions();
      expect(dispatchedActions.map((a) => a.type)).toContain(
        'HIDE_LOADING_INDICATION',
      );
    });
  });

  describe('#addCustomAsset', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls addCustomAsset in background with accountId and assetId', async () => {
      const store = mockStore();
      const accountId = '11e8977e-3dcd-4751-871f-2b438c839179';
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:addCustomAsset', [accountId, assetId])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.addCustomAsset(accountId, assetId));

      expect(messengerCallStub.calledOnce).toBe(true);
      const actionTypes = store.getActions().map((action) => action.type);
      expect(actionTypes).toContain('HIDE_LOADING_INDICATION');
    });

    it('hides loading indicator when addCustomAsset in background fails', async () => {
      const store = mockStore();
      const accountId = '11e8977e-3dcd-4751-871f-2b438c839179';
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const error = new Error('Failed to add custom asset');

      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:addCustomAsset', [accountId, assetId])
        .rejects(error);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.addCustomAsset(accountId, assetId));

      const dispatchedActions = store.getActions();
      expect(dispatchedActions.map((a) => a.type)).toContain(
        'HIDE_LOADING_INDICATION',
      );
    });
  });

  describe('#unhideAsset', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls unhideAsset in background with the assetId', async () => {
      const store = mockStore();
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:unhideAsset', [assetId])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.unhideAsset(assetId));

      expect(messengerCallStub.calledOnce).toBe(true);
      const actionTypes = store.getActions().map((action) => action.type);
      expect(actionTypes).toContain('HIDE_LOADING_INDICATION');
    });

    it('hides loading indicator when unhideAsset in background fails', async () => {
      const store = mockStore();
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const error = new Error('Failed to unhide asset');

      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:unhideAsset', [assetId])
        .rejects(error);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.unhideAsset(assetId));

      const dispatchedActions = store.getActions();
      expect(dispatchedActions.map((a) => a.type)).toContain(
        'HIDE_LOADING_INDICATION',
      );
    });
  });

  describe('#removeCustomAsset', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeCustomAsset in background with accountId and assetId', async () => {
      const store = mockStore();
      const accountId = '11e8977e-3dcd-4751-871f-2b438c839179';
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:removeCustomAsset', [accountId, assetId])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.removeCustomAsset(accountId, assetId));

      expect(messengerCallStub.calledOnce).toBe(true);
      const actionTypes = store.getActions().map((action) => action.type);
      expect(actionTypes).toContain('HIDE_LOADING_INDICATION');
    });

    it('hides loading indicator when removeCustomAsset in background fails', async () => {
      const store = mockStore();
      const accountId = '11e8977e-3dcd-4751-871f-2b438c839179';
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const error = new Error('Failed to remove custom asset');

      const messengerCallStub = sinon
        .stub()
        .withArgs('AssetsController:removeCustomAsset', [accountId, assetId])
        .rejects(error);
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.removeCustomAsset(accountId, assetId));

      const dispatchedActions = store.getActions();
      expect(dispatchedActions.map((a) => a.type)).toContain(
        'HIDE_LOADING_INDICATION',
      );
    });
  });

  describe('#importCustomAssetsBatch', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('sends all background requests then performs a single state refresh', async () => {
      const store = mockStore();
      const accountId = '11e8977e-3dcd-4751-871f-2b438c839179';
      background.messengerCall
        .withArgs('AssetsController:unhideAsset', sinon.match.array)
        .resolves();
      background.messengerCall
        .withArgs('AssetsController:addCustomAsset', sinon.match.array)
        .resolves();
      Object.assign(background, { getStatePatches: sinon.stub().resolves([]) });
      setBackgroundConnection(background);

      await store.dispatch(
        actions.importCustomAssetsBatch(accountId, [
          {
            assetId: 'eip155:1/erc20:0xaaa',
            isHidden: true,
          },
          {
            assetId: 'eip155:1/erc20:0xbbb',
            isHidden: false,
          },
          {
            assetId: 'eip155:1/erc20:0xccc',
            isHidden: true,
          },
        ]),
      );

      expect(
        background.messengerCall.withArgs(
          'AssetsController:unhideAsset',
          sinon.match.array,
        ).calledTwice,
      ).toBe(true);
      expect(background.messengerCall.firstCall.args).toStrictEqual([
        'AssetsController:unhideAsset',
        ['eip155:1/erc20:0xaaa'],
      ]);
      expect(background.messengerCall.thirdCall.args).toStrictEqual([
        'AssetsController:unhideAsset',
        ['eip155:1/erc20:0xccc'],
      ]);
      expect(
        background.messengerCall.withArgs(
          'AssetsController:addCustomAsset',
          sinon.match.array,
        ).calledOnce,
      ).toBe(true);
      expect(background.messengerCall.secondCall.args).toStrictEqual([
        'AssetsController:addCustomAsset',
        [accountId, 'eip155:1/erc20:0xbbb', undefined],
      ]);

      const actionTypes = store.getActions().map((a) => a.type);
      const hideCount = actionTypes.filter(
        (t) => t === 'HIDE_LOADING_INDICATION',
      ).length;
      expect(hideCount).toBe(1);
    });

    it('hides loading indicator when a background call fails but continues processing', async () => {
      const store = mockStore();
      const accountId = '11e8977e-3dcd-4751-871f-2b438c839179';
      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs('AssetsController:unhideAsset', ['eip155:1/erc20:0xaaa'])
        .rejects(new Error('unhide failed'));
      messengerCallStub
        .withArgs('AssetsController:addCustomAsset', sinon.match.array)
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.importCustomAssetsBatch(accountId, [
          {
            assetId: 'eip155:1/erc20:0xaaa',
            isHidden: true,
          },
          {
            assetId: 'eip155:1/erc20:0xbbb',
            isHidden: false,
          },
        ]),
      );

      expect(
        messengerCallStub.calledWithExactly('AssetsController:addCustomAsset', [
          accountId,
          'eip155:1/erc20:0xbbb',
          undefined,
        ]),
      ).toBe(true);
      const dispatchedActions = store.getActions();
      expect(dispatchedActions.map((a) => a.type)).toContain(
        'HIDE_LOADING_INDICATION',
      );
    });
  });

  describe('#setActiveNetwork', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setActiveNetwork in the background with the correct arguments', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.setActiveNetwork('networkConfigurationId'));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'MultichainNetworkController:setActiveNetwork',
          ['networkConfigurationId'],
        ),
      ).toBe(true);
    });

    it('handles error when setActiveNetwork throws', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await expect(
        store.dispatch(actions.setActiveNetwork()),
      ).resolves.not.toThrow();
    });
  });

  describe('updateNetwork', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls updateNetwork in the background with the correct arguments', async () => {
      const store = mockStore();

      const networkConfiguration = {
        rpcUrl: 'newRpc',
        chainId: '0x',
        nativeCurrency: 'ETH',
        name: 'nickname',
        rpcEndpoints: [{ blockExplorerUrl: 'etherscan.io' }],
      };
      const messengerCallStub = sinon
        .stub()
        .withArgs('NetworkController:updateNetwork', sinon.match.array)
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.updateNetwork(networkConfiguration, {
          source: MetaMetricsNetworkEventSource.CustomNetworkForm,
        }),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'NetworkController:updateNetwork',
          [
            '0x',
            {
              rpcUrl: 'newRpc',
              chainId: '0x',
              nativeCurrency: 'ETH',
              name: 'nickname',
              rpcEndpoints: [{ blockExplorerUrl: 'etherscan.io' }],
            },
            { source: MetaMetricsNetworkEventSource.CustomNetworkForm },
          ],
        ),
      ).toBe(true);
    });

    it('updateNetwork has empty object for default options', async () => {
      const store = mockStore();

      const networkConfiguration = {
        id: 'networkConfigurationId',
        rpcUrl: 'newRpc',
        chainId: '0x',
        ticker: 'ETH',
        nickname: 'nickname',
        rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
      };
      const messengerCallStub = sinon
        .stub()
        .withArgs('NetworkController:updateNetwork', sinon.match.array)
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.updateNetwork(networkConfiguration, undefined),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'NetworkController:updateNetwork',
          [
            '0x',
            {
              id: 'networkConfigurationId',
              rpcUrl: 'newRpc',
              chainId: '0x',
              ticker: 'ETH',
              nickname: 'nickname',
              rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
            },
            {},
          ],
        ),
      ).toBe(true);
    });
  });

  describe('#requestUserApproval', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls requestUserApproval in the background with the correct arguments', async () => {
      const store = mockStore();

      const networkConfiguration = {
        rpcUrl: 'newRpc',
        chainId: '0x',
        ticker: 'ETH',
        nickname: 'nickname',
        rpcPrefs: { blockExplorerUrl: 'etherscan.io' },
      };
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.requestUserApproval({
          origin: ORIGIN_METAMASK,
          type: 'test',
          requestData: networkConfiguration,
        }),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'ApprovalController:addAndShowApprovalRequest',
          [
            {
              origin: ORIGIN_METAMASK,
              type: 'test',
              requestData: networkConfiguration,
            },
          ],
        ),
      ).toBe(true);
    });
  });

  describe('removeNetwork', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeNetwork in the background with the correct arguments', async () => {
      const store = mockStore();
      const removeNetworkStub = sinon.stub().resolves();
      setBackgroundConnection({ removeNetwork: removeNetworkStub });

      await store.dispatch(actions.removeNetwork('testNetworkConfigurationId'));

      expect(
        removeNetworkStub.calledOnceWithExactly('testNetworkConfigurationId'),
      ).toBe(true);
    });
  });

  describe('refreshAssetsForSelectedAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    const mockAccount = {
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      address: '0xFirstAddress',
      metadata: {
        name: 'Test Account',
        keyring: { type: 'HD Key Tree' },
      },
      options: {},
      methods: [],
      type: EthAccountType.Eoa,
    };

    it('calls getAssets in the background with accounts and options', async () => {
      const store = mockStore();
      const accounts = [mockAccount];
      const options = {
        chainIds: ['eip155:5', 'eip155:1'],
        assetTypes: ['token'],
      };
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getAssets', [accounts, options])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.refreshAssetsForSelectedAccount(accounts, options),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('calls getAssets with default options when options omitted', async () => {
      const store = mockStore();
      const accounts = [mockAccount];
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getAssets', [accounts, {}])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.refreshAssetsForSelectedAccount(accounts));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:getAssets',
          [accounts, {}],
        ),
      ).toBe(true);
    });

    it('calls getAssets with empty accounts array', async () => {
      const store = mockStore();
      const accounts = [];
      const options = { chainIds: ['eip155:5'] };
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getAssets', [accounts, options])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.refreshAssetsForSelectedAccount(accounts, options),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('does not throw when getAssets rejects', async () => {
      const store = mockStore();
      const error = new Error('Background getAssets failed');
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:getAssets', sinon.match.array)
        .rejects(error);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await expect(
        store.dispatch(
          actions.refreshAssetsForSelectedAccount([mockAccount], {}),
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('#setSelectedNetworkConfigurationId', () => {
    it('sets appState.networkConfigurationId to provided value', async () => {
      const store = mockStore();

      const networkConfigurationId = 'testNetworkConfigurationId';

      store.dispatch(
        actions.setSelectedNetworkConfigurationId(networkConfigurationId),
      );

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'SET_SELECTED_NETWORK_CONFIGURATION_ID',
        payload: networkConfigurationId,
      });
    });
  });

  describe('#setNewNetworkAdded', () => {
    it('sets appState.setNewNetworkAdded to provided value', async () => {
      const store = mockStore();

      const newNetworkAddedDetails = {
        networkConfigurationId: 'testNetworkConfigurationId',
        nickname: 'test-chain',
      };

      store.dispatch(actions.setNewNetworkAdded(newNetworkAddedDetails));

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'SET_NEW_NETWORK_ADDED',
        payload: newNetworkAddedDetails,
      });
    });
  });

  describe('#setEditedNetwork', () => {
    it('sets appState.setEditedNetwork to provided value', async () => {
      const store = mockStore();

      const newNetworkAddedDetails = {
        nickname: 'test-chain',
        networkConfigurationId: 'testNetworkConfigurationId',
        editCompleted: true,
      };

      store.dispatch(actions.setEditedNetwork(newNetworkAddedDetails));

      const resultantActions = store.getActions();

      expect(resultantActions[0]).toStrictEqual({
        type: 'SET_EDIT_NETWORK',
        payload: newNetworkAddedDetails,
      });
    });
  });

  describe('#addToAddressBook', () => {
    it('calls setAddressBook', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();

      Object.assign(background, {
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      setBackgroundConnection(background);

      await store.dispatch(actions.addToAddressBook('0x0000'));
      expect(
        messengerCallStub.calledOnceWithExactly('AddressBookController:set', [
          '0x0000',
          '',
          CHAIN_IDS.MAINNET,
          '',
        ]),
      ).toBe(true);
      sinon.restore();
    });
  });

  describe('#exportAccount', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('returns expected actions for successful action', async () => {
      const store = mockStore();
      const testPrivKey = 'a-test-priv-key';
      const setPrivateKeyStub = jest.fn();
      const setShowHoldToReveal = jest.fn();
      background.messengerCall
        .withArgs('KeyringController:verifyPassword', sinon.match.array)
        .resolves();
      background.messengerCall
        .withArgs('LegacyBackgroundApiService:exportAccount', sinon.match.array)
        .resolves(testPrivKey);
      setBackgroundConnection(background);
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(
        actions.exportAccount(
          'a-test-password',
          '0xAddress',
          setPrivateKeyStub,
          setShowHoldToReveal,
        ),
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
      expect(setPrivateKeyStub).toHaveBeenCalledWith(testPrivKey);
      expect(setShowHoldToReveal).toHaveBeenCalledWith(true);
    });

    it('returns invalidPassword error when password validation fails', async () => {
      const store = mockStore();
      background.messengerCall
        .withArgs('KeyringController:verifyPassword', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection(background);
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.exportAccount('a-test-password', '0xAddress')),
      ).resolves.toStrictEqual({ error: 'invalidPassword' });

      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('throws when account export fails', async () => {
      const store = mockStore();
      background.messengerCall
        .withArgs('KeyringController:verifyPassword', sinon.match.array)
        .resolves();
      background.messengerCall
        .withArgs('LegacyBackgroundApiService:exportAccount', sinon.match.array)
        .rejects(new Error('error'));
      setBackgroundConnection(background);
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.exportAccount('a-test-password', '0xAddress')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setAccountLabel', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setAccountLabel', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:setAccountLabel',
          sinon.match.array,
        )
        .resolves();

      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.setAccountLabel(
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          'test',
        ),
      );
      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:setAccountLabel',
          ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc', 'test'],
        ),
      ).toBe(true);
    });

    it('returns action errors when func callback errors', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:setAccountLabel',
          sinon.match.array,
        )
        .rejects(new Error('error'));

      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(
          actions.setAccountLabel(
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            'test',
          ),
        ),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setFeatureFlag', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setFeatureFlag in the background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves({});

      background.messengerCall = messengerCallStub;

      setBackgroundConnection(background);

      await store.dispatch(actions.setFeatureFlag());
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setFeatureFlag',
          [undefined, undefined],
        ),
      ).toBe(true);
    });

    it('errors when setFeatureFlag in background throws', async () => {
      const store = mockStore();

      background.messengerCall = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection(background);

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(store.dispatch(actions.setFeatureFlag())).rejects.toThrow(
        'error',
      );

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setCompletedOnboarding', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('completes onboarding', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs('OnboardingController:completeOnboarding', sinon.match.array)
        .resolves();

      setBackgroundConnection(background);

      await store.dispatch(actions.setCompletedOnboarding());
      expect(
        background.messengerCall.withArgs(
          'OnboardingController:completeOnboarding',
          sinon.match.array,
        ).callCount,
      ).toStrictEqual(1);
    });

    it('errors when setCompletedOnboarding in background throws', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs('OnboardingController:completeOnboarding', [])
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await expect(
        store.dispatch(actions.setCompletedOnboarding()),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setParticipateInMetaMetrics', () => {
    it('calls background with true when opting in', async () => {
      const store = mockStore();
      const setParticipateInMetaMetricsStub = jest.fn().mockResolvedValue();

      Object.assign(background, {
        setParticipateInMetaMetrics: setParticipateInMetaMetricsStub,
      });

      setBackgroundConnection(background);

      await store.dispatch(actions.setParticipateInMetaMetrics(true));
      expect(setParticipateInMetaMetricsStub).toHaveBeenCalledWith(true);
    });
  });

  describe('#setMusdConversionEducationSeen', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setMusdConversionEducationSeen in background with value', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();

      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.setMusdConversionEducationSeen(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:setMusdConversionEducationSeen',
          [true],
        ),
      ).toBe(true);
    });

    it('calls setMusdConversionEducationSeen in background with false', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();

      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      await store.dispatch(actions.setMusdConversionEducationSeen(false));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:setMusdConversionEducationSeen',
          [false],
        ),
      ).toBe(true);
    });
  });

  describe('#addMusdConversionDismissedCtaKey', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls addMusdConversionDismissedCtaKey in background with key', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();

      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      await store.dispatch(
        actions.addMusdConversionDismissedCtaKey('0x1-0xabc123'),
      );
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:addMusdConversionDismissedCtaKey',
          ['0x1-0xabc123'],
        ),
      ).toBe(true);
    });
  });

  describe('#setUsePhishDetect', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUsePhishDetect in background', () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves('ltr');
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      store.dispatch(actions.setUsePhishDetect(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setUsePhishDetect',
          [true],
        ),
      ).toBe(true);
    });

    it('errors when setUsePhishDetect in background throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setUsePhishDetect());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUseMultiAccountBalanceChecker', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseMultiAccountBalanceChecker in background', () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      store.dispatch(actions.setUseMultiAccountBalanceChecker(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setUseMultiAccountBalanceChecker',
          [true],
        ),
      ).toBe(true);
    });

    it('errors when setUseMultiAccountBalanceChecker in background throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setUseMultiAccountBalanceChecker());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUse4ByteResolution', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUse4ByteResolution in background', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      await store.dispatch(actions.setUse4ByteResolution(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setUse4ByteResolution',
          [true],
        ),
      ).toBe(true);
    });

    it('errors when setUse4ByteResolution in background throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setUse4ByteResolution());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#setUseSafeChainsListValidation', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setUseSafeChainsListValidation in background', () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      store.dispatch(actions.setUseSafeChainsListValidation(true));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setUseSafeChainsListValidation',
          [true],
        ),
      ).toBe(true);
    });

    it('errors when setUseSafeChainsListValidation in background throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().rejects(new Error('error'));

      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.setUseSafeChainsListValidation());
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#updateCurrentLocale', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').resolves({
        json: async () => enLocale,
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('calls expected actions', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves('ltr');
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        {
          type: 'SET_CURRENT_LOCALE',
          payload: { locale: 'test', messages: enLocale },
        },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.updateCurrentLocale('test'));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:setCurrentLocale',
          ['test'],
        ),
      ).toBe(true);
      expect(store.getActions()).toStrictEqual(expectedActions);
    });

    it('errors when setCurrentLocale throws', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().rejects(new Error('error'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
      });

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.updateCurrentLocale('test'));

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#markPasswordForgotten', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls markPasswordForgotten', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'LegacyBackgroundApiService:markPasswordForgotten',
          sinon.match.array,
        )
        .resolves();
      Object.assign(background, { getStatePatches: sinon.stub().resolves([]) });

      setBackgroundConnection(background);

      await store.dispatch(actions.markPasswordForgotten());

      expect(
        background.messengerCall.withArgs(
          'LegacyBackgroundApiService:markPasswordForgotten',
          sinon.match.array,
        ).callCount,
      ).toStrictEqual(1);
    });

    it('errors when markPasswordForgotten throws', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'LegacyBackgroundApiService:markPasswordForgotten',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      Object.assign(background, { getStatePatches: sinon.stub().resolves([]) });

      setBackgroundConnection(background);

      const expectedActions = [{ type: 'HIDE_LOADING_INDICATION' }];

      await expect(
        store.dispatch(actions.markPasswordForgotten('test')),
      ).rejects.toThrow('error');

      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#unMarkPasswordForgotten', () => {
    it('calls unMarkPasswordForgotten', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:unMarkPasswordForgotten',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.unMarkPasswordForgotten());

      expect(messengerCallStub.calledOnce).toBe(true);
    });
  });

  describe('#cancelTx', () => {
    it('creates COMPLETED_TX with the cancelled transaction ID', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:rejectPendingApproval',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const txId = 1457634084250832;

      await store.dispatch(actions.cancelTx({ id: txId }));
      const resultantActions = store.getActions();
      const expectedAction = resultantActions.find(
        (action) => action.type === 'COMPLETED_TX',
      );

      expect(expectedAction.value.id).toStrictEqual(txId);
    });
  });

  describe('abortTransactionSigning', () => {
    it('submits request to background', async () => {
      const transactionIdMock = '123-456';
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('TransactionController:abortTransactionSigning', [
          transactionIdMock,
        ])
        .resolves();

      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.abortTransactionSigning(transactionIdMock));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'TransactionController:abortTransactionSigning',
          [transactionIdMock],
        ),
      ).toBe(true);
    });
  });

  describe('#createCancelTransaction', () => {
    it('rethrows when createCancelTransaction fails', async () => {
      const store = mockStore();
      const txId = '123-456';

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'TransactionController:stopTransaction',
          sinon.match((args) => args[0] === txId),
        )
        .rejects(new Error('Previous transaction is already confirmed'));
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await expect(
        store.dispatch(actions.createCancelTransaction(txId)),
      ).rejects.toThrow('Previous transaction is already confirmed');

      expect(
        messengerCallStub.calledOnceWithExactly(
          'TransactionController:stopTransaction',
          [txId, sinon.match.any, sinon.match.any],
        ),
      ).toBe(true);
    });
  });

  describe('#removeAndIgnoreNft', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should throw when no address found', async () => {
      const store = mockStore();

      await expect(
        store.dispatch(actions.removeAndIgnoreNft(undefined, '55', 'mainnet')),
      ).rejects.toThrow('MetaMask - Cannot ignore NFT without address');
    });

    it('should throw when no tokenId found', async () => {
      const store = mockStore();

      await expect(
        store.dispatch(
          actions.removeAndIgnoreNft('Oxtest', undefined, 'mainnet'),
        ),
      ).rejects.toThrow('MetaMask - Cannot ignore NFT without tokenID');
    });

    it('should throw when removeAndIgnoreNft throws an error', async () => {
      const store = mockStore();
      const error = new Error('remove nft fake error');
      background.removeAndIgnoreNft = sinon.stub().throws(error);

      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.removeAndIgnoreNft('Oxtest', '6', 'mainnet')),
      ).rejects.toThrow(error);
    });
  });

  describe('#startOAuthLogin', () => {
    const oauthLoginResult = {
      authConnection: AuthConnection.Google,
    };
    const parentTraceContext = {
      _name: TraceName.OnboardingSocialLoginAttempt,
    };

    const buildState = ({
      firstTimeFlowType = FirstTimeFlowType.create,
      completedOnboarding = false,
    } = {}) => ({
      ...defaultState,
      metamask: {
        ...defaultState.metamask,
        firstTimeFlowType,
        completedOnboarding,
      },
    });

    function stubBackground({ authenticateError } = {}) {
      const startOAuthLoginStub = sinon.stub().resolves(oauthLoginResult);
      const preloadToprfNodeDetailsStub = sinon.stub().resolves();
      const authenticateStub = authenticateError
        ? sinon.stub().rejects(authenticateError)
        : sinon.stub().resolves({ isNewUser: true });

      Object.assign(background, {
        messengerCall: (actionType, args = []) => {
          switch (actionType) {
            case 'SeedlessOnboardingController:preloadToprfNodeDetails':
              return preloadToprfNodeDetailsStub(...args);
            case 'SeedlessOnboardingController:authenticate':
              return authenticateStub(...args);
            case 'OAuthService:startOAuthLogin':
              return startOAuthLoginStub(...args);
            default:
              throw new Error(`Unknown action type '${actionType}'`);
          }
        },
      });
      setBackgroundConnection(background);

      return {
        startOAuthLoginStub,
        preloadToprfNodeDetailsStub,
        authenticateStub,
      };
    }

    afterEach(() => {
      sinon.restore();
      jest.restoreAllMocks();
    });

    it('authenticates with the parent trace and rehydration tags', async () => {
      const store = mockStore(
        buildState({
          firstTimeFlowType: FirstTimeFlowType.socialImport,
          completedOnboarding: false,
        }),
      );
      const {
        startOAuthLoginStub,
        preloadToprfNodeDetailsStub,
        authenticateStub,
      } = stubBackground();
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const traceTags = {
        provider: AuthConnection.Google,
        is_rehydration: 'true',
      };

      const isNewUser = await store.dispatch(
        actions.startOAuthLogin(
          AuthConnection.Google,
          bufferedTrace,
          bufferedEndTrace,
          undefined,
          parentTraceContext,
        ),
      );

      expect(isNewUser).toBe(true);
      expect(
        startOAuthLoginStub.calledOnceWith(
          AuthConnection.Google,
          parentTraceContext,
        ),
      ).toBe(true);
      expect(preloadToprfNodeDetailsStub.calledOnce).toBe(true);
      expect(authenticateStub.calledOnceWith(oauthLoginResult)).toBe(true);
      expect(bufferedTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        op: TraceOperation.OnboardingSecurityOp,
        tags: traceTags,
        parentContext: parentTraceContext,
      });
      expect(bufferedEndTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        data: { success: true },
      });
      expect(store.getActions()).toStrictEqual([
        { type: actionConstants.SHOW_LOADING, payload: undefined },
        { type: actionConstants.HIDE_LOADING },
      ]);
    });

    it('omits the parent trace when none is supplied', async () => {
      const store = mockStore(buildState());
      const { startOAuthLoginStub } = stubBackground();
      const bufferedTrace = jest.fn();

      await store.dispatch(
        actions.startOAuthLogin(AuthConnection.Apple, bufferedTrace),
      );

      expect(startOAuthLoginStub.calledOnceWith(AuthConnection.Apple)).toBe(
        true,
      );
      expect(bufferedTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        op: TraceOperation.OnboardingSecurityOp,
        tags: {
          provider: AuthConnection.Apple,
          is_rehydration: 'false',
        },
        parentContext: undefined,
      });
    });

    it('tracks a seedless authentication failure and ends both traces', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const store = mockStore({});
      const authenticateError = new Error('seedless auth failed');
      const { authenticateStub } = stubBackground({ authenticateError });
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const trackEvent = jest.fn().mockResolvedValue(undefined);
      const traceTags = {
        provider: AuthConnection.Google,
        is_rehydration: 'unknown',
      };

      await expect(
        store.dispatch(
          actions.startOAuthLogin(
            AuthConnection.Google,
            bufferedTrace,
            bufferedEndTrace,
            trackEvent,
            parentTraceContext,
          ),
        ),
      ).rejects.toThrow('seedless auth failed');

      expect(authenticateStub.calledOnce).toBe(true);
      expect(trackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.SocialLoginFailed,
        category: MetaMetricsEventCategory.Onboarding,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Default}_${AuthConnection.Google}`,
          is_rehydration: 'unknown',
          failure_type: 'error',
          error_category: 'seedless_auth',
        },
      });
      expect(bufferedTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        op: TraceOperation.OnboardingSecurityOp,
        tags: traceTags,
        parentContext: parentTraceContext,
      });
      expect(bufferedTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticateError,
        op: TraceOperation.OnboardingError,
        tags: traceTags,
        parentContext: parentTraceContext,
      });
      expect(bufferedEndTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticateError,
      });
      expect(bufferedEndTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        data: { success: false },
      });
    });
  });

  describe('#performSignIn', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls performSignIn in the background', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs('AuthenticationController:performSignIn', sinon.match.array)
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.performSignIn());
      expect(
        background.messengerCall.calledOnceWith(
          'AuthenticationController:performSignIn',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#performSignOut', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls performSignOut in the background', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs('AuthenticationController:performSignOut', sinon.match.array)
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.performSignOut());
      expect(
        background.messengerCall.calledOnceWith(
          'AuthenticationController:performSignOut',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#requestProfilePairing', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls requestProfilePairing in the background', async () => {
      const store = mockStore();

      const requestProfilePairingStub = sinon.stub().resolves();

      Object.assign(background, {
        requestProfilePairing: requestProfilePairingStub,
      });
      setBackgroundConnection(background);

      await store.dispatch(actions.requestProfilePairing());
      expect(requestProfilePairingStub.calledOnceWith()).toBe(true);
    });

    it('rethrows when requestProfilePairing fails in the background', async () => {
      const store = mockStore();

      const requestProfilePairingStub = sinon.stub().rejects(new Error('boom'));

      Object.assign(background, {
        requestProfilePairing: requestProfilePairingStub,
      });
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.requestProfilePairing()),
      ).rejects.toThrow('boom');
    });
  });

  describe('#setIsBackupAndSyncFeatureEnabled', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setIsBackupAndSyncFeatureEnabled in the background', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'UserStorageController:setIsBackupAndSyncFeatureEnabled',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(
        actions.setIsBackupAndSyncFeatureEnabled(
          BACKUPANDSYNC_FEATURES.main,
          true,
        ),
      );
      expect(
        background.messengerCall.calledOnceWith(
          'UserStorageController:setIsBackupAndSyncFeatureEnabled',
          [BACKUPANDSYNC_FEATURES.main, true],
        ),
      ).toBe(true);
    });
  });

  describe('#getUserProfileLineage', () => {
    it('calls getUserProfileLineage in the background', async () => {
      const getUserProfileLineageStub = sinon.stub().resolves();

      Object.assign(background, {
        getUserProfileLineage: getUserProfileLineageStub,
      });
      setBackgroundConnection(background);

      await actions.getUserProfileLineage();
      expect(getUserProfileLineageStub.calledOnceWith()).toBe(true);
    });
  });

  describe('#getCustomerServiceToken', () => {
    it('calls AuthenticationController:getCustomerServiceToken through the background messenger', async () => {
      const messengerCallStub = sinon
        .stub()
        .withArgs('AuthenticationController:getCustomerServiceToken', [])
        .resolves('customer-service-token');

      background.messengerCall = messengerCallStub;
      setBackgroundConnection(background);

      const result = await actions.getCustomerServiceToken();
      expect(result).toBe('customer-service-token');
      expect(
        messengerCallStub.calledOnceWith(
          'AuthenticationController:getCustomerServiceToken',
          [],
        ),
      ).toBe(true);
    });

    it('returns undefined when the background messenger call fails', async () => {
      const messengerCallStub = sinon
        .stub()
        .withArgs('AuthenticationController:getCustomerServiceToken', [])
        .rejects(new Error('auth failed'));

      background.messengerCall = messengerCallStub;
      setBackgroundConnection(background);

      const result = await actions.getCustomerServiceToken();
      expect(result).toBeUndefined();
    });

    it('returns undefined when the background messenger call times out', async () => {
      jest.useFakeTimers();

      try {
        const messengerCallStub = sinon
          .stub()
          .withArgs('AuthenticationController:getCustomerServiceToken', [])
          .returns(new Promise(() => undefined));

        background.messengerCall = messengerCallStub;
        setBackgroundConnection(background);

        const resultPromise = actions.getCustomerServiceToken();
        await jest.advanceTimersByTimeAsync(5000);
        const result = await resultPromise;

        expect(result).toBeUndefined();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('#createOnChainTriggers', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createOnChainTriggers in the background', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'NotificationServicesController:createOnChainTriggers',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.createOnChainTriggers());
      expect(
        background.messengerCall.calledOnceWith(
          'NotificationServicesController:createOnChainTriggers',
          [],
        ),
      ).toBe(true);
    });

    it('handles errors when createOnChainTriggers fails', async () => {
      const store = mockStore();
      const error = new Error('Failed to create on-chain triggers');

      background.messengerCall
        .withArgs(
          'NotificationServicesController:createOnChainTriggers',
          sinon.match.array,
        )
        .rejects(error);
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.createOnChainTriggers()),
      ).rejects.toThrow(error);

      const expectedAnswer = [];

      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining(expectedAnswer),
      );
    });
  });

  describe('#disableAccounts', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls disableAccounts in the background', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];

      background.messengerCall
        .withArgs(
          'NotificationServicesController:disableAccounts',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.disableAccounts(accounts));
      expect(
        background.messengerCall.calledOnceWith(
          'NotificationServicesController:disableAccounts',
          [accounts],
        ),
      ).toBe(true);
    });

    it('handles errors when disableAccounts fails', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];
      const error = new Error('Failed to delete on-chain triggers');

      background.messengerCall
        .withArgs(
          'NotificationServicesController:disableAccounts',
          sinon.match.array,
        )
        .rejects(error);
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.disableAccounts(accounts)),
      ).rejects.toThrow(error);
    });
  });

  describe('#enableAccounts', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls enableAccounts in the background with correct parameters', async () => {
      const store = mockStore();
      const accountIds = ['0x789', '0xabc'];

      background.messengerCall
        .withArgs(
          'NotificationServicesController:enableAccounts',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.enableAccounts(accountIds));
      expect(
        background.messengerCall.calledOnceWith(
          'NotificationServicesController:enableAccounts',
          [accountIds],
        ),
      ).toBe(true);
    });

    it('handles errors when enableAccounts fails', async () => {
      const store = mockStore();
      const accountIds = ['0x789', '0xabc'];
      const error = new Error('Failed to update on-chain triggers');

      background.messengerCall
        .withArgs(
          'NotificationServicesController:enableAccounts',
          sinon.match.array,
        )
        .rejects(error);
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.enableAccounts(accountIds)),
      ).rejects.toThrow(error);
    });
  });

  describe('#fetchAndUpdateMetamaskNotifications', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls fetchAndUpdateMetamaskNotifications in the background with correct parameters', async () => {
      const store = mockStore();

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'NotificationServicesController:fetchAndUpdateMetamaskNotifications',
          [undefined],
        )
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.fetchAndUpdateMetamaskNotifications());
      expect(
        messengerCallStub.calledOnceWithExactly(
          'NotificationServicesController:fetchAndUpdateMetamaskNotifications',
          [undefined],
        ),
      ).toBe(true);
    });

    it('handles errors when fetchAndUpdateMetamaskNotifications fails', async () => {
      const store = mockStore();
      const error = new Error('Failed to update on-chain triggers');

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'NotificationServicesController:fetchAndUpdateMetamaskNotifications',
          [undefined],
        )
        .rejects(error);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await expect(
        store.dispatch(actions.fetchAndUpdateMetamaskNotifications()),
      ).rejects.toThrow(error);
    });
  });

  describe('#markMetamaskNotificationsAsRead', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls markMetamaskNotificationsAsRead in the background with correct parameters', async () => {
      const store = mockStore();
      const notifications = [
        {
          id: 'notif1',
          type: TRIGGER_TYPES.ERC20_SENT,
          isRead: true,
        },
        {
          id: 'notif2',
          type: TRIGGER_TYPES.ERC20_SENT,
          isRead: false,
        },
        {
          id: 'notif3',
          type: TRIGGER_TYPES.ERC20_SENT,
          isRead: false,
        },
      ];

      background.messengerCall
        .withArgs(
          'NotificationServicesController:markMetamaskNotificationsAsRead',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(
        actions.markMetamaskNotificationsAsRead(notifications.map((n) => n.id)),
      );
      expect(
        background.messengerCall.calledOnceWith(
          'NotificationServicesController:markMetamaskNotificationsAsRead',
          [notifications.map((n) => n.id)],
        ),
      ).toBe(true);
    });

    it('handles errors when markMetamaskNotificationsAsRead fails', async () => {
      const store = mockStore();
      const notifications = [
        {
          id: 'notif1',
          type: 'FeatureAnnouncement',
          isRead: true,
        },
        {
          id: 'notif2',
          type: 'OnChain',
          isRead: true,
        },
      ];
      const error = new Error('Failed to mark notifications as read');

      background.messengerCall
        .withArgs(
          'NotificationServicesController:markMetamaskNotificationsAsRead',
          sinon.match.array,
        )
        .rejects(new Error('Failed to mark notifications as read'));
      setBackgroundConnection(background);

      await expect(
        store.dispatch(
          actions.markMetamaskNotificationsAsRead(
            notifications.map((n) => n.id),
          ),
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('#setFeatureAnnouncementsEnabled', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setFeatureAnnouncementsEnabled in the background with correct parameters', async () => {
      const store = mockStore();
      const state = true;
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'NotificationServicesController:setFeatureAnnouncementsEnabled',
          [state],
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.setFeatureAnnouncementsEnabled(state));
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('handles errors when setFeatureAnnouncementsEnabled fails', async () => {
      const store = mockStore();
      const state = false;
      const error = new Error(
        'Failed to set feature announcements enabled state',
      );

      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'NotificationServicesController:setFeatureAnnouncementsEnabled',
          [state],
        )
        .rejects(
          new Error('Failed to set feature announcements enabled state'),
        );
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await expect(
        store.dispatch(actions.setFeatureAnnouncementsEnabled(state)),
      ).rejects.toThrow(error);
    });
  });

  describe('#checkAccountsPresence', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('dispatches CHECK_ACCOUNTS_PRESENCE with correct payload when successful', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];

      const messengerCallStub = sinon
        .stub()
        .withArgs('NotificationServicesController:checkAccountsPresence', [
          accounts,
        ])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });
      await store.dispatch(actions.checkAccountsPresence(accounts));
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('throws and logs error when checkAccountsPresence encounters an error', async () => {
      const store = mockStore();
      const accounts = ['0x123', '0x456'];
      const error = new Error('Failed to check accounts presence');

      const messengerCallStub = sinon
        .stub()
        .withArgs('NotificationServicesController:checkAccountsPresence', [
          accounts,
        ])
        .rejects(error);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const expectedActions = [];

      await expect(
        store.dispatch(actions.checkAccountsPresence(accounts)),
      ).rejects.toThrow('Failed to check accounts presence');
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });

  describe('#resetOAuthLoginState', () => {
    it('clears seedless onboarding state through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.resetOAuthLoginState());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SeedlessOnboardingController:clearState',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#getIsSeedlessOnboardingUserAuthenticated', () => {
    it('checks authentication through SeedlessOnboardingController', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('SeedlessOnboardingController:getIsUserAuthenticated', [])
        .resolves(true);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const isAuthenticated = await store.dispatch(
        actions.getIsSeedlessOnboardingUserAuthenticated(),
      );

      expect(isAuthenticated).toBe(true);
      expect(
        messengerCallStub.calledOnceWithExactly(
          'SeedlessOnboardingController:getIsUserAuthenticated',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#getNotificationPreferences', () => {
    it('calls getNotificationPreferences in the background', async () => {
      const store = mockStore();
      const preferences = createMockNotificationPreferences();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'AuthenticatedUserStorageService:getNotificationPreferences',
          [],
        )
        .resolves(preferences);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const result = await store.dispatch(actions.getNotificationPreferences());

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(result).toBe(preferences);
    });
  });

  describe('#putNotificationPreferences', () => {
    it('calls putNotificationPreferences in the background with the extension client type', async () => {
      const store = mockStore();
      const preferences = createMockNotificationPreferences();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'AuthenticatedUserStorageService:putNotificationPreferences',
          [preferences, 'extension'],
        )
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.putNotificationPreferences(preferences));

      expect(messengerCallStub.calledOnce).toBe(true);
    });
  });

  describe('#enableMetamaskNotifications', () => {
    it('calls enableMetamaskNotifications in the background with options', async () => {
      const store = mockStore();
      const options = {
        hasMarketingConsent: true,
        productAnnouncementEnabled: true,
      };
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'NotificationServicesController:enableMetamaskNotifications',
          [options],
        )
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.enableMetamaskNotifications(options));

      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('calls enableMetamaskNotifications in the background without args when options are omitted', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'NotificationServicesController:enableMetamaskNotifications',
          [],
        )
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.enableMetamaskNotifications());

      expect(messengerCallStub.calledOnce).toBe(true);
    });
  });

  describe('#toggleExternalServices', () => {
    it('calls toggleExternalServices', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:toggleExternalServices', [true])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.toggleExternalServices(true));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:toggleExternalServices',
          [true],
        ),
      ).toBe(true);
    });
  });

  describe('#hideMigrationModal', () => {
    it('dismisses the Basic Functionality migration notification', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.hideMigrationModal());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:dismissBasicFunctionalityMigrationNotification',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#hideMigrationToast', () => {
    it('dismisses the Basic Functionality migration notification', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.hideMigrationToast());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:dismissBasicFunctionalityMigrationNotification',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#toggleBasicFunctionality', () => {
    it('calls the background toggleBasicFunctionality action', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.toggleBasicFunctionality(false));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:toggleBasicFunctionality',
          [false],
        ),
      ).toBe(true);
    });
  });

  describe('#enableBasicFunctionality', () => {
    const buildStateForConsolidation = (isConsolidated) => ({
      ...defaultState,
      metamask: {
        ...defaultState.metamask,
        useExternalServices: false,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: isConsolidated,
        },
        preferences: {
          ...defaultState.metamask.preferences,
          isBasicFunctionalityConsolidatedEnabled: isConsolidated,
        },
      },
    });

    it('uses the consolidated toggle when the wallet is consolidated', async () => {
      const store = mockStore(buildStateForConsolidation(true));

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.enableBasicFunctionality());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:toggleBasicFunctionality',
          [true],
        ),
      ).toBe(true);
    });

    it('uses the legacy toggle when the wallet is not consolidated', async () => {
      const store = mockStore(buildStateForConsolidation(false));

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        toggleExternalServices: background.toggleExternalServices,
      });

      await store.dispatch(actions.enableBasicFunctionality());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'LegacyBackgroundApiService:toggleExternalServices',
          [true],
        ),
      ).toBe(true);
    });

    it('reads consolidation state when dispatched, not when created', async () => {
      const unconsolidatedStore = mockStore(buildStateForConsolidation(false));
      const consolidatedStore = mockStore(buildStateForConsolidation(true));

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      // Built while the wallet is unconsolidated, dispatched after
      // consolidation has landed.
      const thunkAction = actions.enableBasicFunctionality();
      unconsolidatedStore.getState();
      await consolidatedStore.dispatch(thunkAction);

      expect(
        messengerCallStub.calledOnceWithExactly(
          'PreferencesController:toggleBasicFunctionality',
          [true],
        ),
      ).toBe(true);
    });
  });

  describe('#createMetaMetricsDataDeletionTask', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls createMetaMetricsDataDeletionTask in background', async () => {
      background.messengerCall
        .withArgs(
          'MetaMetricsDataDeletionController:createMetaMetricsDataDeletionTask',
          sinon.match.array,
        )
        .resolves();

      setBackgroundConnection(background);

      await actions.createMetaMetricsDataDeletionTask();
      expect(
        background.messengerCall.withArgs(
          'MetaMetricsDataDeletionController:createMetaMetricsDataDeletionTask',
          sinon.match.array,
        ).callCount,
      ).toStrictEqual(1);
    });
  });
  describe('#updateDataDeletionTaskStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls updateDataDeletionTaskStatus in background', async () => {
      background.messengerCall
        .withArgs(
          'MetaMetricsDataDeletionController:updateDataDeletionTaskStatus',
          sinon.match.array,
        )
        .resolves();

      setBackgroundConnection(background);

      await actions.updateDataDeletionTaskStatus();
      expect(
        background.messengerCall.withArgs(
          'MetaMetricsDataDeletionController:updateDataDeletionTaskStatus',
          sinon.match.array,
        ).callCount,
      ).toStrictEqual(1);
    });
  });

  describe('syncContactsWithUserStorage', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls syncContactsWithUserStorage in the background', async () => {
      const store = mockStore();

      background.messengerCall
        .withArgs(
          'UserStorageController:syncContactsWithUserStorage',
          sinon.match.array,
        )
        .resolves();
      setBackgroundConnection(background);

      await store.dispatch(actions.syncContactsWithUserStorage());
      expect(
        background.messengerCall.calledOnceWith(
          'UserStorageController:syncContactsWithUserStorage',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('deleteAccountSyncingDataFromUserStorage', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls deleteAccountSyncingDataFromUserStorage in the background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      Object.assign(background, {
        messengerCall: messengerCallStub,
      });
      setBackgroundConnection(background);

      await store.dispatch(actions.deleteAccountSyncingDataFromUserStorage());
      expect(
        messengerCallStub.calledWithExactly(
          'UserStorageController:performDeleteStorageAllFeatureEntries',
          [USER_STORAGE_GROUPS_FEATURE_KEY],
        ),
      ).toBe(true);
      expect(
        messengerCallStub.calledWithExactly(
          'UserStorageController:performDeleteStorageAllFeatureEntries',
          [USER_STORAGE_WALLETS_FEATURE_KEY],
        ),
      ).toBe(true);
    });
  });

  describe('removePermittedChain', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removePermittedChain in the background', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:removePermittedChain', [
          'test.com',
          '0x1',
        ])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.removePermittedChain('test.com', '0x1'));

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('requestAccountsAndChainPermissionsWithId', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls requestAccountsAndChainPermissionsWithId in the background', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:requestAccountsAndChainPermissionsWithId',
          ['test.com'],
        )
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.requestAccountsAndChainPermissionsWithId('test.com'),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('signAndSendSmartTransaction', () => {
    it('signs and submits ordinary fee variants without changing the transaction shape', async () => {
      const store = mockStore();
      const unsignedTransaction = {
        chainId: '0x1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        data: '0x1234',
        gas: '0x7530',
        value: '0x1',
      };
      const signedTransactions = ['0xsigned1', '0xsigned2'];

      const messengerCallStub = sinon.stub();
      messengerCallStub
        .withArgs(
          'TransactionController:approveTransactionsWithSameNonce',
          sinon.match.array,
        )
        .resolves(signedTransactions);
      messengerCallStub
        .withArgs(
          'SmartTransactionsController:submitSignedTransactions',
          sinon.match.array,
        )
        .resolves({ uuid: 'smart-transaction-uuid' });
      setBackgroundConnection({ messengerCall: messengerCallStub });

      const uuid = await store.dispatch(
        actions.signAndSendSmartTransaction({
          unsignedTransaction,
          smartTransactionFees: {
            fees: [
              {
                maxFeePerGas: '100',
                maxPriorityFeePerGas: '2',
                gas: '21000',
                value: '0',
              },
              {
                maxFeePerGas: '200',
                maxPriorityFeePerGas: '3',
                gas: '21000',
                value: '0',
              },
            ],
          },
        }),
      );

      expect(messengerCallStub.firstCall.args).toStrictEqual([
        'TransactionController:approveTransactionsWithSameNonce',
        [
          [
            {
              ...unsignedTransaction,
              maxFeePerGas: '64',
              maxPriorityFeePerGas: '2',
            },
            {
              ...unsignedTransaction,
              maxFeePerGas: 'c8',
              maxPriorityFeePerGas: '3',
            },
          ],
        ],
      ]);
      expect(messengerCallStub.secondCall.args).toStrictEqual([
        'SmartTransactionsController:submitSignedTransactions',
        [
          {
            signedTransactions,
            txParams: unsignedTransaction,
          },
        ],
      ]);
      expect(uuid).toBe('smart-transaction-uuid');
    });
  });

  describe('cancelSmartTransaction', () => {
    it('cancels the Smart Transaction by UUID', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('SmartTransactionsController:cancelSmartTransaction', [
          'uuid-to-cancel',
        ])
        .resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.cancelSmartTransaction('uuid-to-cancel'));

      expect(messengerCallStub.calledOnce).toBe(true);
    });
  });

  describe('setSmartTransactionsRefreshInterval', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls setStatusRefreshInterval in the background with provided interval', async () => {
      const store = mockStore();
      const refreshInterval = 1000;

      const messengerCallStub = sinon
        .stub()
        .withArgs('SmartTransactionsController:setStatusRefreshInterval', [
          refreshInterval,
        ])
        .resolves();
      background = { messengerCall: messengerCallStub };
      setBackgroundConnection(background);

      await store.dispatch(
        actions.setSmartTransactionsRefreshInterval(refreshInterval),
      );

      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('does not call background if refresh interval is undefined', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      background = { messengerCall: messengerCallStub };
      setBackgroundConnection(background);

      await store.dispatch(
        actions.setSmartTransactionsRefreshInterval(undefined),
      );

      expect(messengerCallStub.called).toBe(false);
    });

    it('does not call background if refresh interval is null', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      background = { messengerCall: messengerCallStub };
      setBackgroundConnection(background);

      await store.dispatch(actions.setSmartTransactionsRefreshInterval(null));

      expect(messengerCallStub.called).toBe(false);
    });
  });

  describe('#validateRewardsReferralCode', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background with provided code and returns true', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().resolves(true),
      };
      setBackgroundConnection(background);

      const code = 'ABCDEF';
      const result = await store.dispatch(
        actions.validateRewardsReferralCode(code),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:validateReferralCode',
          [code],
        ),
      ).toBe(true);
      expect(result).toBe(true);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('returns false when background reports invalid code', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().resolves(false),
      };
      setBackgroundConnection(background);

      const code = 'INVALID';
      const result = await store.dispatch(
        actions.validateRewardsReferralCode(code),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:validateReferralCode',
          [code],
        ),
      ).toBe(true);
      expect(result).toBe(false);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background without dispatching actions', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().rejects(new Error('network error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.validateRewardsReferralCode('ABCDEF')),
      ).rejects.toThrow('network error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#getRewardsGeoMetadata', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background and returns metadata', async () => {
      const store = mockStore();

      const metadata = { geoLocation: 'US', optinAllowedForGeo: true };
      background = {
        messengerCall: sinon.stub().resolves(metadata),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(actions.getRewardsGeoMetadata());

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getGeoRewardsMetadata',
          [],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(metadata);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('returns null when background resolves null', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().resolves(null),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(actions.getRewardsGeoMetadata());

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getGeoRewardsMetadata',
          [],
        ),
      ).toBe(true);
      expect(result).toBeNull();
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().rejects(new Error('fetch error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.getRewardsGeoMetadata()),
      ).rejects.toThrow('fetch error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#estimateRewardsPoints', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background with request and returns estimated points', async () => {
      const store = mockStore();

      const request = {
        activityType: 'SWAP',
        account: 'eip155:1:0x0000000000000000000000000000000000000000',
        activityContext: {
          swapContext: {
            srcAsset: {
              id: 'eip155:1/slip44:60',
              amount: '1000000000000000000',
            },
            destAsset: {
              id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              amount: '4500000000',
            },
            feeAsset: { id: 'eip155:1/slip44:60', amount: '5000000000000000' },
          },
        },
      };
      const response = { pointsEstimate: 123, bonusBips: 200 };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.estimateRewardsPoints(request),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:estimatePoints',
          [request],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background', async () => {
      const store = mockStore();
      const request = {
        activityType: 'SWAP',
        account: 'eip155:1:0x0000000000000000000000000000000000000000',
        activityContext: {
          swapContext: {
            srcAsset: {
              id: 'eip155:1/slip44:60',
              amount: '1000000000000000000',
            },
            destAsset: {
              id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              amount: '4500000000',
            },
            feeAsset: { id: 'eip155:1/slip44:60', amount: '5000000000000000' },
          },
        },
      };

      background = {
        messengerCall: sinon.stub().rejects(new Error('estimate error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.estimateRewardsPoints(request)),
      ).rejects.toThrow('estimate error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#rewardsOptIn', () => {
    const mockAccounts = [
      {
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        address: '0xFirstAddress',
        metadata: {
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: ETH_EOA_METHODS,
        type: EthAccountType.Eoa,
      },
    ];

    afterEach(() => {
      sinon.restore();
    });

    it('calls background with referral code and returns subscription id', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().resolves('sub_123'),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.rewardsOptIn({
          accounts: mockAccounts,
          referralCode: 'ABCDEF',
        }),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:optIn',
          [mockAccounts, 'ABCDEF'],
        ),
      ).toBe(true);
      expect(result).toStrictEqual('sub_123');
      expect(store.getActions()).toStrictEqual([]);
    });

    it('calls background without referral code and returns null', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().resolves(null),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.rewardsOptIn({ accounts: mockAccounts }),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:optIn',
          [mockAccounts, undefined],
        ),
      ).toBe(true);
      expect(result).toBeNull();
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().rejects(new Error('opt-in failed')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.rewardsOptIn({ accounts: mockAccounts })),
      ).rejects.toThrow('opt-in failed');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#rewardsIsOptInSupported', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background with account and returns true', async () => {
      const store = mockStore();

      const account = {
        id: 'acc-1',
        address: '0x0000000000000000000000000000000000000001',
        metadata: { name: 'Test Account' },
      };

      background = {
        messengerCall: sinon.stub().resolves(true),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.rewardsIsOptInSupported({ account }),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:isOptInSupported',
          [account],
        ),
      ).toBe(true);
      expect(result).toBe(true);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('calls background with account and returns false', async () => {
      const store = mockStore();

      const account = {
        id: 'acc-2',
        address: '0x0000000000000000000000000000000000000002',
        metadata: { name: 'Second Account' },
      };

      background = {
        messengerCall: sinon.stub().resolves(false),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.rewardsIsOptInSupported({ account }),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:isOptInSupported',
          [account],
        ),
      ).toBe(true);
      expect(result).toBe(false);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background without dispatching actions', async () => {
      const store = mockStore();

      const account = {
        id: 'acc-error',
        address: '0x0000000000000000000000000000000000000003',
        metadata: { name: 'Error Account' },
      };

      background = {
        messengerCall: sinon.stub().rejects(new Error('unsupported')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.rewardsIsOptInSupported({ account })),
      ).rejects.toThrow('unsupported');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#rewardsGetOptInStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background with params and returns status DTO', async () => {
      const store = mockStore();

      const params = {
        addresses: [
          '0xDE37C32E8dbD1CD325B8023a00550a5beA97eF13',
          '0xDE37C32E8dbD1CD325B8023a00550a5beA97eF14',
          '0xDE37C32E8dbD1CD325B8023a00550a5beA97eF15',
        ],
      };

      const response = {
        ois: [true, false, true],
        sids: ['sub_123', null, 'sub_789'],
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.rewardsGetOptInStatus(params),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getOptInStatus',
          [params],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background without dispatching actions', async () => {
      const store = mockStore();

      const params = {
        addresses: ['0x0000000000000000000000000000000000000000'],
      };

      background = {
        messengerCall: sinon.stub().rejects(new Error('status error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.rewardsGetOptInStatus(params)),
      ).rejects.toThrow('status error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#rewardsLinkAccountsToSubscriptionCandidate', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background with accounts and returns link results', async () => {
      const store = mockStore();

      const accounts = [
        {
          id: 'acc-1',
          address: '0x0000000000000000000000000000000000000001',
          metadata: { name: 'Account One' },
        },
        {
          id: 'acc-2',
          address: '0x0000000000000000000000000000000000000002',
          metadata: { name: 'Account Two' },
        },
      ];

      const response = [
        { account: accounts[0], success: true },
        { account: accounts[1], success: false },
      ];

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.rewardsLinkAccountsToSubscriptionCandidate(accounts),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:linkAccountsToSubscriptionCandidate',
          [accounts],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background without dispatching actions', async () => {
      const store = mockStore();

      const accounts = [
        {
          id: 'acc-err',
          address: '0x0000000000000000000000000000000000000003',
          metadata: { name: 'Error Account' },
        },
      ];

      background = {
        messengerCall: sinon.stub().rejects(new Error('link error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(
          actions.rewardsLinkAccountsToSubscriptionCandidate(accounts),
        ),
      ).rejects.toThrow('link error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#getRewardsSeasonStatus', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background with subscriptionId and seasonId and returns season status', async () => {
      const store = mockStore();

      const subscriptionId = 'sub_123';
      const seasonId = 'season_1';

      const seasonTier = {
        id: 'tier1',
        name: 'Tier 1',
        pointsNeeded: 100,
        image: { lightModeUrl: 'light.png', darkModeUrl: 'dark.png' },
        levelNumber: '1',
        rewards: [],
      };

      const response = {
        season: {
          id: seasonId,
          name: 'Season 1',
          startDate: 1,
          endDate: 2,
          tiers: [seasonTier],
          lastFetched: 123456,
        },
        balance: { total: 42, updatedAt: 999 },
        tier: {
          currentTier: seasonTier,
          nextTier: null,
          nextTierPointsNeeded: null,
        },
        lastFetched: 123456,
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.getRewardsSeasonStatus(subscriptionId, seasonId),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getSeasonStatus',
          [subscriptionId, seasonId],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background without dispatching actions', async () => {
      const store = mockStore();

      const subscriptionId = 'sub_err';
      const seasonId = 'season_err';

      background = {
        messengerCall: sinon.stub().rejects(new Error('season status error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(
          actions.getRewardsSeasonStatus(subscriptionId, seasonId),
        ),
      ).rejects.toThrow('season status error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#getRewardsSeasonMetadata', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background without type and returns season metadata', async () => {
      const store = mockStore();

      const response = {
        id: 'season_1',
        name: 'Season 1',
        startDate: 1,
        endDate: 2,
        tiers: [],
        lastFetched: 111,
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(actions.getRewardsSeasonMetadata());

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getSeasonMetadata',
          [],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it("calls background with type 'current' and returns season metadata", async () => {
      const store = mockStore();

      const response = {
        id: 'season_current',
        name: 'Season Current',
        startDate: 10,
        endDate: 20,
        tiers: [],
        lastFetched: 222,
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.getRewardsSeasonMetadata('current'),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getSeasonMetadata',
          ['current'],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it("calls background with type 'next' and returns season metadata", async () => {
      const store = mockStore();

      const response = {
        id: 'season_next',
        name: 'Season Next',
        startDate: 30,
        endDate: 40,
        tiers: [],
        lastFetched: 333,
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.getRewardsSeasonMetadata('next'),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getSeasonMetadata',
          ['next'],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('propagates errors from background without dispatching actions', async () => {
      const store = mockStore();

      background = {
        messengerCall: sinon.stub().rejects(new Error('metadata error')),
      };
      setBackgroundConnection(background);

      await expect(
        store.dispatch(actions.getRewardsSeasonMetadata()),
      ).rejects.toThrow('metadata error');
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('#getRewardsSeasonStatus (edge cases)', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('returns season status when season has no tiers', async () => {
      const store = mockStore();

      const subscriptionId = 'sub_empty_tiers';
      const seasonId = 'season_empty';

      const response = {
        season: {
          id: seasonId,
          name: 'Empty Season',
          startDate: 1,
          endDate: 2,
          tiers: [],
          lastFetched: 333,
        },
        balance: { total: 0, updatedAt: 444 },
        tier: {
          currentTier: {
            id: 'tier0',
            name: 'Tier 0',
            pointsNeeded: 0,
            image: { lightModeUrl: '', darkModeUrl: '' },
            levelNumber: '0',
            rewards: [],
          },
          nextTier: null,
          nextTierPointsNeeded: null,
        },
        lastFetched: 333,
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.getRewardsSeasonStatus(subscriptionId, seasonId),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getSeasonStatus',
          [subscriptionId, seasonId],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });

    it('returns season status when nextTier is present', async () => {
      const store = mockStore();

      const subscriptionId = 'sub_next_tier';
      const seasonId = 'season_next';

      const tier1 = {
        id: 'tier1',
        name: 'Tier 1',
        pointsNeeded: 100,
        image: { lightModeUrl: '', darkModeUrl: '' },
        levelNumber: '1',
        rewards: [],
      };
      const tier2 = {
        id: 'tier2',
        name: 'Tier 2',
        pointsNeeded: 200,
        image: { lightModeUrl: '', darkModeUrl: '' },
        levelNumber: '2',
        rewards: [],
      };

      const response = {
        season: {
          id: seasonId,
          name: 'Season Next',
          startDate: 5,
          endDate: 15,
          tiers: [tier1, tier2],
          lastFetched: 555,
        },
        balance: { total: 150, updatedAt: 666 },
        tier: {
          currentTier: tier1,
          nextTier: tier2,
          nextTierPointsNeeded: 50,
        },
        lastFetched: 555,
      };

      background = {
        messengerCall: sinon.stub().resolves(response),
      };
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.getRewardsSeasonStatus(subscriptionId, seasonId),
      );

      expect(
        background.messengerCall.calledOnceWithExactly(
          'RewardsController:getSeasonStatus',
          [subscriptionId, seasonId],
        ),
      ).toBe(true);
      expect(result).toStrictEqual(response);
      expect(store.getActions()).toStrictEqual([]);
    });
  });

  describe('importMnemonicToVault', () => {
    it('calls importMnemonicToVault in the background', async () => {
      const store = mockStore();
      background.messengerCall
        .withArgs(
          'LegacyBackgroundApiService:importMnemonicToVault',
          sinon.match.array,
        )
        .resolves({});
      setBackgroundConnection(background);

      const mnemonic = 'mock seed';

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', payload: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
      ];

      await store.dispatch(actions.importMnemonicToVault(mnemonic));

      expect(store.getActions()).toStrictEqual(expectedActions);
      expect(
        background.messengerCall.calledOnceWith(
          'LegacyBackgroundApiService:importMnemonicToVault',
          [mnemonic],
        ),
      ).toStrictEqual(true);
    });

    it('returns discovered accounts from background', async () => {
      const store = mockStore();
      const mockResult = {
        newAccountAddress: '9fE6zKgca6K2EEa3yjbcq7zGMusUNqSQeWQNL2YDZ2Yi',
        discoveredAccounts: { bitcoin: 2, solana: 1 },
      };

      background.messengerCall
        .withArgs(
          'LegacyBackgroundApiService:importMnemonicToVault',
          sinon.match.array,
        )
        .resolves(mockResult);
      setBackgroundConnection(background);

      const result = await store.dispatch(
        actions.importMnemonicToVault('mnemonic'),
      );

      expect(result).toStrictEqual(mockResult);
    });
  });

  describe('getTokenStandardAndDetailsByChain', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls getTokenStandardAndDetailsByChain in background', async () => {
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:getTokenStandardAndDetailsByChain',
          sinon.match.array,
        )
        .resolves({});
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.getTokenStandardAndDetailsByChain();
      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('throw error when getTokenStandardAndDetailsByChain in background with error', async () => {
      const messengerCallStub = sinon
        .stub()
        .withArgs(
          'LegacyBackgroundApiService:getTokenStandardAndDetailsByChain',
          sinon.match.array,
        )
        .rejects(new Error('error'));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await expect(actions.getTokenStandardAndDetailsByChain()).rejects.toThrow(
        'error',
      );
    });
  });

  describe('setManageInstitutionalWallets', () => {
    it('calls setManageInstitutionalWallets in the background', async () => {
      const store = mockStore();
      const setManageInstitutionalWalletsStub = sinon.stub().resolves();
      background.messengerCall = setManageInstitutionalWalletsStub;
      setBackgroundConnection(background);

      await store.dispatch(actions.setManageInstitutionalWallets(true));
      expect(
        setManageInstitutionalWalletsStub.calledOnceWithExactly(
          'PreferencesController:setManageInstitutionalWallets',
          [true],
        ),
      ).toBe(true);
    });
  });

  describe('syncSeedPhrases', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should call syncSeedPhrases in the background', async () => {
      const store = mockStore();
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:syncSeedPhrases', [])
        .resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.syncSeedPhrases());

      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('rethrows error', async () => {
      const store = mockStore();
      const errorMessage = 'Failed to sync seed phrases';
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:syncSeedPhrases', [])
        .rejects(new Error(errorMessage));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await expect(store.dispatch(actions.syncSeedPhrases())).rejects.toThrow(
        errorMessage,
      );

      expect(messengerCallStub.calledOnce).toBe(true);
    });

    it('should always hide loading indication even when error occurs', async () => {
      const store = mockStore();
      const errorMessage = 'Network error';
      const messengerCallStub = sinon
        .stub()
        .withArgs('LegacyBackgroundApiService:syncSeedPhrases', [])
        .rejects(new Error(errorMessage));
      setBackgroundConnection({ messengerCall: messengerCallStub });

      try {
        await store.dispatch(actions.syncSeedPhrases());
      } catch (error) {
        // Expected to throw
      }

      expect(messengerCallStub.calledOnce).toBe(true);
    });
  });

  describe('submitSubscriptionUserEvents', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls submitSubscriptionUserEvents in the background', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      Object.assign(background, {
        messengerCall: messengerCallStub,
      });
      setBackgroundConnection(background);

      await store.dispatch(
        actions.submitSubscriptionUserEvents({
          event: SubscriptionUserEvent.ShieldEntryModalViewed,
        }),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SubscriptionController:submitUserEvent',
          [
            {
              event: SubscriptionUserEvent.ShieldEntryModalViewed,
            },
          ],
        ),
      ).toBe(true);
    });

    it('handles error when submitSubscriptionUserEvents fails', async () => {
      const errorMessage = 'Failed to submit subscription user events';
      const store = mockStore();
      const messengerCallStub = sinon.stub().rejects(new Error(errorMessage));
      Object.assign(background, {
        messengerCall: messengerCallStub,
      });
      setBackgroundConnection(background);

      await store.dispatch(
        actions.submitSubscriptionUserEvents({
          event: SubscriptionUserEvent.ShieldEntryModalViewed,
        }),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SubscriptionController:submitUserEvent',
          [
            {
              event: SubscriptionUserEvent.ShieldEntryModalViewed,
            },
          ],
        ),
      ).toBe(true);
    });
  });

  describe('#removeDeferredDeepLink', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls removeDeferredDeepLink in the background', async () => {
      const store = mockStore();

      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.removeDeferredDeepLink());
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:removeDeferredDeepLink',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('#perpsToggleTestnet', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls perpsToggleTestnet in the background', async () => {
      const perpsToggleTestnetStub = sinon.stub().resolves();
      setBackgroundConnection({
        perpsToggleTestnet: perpsToggleTestnetStub,
      });
      await actions.perpsToggleTestnet();
      expect(perpsToggleTestnetStub.calledOnceWithExactly()).toBe(true);
    });
  });

  describe('linkRewardToShieldSubscription', () => {
    it('links rewards to a subscription before refreshing subscriptions', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves([]);
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.linkRewardToShieldSubscription('subscription-id', 100),
      );

      expect(
        messengerCallStub.getCalls().map((call) => call.args),
      ).toStrictEqual([
        [
          'ShieldSubscriptionService:linkRewardToExistingSubscription',
          ['subscription-id', 100],
        ],
        ['SubscriptionController:getSubscriptions', []],
      ]);
    });
  });

  describe('clearSmartTransactionFees', () => {
    it('clears smart transaction fees through the messenger', () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      actions.clearSmartTransactionFees();

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SmartTransactionsController:clearFees',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('fetchSmartTransactionFees', () => {
    it('forwards smart transaction fee parameters through the messenger', async () => {
      const store = mockStore();
      const unsignedTransaction = { from: '0x123', to: '0x456' };
      const approveTransactionParameters = { from: '0x123', data: '0xabc' };
      const messengerCallStub = sinon.stub().resolves({});
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.fetchSmartTransactionFees(
          unsignedTransaction,
          approveTransactionParameters,
        ),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SmartTransactionsController:getFees',
          [unsignedTransaction, approveTransactionParameters],
        ),
      ).toBe(true);
    });
  });

  describe('fetchSmartTransactionsLiveness', () => {
    it('forwards the network when fetching smart transaction availability', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.fetchSmartTransactionsLiveness({
          networkClientId: 'mainnet',
          chainId: '0x1',
        }),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SmartTransactionsController:fetchLiveness',
          [{ networkClientId: 'mainnet', chainId: '0x1' }],
        ),
      ).toBe(true);
    });
  });

  describe('getSubscriptionCryptoApprovalAmount', () => {
    it('forwards approval parameters through the messenger', async () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.getSubscriptionCryptoApprovalAmount({
        price: 'test-price',
      });

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SubscriptionController:getCryptoApproveTransactionParams',
          [{ price: 'test-price' }],
        ),
      ).toBe(true);
    });
  });

  describe('scanUrlForPhishing', () => {
    it('forwards the URL through the messenger, also adding the "reveal-srp" argument', async () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.scanUrlForPhishing('https://example.com');

      expect(
        messengerCallStub.calledOnceWithExactly('PhishingController:scanUrl', [
          'https://example.com',
          RequestSourceFlow.RevealSrp,
        ]),
      ).toBe(true);
    });
  });

  describe('getGasFeeTimeEstimate', () => {
    it('forwards gas fee parameters through the messenger', async () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.getGasFeeTimeEstimate('0x1', '0x2');

      expect(
        messengerCallStub.calledOnceWithExactly(
          'GasFeeController:getTimeEstimate',
          ['0x1', '0x2'],
        ),
      ).toBe(true);
    });
  });

  describe('getCurrentNetworkEIP1559Compatibility', () => {
    it('requests network compatibility through the messenger', async () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.getCurrentNetworkEIP1559Compatibility();

      expect(
        messengerCallStub.calledOnceWithExactly(
          'NetworkController:getEIP1559Compatibility',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('multichainUpdateTransactions', () => {
    it('forwards the account ID through the messenger', async () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.multichainUpdateTransactions('account-id');

      expect(
        messengerCallStub.calledOnceWithExactly(
          'MultichainTransactionsController:updateTransactionsForAccount',
          ['account-id'],
        ),
      ).toBe(true);
    });
  });

  describe('saveClaimDraft', () => {
    it('forwards the claim draft through the messenger', async () => {
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await actions.saveClaimDraft({ id: 'claim-id' });

      expect(
        messengerCallStub.calledOnceWithExactly(
          'ClaimsController:saveOrUpdateClaimDraft',
          [{ id: 'claim-id' }],
        ),
      ).toBe(true);
    });
  });

  describe('getSubscriptionPricing', () => {
    it('requests pricing through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.getSubscriptionPricing());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SubscriptionController:getPricing',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('getSubscriptionBillingPortalUrl', () => {
    it('requests the billing portal URL through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.getSubscriptionBillingPortalUrl());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'SubscriptionController:getBillingPortalUrl',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('getRewardsHasAccountOptedIn', () => {
    it('forwards the account through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(
        actions.getRewardsHasAccountOptedIn('eip155:1:0x123'),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'RewardsController:getHasAccountOptedIn',
          ['eip155:1:0x123'],
        ),
      ).toBe(true);
    });
  });

  describe('getRewardsCandidateSubscriptionId', () => {
    it('requests the candidate subscription ID through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.getRewardsCandidateSubscriptionId());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'RewardsController:getCandidateSubscriptionId',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('disableMetamaskNotifications', () => {
    it('disables notifications through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.disableMetamaskNotifications());

      expect(
        messengerCallStub.calledOnceWithExactly(
          'NotificationServicesController:disableNotificationServices',
          [],
        ),
      ).toBe(true);
    });
  });

  describe('addImportedTokens', () => {
    it('forwards imported tokens through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.addImportedTokens([{ address: '0x123' }], 'mainnet'),
      );

      expect(
        messengerCallStub.calledOnceWithExactly('TokensController:addTokens', [
          [{ address: '0x123' }],
          'mainnet',
        ]),
      ).toBe(true);
    });
  });

  describe('multichainAddAssets', () => {
    it('forwards asset IDs and the account through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.multichainAddAssets(['asset-id'], 'account-id'),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'MultichainAssetsController:addAssets',
          [['asset-id'], 'account-id'],
        ),
      ).toBe(true);
    });
  });

  describe('multichainIgnoreAssets', () => {
    it('forwards ignored asset IDs and the account through the messenger', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(
        actions.multichainIgnoreAssets(['asset-id'], 'account-id'),
      );

      expect(
        messengerCallStub.calledOnceWithExactly(
          'MultichainAssetsController:ignoreAssets',
          [['asset-id'], 'account-id'],
        ),
      ).toBe(true);
    });
  });

  describe('#setPendingRedirectRoute', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls background setPendingRedirectRoute with a route', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      const route = { path: '/shield-plan' };
      await store.dispatch(actions.setPendingRedirectRoute(route));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:setPendingRedirectRoute',
          [route],
        ),
      ).toBe(true);
    });

    it('calls background setPendingRedirectRoute with null', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({
        messengerCall: messengerCallStub,
        getStatePatches: sinon.stub().resolves([]),
      });

      await store.dispatch(actions.setPendingRedirectRoute(null));
      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:setPendingRedirectRoute',
          [null],
        ),
      ).toBe(true);
    });
  });

  describe('#setPna25Acknowledged', () => {
    it('calls setPna25Acknowledged with acknowledged and disableDelay defaulting to false', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.setPna25Acknowledged(true));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:setPna25Acknowledged',
          [true, false],
        ),
      ).toBe(true);
    });

    it('calls setPna25Acknowledged with disableDelay set to true', async () => {
      const store = mockStore();
      const messengerCallStub = sinon.stub().resolves();
      setBackgroundConnection({ messengerCall: messengerCallStub });

      await store.dispatch(actions.setPna25Acknowledged(true, true));

      expect(
        messengerCallStub.calledOnceWithExactly(
          'AppStateController:setPna25Acknowledged',
          [true, true],
        ),
      ).toBe(true);
    });
  });
});
