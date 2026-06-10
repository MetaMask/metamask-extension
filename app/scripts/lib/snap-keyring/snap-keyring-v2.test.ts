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
import {
  SnapKeyringV2Impl,
  snapKeyringV2Builder,
  snapKeyringV2AdaptedAsV1Builder,
} from './snap-keyring-v2';
import {
  SnapKeyringBuilderAllowedActions,
  SnapKeyringV2BuilderMessenger,
} from './types';

const mockAddRequest = jest.fn();
const mockStartFlow = jest.fn();
const mockEndFlow = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockGetAccounts = jest.fn();
const mockSnapId = 'local:http://localhost:8080' as SnapId;
const mockSnapName = 'mock-snap';
const mockSetSelectedAccount = jest.fn();
const mockSetAccountName = jest.fn();
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
} = {}): SnapKeyringV2BuilderMessenger => {
  const rootMessenger = getRootMessenger();
  const messenger = new Messenger<
    'SnapKeyring',
    SnapKeyringBuilderAllowedActions,
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

const setupAdapterMocks = ({
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
};

describe('SnapKeyringV2Impl', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('assertAccountCanBeUsed', () => {
    it('is a no-op (resolves without throwing or calling the messenger)', async () => {
      const messenger = createControllerMessenger();
      const callSpy = jest.spyOn(messenger, 'call');
      const impl = new SnapKeyringV2Impl(messenger);

      await expect(
        impl.assertAccountCanBeUsed(mockAccount),
      ).resolves.toBeUndefined();
      expect(callSpy).not.toHaveBeenCalled();
    });
  });
});

describe('snapKeyringV2Builder', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a callable builder with the correct type marker', () => {
    const builder = snapKeyringV2Builder();

    expect(typeof builder).toBe('function');
    expect(builder.type).toBe(KeyringType.Snap);
  });

  it('unwraps a KeyringV1Adapter to return the underlying SnapKeyringV2 instance', () => {
    setupAdapterMocks();
    const v1BuilderFactory = snapKeyringV2AdaptedAsV1Builder(
      createControllerMessenger(),
    );
    const adapter = v1BuilderFactory();
    const inner = (adapter as unknown as KeyringV1Adapter).unwrap();

    const builder = snapKeyringV2Builder();
    const v2 = builder(adapter);

    expect(v2).toBeInstanceOf(SnapKeyringV2);
    expect(v2).toBe(inner);
  });

  it('throws when given a keyring that is not a KeyringV1Adapter', () => {
    const builder = snapKeyringV2Builder();
    const notAnAdapter = {
      type: KeyringType.Snap,
    } as unknown as Parameters<typeof builder>[0];

    expect(() => builder(notAnAdapter)).toThrow();
  });
});
