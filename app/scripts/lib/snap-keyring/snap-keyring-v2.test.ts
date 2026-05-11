import { Messenger } from '@metamask/messenger';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { KeyringType } from '@metamask/keyring-api/v2';
import { SnapKeyring as SnapKeyringV2 } from '@metamask/eth-snap-keyring/v2';
import { KeyringV1Adapter } from '@metamask/keyring-sdk/v2';
import { SnapId } from '@metamask/snaps-sdk';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getRootMessenger } from '../messenger';
import { isSnapPreinstalled } from '../../../../shared/lib/snaps/snaps';
import { getSnapName } from '../../../../shared/lib/accounts/snaps';
import { isFlask } from '../../../../shared/lib/build-types';
import { SnapKeyringV2Impl, snapKeyringBuilderV2 } from './snap-keyring-v2';
import {
  SnapKeyringBuilderAllowActions,
  SnapKeyringBuilderV2Messenger,
} from './types';
import { KeyringMetadata } from '@metamask/keyring-controller';

const mockAddRequest = jest.fn();
const mockStartFlow = jest.fn();
const mockEndFlow = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockGetAccounts = jest.fn();
const mockSnapId = 'local:http://localhost:8080' as SnapId;
const mockSnapName = 'mock-snap';
const mockPersistKeyringHelper = jest.fn();
const mockSetSelectedAccount = jest.fn();
const mockSetAccountName = jest.fn();
const mockRemoveAccountHelper = jest.fn();
const mockTrackEvent = jest.fn();
const mockGetAccountByAddress = jest.fn();
const mockListMultichainAccounts = jest.fn();
const mockLocale = 'en';
const mockPreferencesControllerGetState = jest.fn();
const mockSnapControllerGetSnap = jest.fn();
const mockSnapControllerHandleRequest = jest.fn();
const mockRemoteFeatureFlagsGetStateRequest = jest.fn();

const mockFlowId = '123';
const address = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';
const accountNameSuggestion = 'Suggested Account Name';
const mockAccount = {
  type: EthAccountType.Eoa,
  id: '3afa663e-0600-4d93-868a-61c2e553013b',
  address,
  methods: [],
  scopes: [EthScope.Eoa],
  options: {},
};
const mockInternalAccount = {
  ...mockAccount,
  metadata: {
    snap: {
      enabled: true,
      id: mockSnapId,
      name: mockSnapName,
    },
    name: accountNameSuggestion,
    keyring: {
      type: '',
    },
    importTime: 0,
  },
};

const mockKeyringMetadata: KeyringMetadata = {
  name: 'mock-keyring-name',
  id: 'mock-keyring-id',
};

jest.mock('../../../../shared/lib/snaps/snaps', () => ({
  ...jest.requireActual('../../../../shared/lib/snaps/snaps'),
  isSnapPreinstalled: jest.fn(),
}));

jest.mock('../../../../shared/lib/accounts/snaps', () => ({
  ...jest.requireActual('../../../../shared/lib/accounts/snaps'),
  getSnapName: jest.fn(),
}));

jest.mock('../../../../shared/lib/build-types', () => ({
  ...jest.requireActual('../../../../shared/lib/build-types'),
  isFlask: jest.fn().mockReturnValue(false),
}));

const createControllerMessenger = ({
  account = mockInternalAccount,
}: {
  account?: InternalAccount;
} = {}): SnapKeyringBuilderV2Messenger => {
  const rootMessenger = getRootMessenger();
  const messenger = new Messenger<
    'SnapKeyring',
    SnapKeyringBuilderAllowActions,
    never,
    typeof rootMessenger
  >({
    namespace: 'SnapKeyring',
    parent: rootMessenger,
  });
  rootMessenger.delegate({
    messenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'ApprovalController:startFlow',
      'ApprovalController:endFlow',
      'ApprovalController:showSuccess',
      'ApprovalController:showError',
      'PhishingController:maybeUpdateState',
      'KeyringController:getAccounts',
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:listMultichainAccounts',
      'PreferencesController:getState',
      'SnapController:getSnap',
      'SnapController:handleRequest',
      'RemoteFeatureFlagController:getState',
    ],
  });

  jest.spyOn(messenger, 'call').mockImplementation((...args) => {
    // This mock implementation does not have a nice discriminate union where types/parameters can be correctly inferred

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [actionType, ...params]: any[] = args;

    switch (actionType) {
      case 'ApprovalController:addRequest':
        return mockAddRequest(params);

      case 'ApprovalController:startFlow':
        return mockStartFlow.mockReturnValue({ id: mockFlowId })();

      case 'ApprovalController:endFlow':
        return mockEndFlow.mockReturnValue(true)(params);

      case 'ApprovalController:showSuccess':
        return mockShowSuccess();

      case 'ApprovalController:showError':
        return mockShowError();

      case 'KeyringController:getAccounts':
        return mockGetAccounts.mockResolvedValue([])();

      case 'AccountsController:getAccountByAddress':
        return mockGetAccountByAddress.mockReturnValue(account)(params);

      case 'AccountsController:listMultichainAccounts':
        return mockListMultichainAccounts.mockReturnValue([])();

      case 'AccountsController:setSelectedAccount':
        return mockSetSelectedAccount(params);

      case 'AccountsController:setAccountName':
        return mockSetAccountName.mockReturnValue(null)(params);

      case 'PreferencesController:getState':
        return mockPreferencesControllerGetState.mockReturnValue({
          locale: mockLocale,
        })(params);

      case 'SnapController:getSnap':
        return mockSnapControllerGetSnap.mockReturnValue({
          id: mockSnapId,
          manifest: {
            proposedName: mockSnapName,
          },
        })(params);

      case 'SnapController:handleRequest':
        return mockSnapControllerHandleRequest(params);

      case 'RemoteFeatureFlagController:getState':
        return mockRemoteFeatureFlagsGetStateRequest(params);

      default:
        throw new Error(
          `MOCK_FAIL - unsupported messenger call: ${actionType}`,
        );
    }
  });

  return messenger;
};

const createSnapKeyringBuilderV2 = ({
  snapName = mockSnapName,
  snapPreinstalled = true,
  flask = false,
}: {
  snapName?: string;
  snapPreinstalled?: boolean;
  flask?: boolean;
} = {}) => {
  jest.mocked(isSnapPreinstalled).mockReturnValue(snapPreinstalled);
  jest.mocked(getSnapName).mockReturnValue(snapName);
  jest.mocked(isFlask).mockReturnValue(flask);

  mockRemoteFeatureFlagsGetStateRequest.mockReturnValue({
    remoteFeatureFlags: {},
  } as RemoteFeatureFlagControllerState);

  return snapKeyringBuilderV2(createControllerMessenger(), {
    persistKeyringHelper: mockPersistKeyringHelper,
    removeAccountHelper: mockRemoveAccountHelper,
    trackEvent: mockTrackEvent,
  });
};

describe('SnapKeyringV2Impl', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('assertAccountCanBeUsed', () => {
    it('is a no-op (resolves without throwing or calling the messenger)', async () => {
      const messenger = createControllerMessenger();
      const callSpy = jest.spyOn(messenger, 'call');
      const impl = new SnapKeyringV2Impl(messenger, {
        persistKeyringHelper: mockPersistKeyringHelper,
        removeAccountHelper: mockRemoveAccountHelper,
        trackEvent: mockTrackEvent,
      });

      await expect(
        impl.assertAccountCanBeUsed(mockAccount),
      ).resolves.toBeUndefined();
      expect(callSpy).not.toHaveBeenCalled();
    });
  });
});

describe('snapKeyringBuilderV2', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a builder with the expected shape', () => {
    const builder = createSnapKeyringBuilderV2();

    expect(builder.name).toBe('SnapKeyringBuilderV2');
    expect(builder.state).toBeNull();
    expect(typeof builder.v1Builder).toBe('function');
    expect(typeof builder.v2Builder).toBe('function');
    expect(builder.v1Builder.type).toBe(KeyringType.Snap);
    expect(builder.v2Builder.type).toBe(KeyringType.Snap);
  });

  describe('v1Builder', () => {
    it('creates a KeyringV1Adapter wrapping a SnapKeyringV2 instance', () => {
      const builder = createSnapKeyringBuilderV2();

      const keyring = builder.v1Builder();

      expect(keyring).toBeInstanceOf(KeyringV1Adapter);
      expect((keyring as unknown as KeyringV1Adapter).unwrap()).toBeInstanceOf(
        SnapKeyringV2,
      );
    });

    it('returns a fresh adapter on each call', () => {
      const builder = createSnapKeyringBuilderV2();

      const first = builder.v1Builder();
      const second = builder.v1Builder();

      expect(first).not.toBe(second);
      expect((first as unknown as KeyringV1Adapter).unwrap()).not.toBe(
        (second as unknown as KeyringV1Adapter).unwrap(),
      );
    });
  });

  describe('v2Builder', () => {
    it('unwraps the adapter to return the underlying SnapKeyringV2 instance', () => {
      const builder = createSnapKeyringBuilderV2();

      const adapter = builder.v1Builder();
      const inner = (adapter as unknown as KeyringV1Adapter).unwrap();
      const v2 = builder.v2Builder(adapter, mockKeyringMetadata);

      expect(v2).toBeInstanceOf(SnapKeyringV2);
      expect(v2).toBe(inner);
    });

    it('throws when given a keyring that is not a KeyringV1Adapter', () => {
      const builder = createSnapKeyringBuilderV2();
      const notAnAdapter = {
        type: KeyringType.Snap,
      } as unknown as Parameters<typeof builder.v2Builder>[0];

      expect(() => builder.v2Builder(notAnAdapter, mockKeyringMetadata)).toThrow();
    });
  });
});
