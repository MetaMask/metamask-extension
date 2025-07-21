import { Messenger } from '@metamask/base-controller';
import {
  EthAccountType,
  EthScope,
  KeyringRpcMethod,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { SnapId } from '@metamask/snaps-sdk';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { isSnapPreinstalled } from '../../../../shared/lib/snaps/snaps';
import { getSnapName } from '../../../../shared/lib/accounts/snaps';
import {
  showAccountCreationDialog,
  showAccountNameSuggestionDialog,
  snapKeyringBuilder,
} from './snap-keyring';
import {
  SnapKeyringBuilderAllowActions,
  SnapKeyringBuilderMessenger,
} from './types';

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
const mockLocale = 'en';
const mockPreferencesControllerGetState = jest.fn();
const mockSnapControllerGet = jest.fn();
const mockSnapControllerHandleRequest = jest.fn();

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

const createControllerMessenger = ({
  account = mockInternalAccount,
}: {
  account?: InternalAccount;
} = {}): SnapKeyringBuilderMessenger => {
  const messenger = new Messenger<
    SnapKeyringBuilderAllowActions,
    never
  >().getRestricted({
    name: 'SnapKeyring',
    allowedActions: [
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
      'PreferencesController:getState',
      'SnapController:get',
      'SnapController:handleRequest',
    ],
    allowedEvents: [],
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

      case 'AccountsController:setSelectedAccount':
        return mockSetSelectedAccount(params);

      case 'AccountsController:setAccountName':
        return mockSetAccountName.mockReturnValue(null)(params);

      case 'PreferencesController:getState':
        return mockPreferencesControllerGetState.mockReturnValue({
          locale: mockLocale,
        })(params);

      case 'SnapController:get':
        return mockSnapControllerGet.mockReturnValue({
          id: mockSnapId,
          manifest: {
            proposedName: mockSnapName,
          },
        })(params);

      case 'SnapController:handleRequest':
        return mockSnapControllerHandleRequest(params);

      default:
        throw new Error(
          `MOCK_FAIL - unsupported messenger call: ${actionType}`,
        );
    }
  });

  return messenger;
};

const createSnapKeyringBuilder = ({
  snapName = mockSnapName,
  snapPreinstalled = true,
}: {
  snapName?: string;
  snapPreinstalled?: boolean;
} = {}) => {
  jest.mocked(isSnapPreinstalled).mockReturnValue(snapPreinstalled);
  jest.mocked(getSnapName).mockReturnValue(snapName);

  return snapKeyringBuilder(createControllerMessenger(), {
    persistKeyringHelper: mockPersistKeyringHelper,
    removeAccountHelper: mockRemoveAccountHelper,
    trackEvent: mockTrackEvent,
  });
};

/**
 * Utility function that waits for all pending promises to be resolved.
 * This is necessary when testing asynchronous execution flows that are
 * initiated by synchronous calls.
 *
 * @returns A promise that resolves when all pending promises are completed.
 */
async function waitForAllPromises(): Promise<void> {
  // Wait for next tick to flush all pending promises. It's requires since
  // we are testing some asynchronous execution flows that are started by
  // synchronous calls.
  await new Promise(process.nextTick);
}

describe('Snap Keyring Methods', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('helpers', () => {
    describe('showAccountCreationDialog', () => {
      it('shows account creation dialog and return true on user confirmation', async () => {
        const controllerMessenger = createControllerMessenger();
        controllerMessenger.call('ApprovalController:startFlow');

        await showAccountCreationDialog(mockSnapId, controllerMessenger);

        expect(mockAddRequest).toHaveBeenCalledTimes(1);
        expect(mockAddRequest).toHaveBeenCalledWith([
          {
            origin: mockSnapId,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
          },
          true,
        ]);
      });
    });

    describe('showAccountNameSuggestionDialog', () => {
      it('shows account name suggestion dialog and return true on user confirmation', async () => {
        const controllerMessenger = createControllerMessenger();
        controllerMessenger.call('ApprovalController:startFlow');

        await showAccountNameSuggestionDialog(
          mockSnapId,
          controllerMessenger,
          accountNameSuggestion,
        );

        expect(mockAddRequest).toHaveBeenCalledTimes(1);
        expect(mockAddRequest).toHaveBeenCalledWith([
          {
            origin: mockSnapId,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
            requestData: {
              snapSuggestedAccountName: accountNameSuggestion,
            },
          },
          true,
        ]);
      });
    });
  });

  describe('addAccount', () => {
    beforeEach(() => {
      mockAddRequest.mockReturnValue(true).mockReturnValue({ success: true });
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('handles account creation with confirmations and without a user defined name', async () => {
      const builder = createSnapKeyringBuilder();
      await builder().handleKeyringSnapMessage(mockSnapId, {
        method: 'notify:accountCreated',
        params: {
          account: mockAccount,
          displayConfirmation: true,
        },
      });

      // 1. Account creation confirmation dialogs (creation + account name suggestion)
      // 2. Account creation summary dialog
      expect(mockStartFlow).toHaveBeenCalledTimes(2);
      // 1. Account creation confirmation dialog
      // 2. Account account name suggestion dialog
      expect(mockAddRequest).toHaveBeenCalledTimes(2);
      expect(mockAddRequest).toHaveBeenNthCalledWith(1, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      ]);
      expect(mockPersistKeyringHelper).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenNthCalledWith(2, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            snapSuggestedAccountName: '',
          },
        },
        true,
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessViewed,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessClicked,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: false,
        },
      });
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockSetAccountName).not.toHaveBeenCalled();
      expect(mockEndFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenNthCalledWith(1, [{ id: mockFlowId }]);
      expect(mockEndFlow).toHaveBeenNthCalledWith(2, [{ id: mockFlowId }]);
    });

    it('handles account creation with skipping confirmation and without user defined name', async () => {
      const builder = createSnapKeyringBuilder();

      await builder().handleKeyringSnapMessage(mockSnapId, {
        method: 'notify:accountCreated',
        params: {
          account: mockAccount,
          displayConfirmation: false,
        },
      });

      expect(mockStartFlow).toHaveBeenCalledTimes(2);
      expect(mockAddRequest).toHaveBeenCalledTimes(1);
      expect(mockPersistKeyringHelper).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenNthCalledWith(1, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            // No user defined name
            snapSuggestedAccountName: '',
          },
        },
        true,
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: false,
        },
      });
      expect(mockSetAccountName).not.toHaveBeenCalled();
      expect(mockEndFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenNthCalledWith(1, [{ id: mockFlowId }]);
      expect(mockEndFlow).toHaveBeenNthCalledWith(2, [{ id: mockFlowId }]);
    });

    it('handles account creation with confirmations and with a user defined name', async () => {
      const mockNameSuggestion = 'new name';
      mockAddRequest.mockReturnValueOnce(true).mockReturnValueOnce({
        success: true,
        name: mockNameSuggestion,
      });
      const builder = createSnapKeyringBuilder();
      await builder().handleKeyringSnapMessage(mockSnapId, {
        method: 'notify:accountCreated',
        params: {
          account: mockAccount,
          displayConfirmation: true,
          accountNameSuggestion: mockNameSuggestion,
        },
      });

      expect(mockStartFlow).toHaveBeenCalledTimes(2);
      // First request for show account creation dialog
      // Second request for account name suggestion second
      expect(mockAddRequest).toHaveBeenCalledTimes(2);
      expect(mockAddRequest).toHaveBeenNthCalledWith(1, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      ]);
      expect(mockPersistKeyringHelper).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenNthCalledWith(2, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            snapSuggestedAccountName: mockNameSuggestion,
          },
        },
        true,
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessViewed,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessClicked,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: true,
        },
      });
      expect(mockSetAccountName).toHaveBeenCalledWith([
        mockAccount.id,
        mockNameSuggestion,
      ]);
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenNthCalledWith(1, [{ id: mockFlowId }]);
      expect(mockEndFlow).toHaveBeenNthCalledWith(2, [{ id: mockFlowId }]);
    });

    it('handles account creation with skipping confirmation and with user defined name', async () => {
      const mockNameSuggestion = 'suggested name';
      mockAddRequest.mockReturnValueOnce({
        success: true,
        name: mockNameSuggestion,
      });
      const builder = createSnapKeyringBuilder();
      await builder().handleKeyringSnapMessage(mockSnapId, {
        method: 'notify:accountCreated',
        params: {
          account: mockAccount,
          displayConfirmation: false,
          accountNameSuggestion: mockNameSuggestion,
        },
      });

      expect(mockStartFlow).toHaveBeenCalledTimes(2);
      expect(mockAddRequest).toHaveBeenCalledTimes(1);
      expect(mockPersistKeyringHelper).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenNthCalledWith(1, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            snapSuggestedAccountName: mockNameSuggestion,
          },
        },
        true,
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: true,
        },
      });
      expect(mockSetAccountName).toHaveBeenCalledTimes(1);
      expect(mockSetAccountName).toHaveBeenCalledWith([
        mockAccount.id,
        mockNameSuggestion,
      ]);
      expect(mockEndFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenNthCalledWith(1, [{ id: mockFlowId }]);
      expect(mockEndFlow).toHaveBeenNthCalledWith(2, [{ id: mockFlowId }]);
    });

    it('handles account creation with confirmations and with a user defined name', async () => {
      const mockNameSuggestion = 'new name';
      mockAddRequest.mockReturnValueOnce(true).mockReturnValueOnce({
        success: true,
        name: mockNameSuggestion,
      });
      const builder = createSnapKeyringBuilder();
      await builder().handleKeyringSnapMessage(mockSnapId, {
        method: 'notify:accountCreated',
        params: {
          account: mockAccount,
          displayConfirmation: true,
          accountNameSuggestion: mockNameSuggestion,
        },
      });

      expect(mockStartFlow).toHaveBeenCalledTimes(2);
      // First request for show account creation dialog
      // Second request for account name suggestion second
      expect(mockAddRequest).toHaveBeenCalledTimes(2);
      expect(mockAddRequest).toHaveBeenNthCalledWith(1, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      ]);
      expect(mockPersistKeyringHelper).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenNthCalledWith(2, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            snapSuggestedAccountName: mockNameSuggestion,
          },
        },
        true,
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessViewed,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessClicked,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'snap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: mockSnapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: mockSnapName,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: true,
        },
      });
      expect(mockSetAccountName).toHaveBeenCalledTimes(1);
      expect(mockSetAccountName).toHaveBeenCalledWith([
        mockAccount.id,
        mockNameSuggestion,
      ]);
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenNthCalledWith(1, [{ id: mockFlowId }]);
      expect(mockEndFlow).toHaveBeenNthCalledWith(2, [{ id: mockFlowId }]);
    });

    it('ends approval flow on error', async () => {
      const consoleSpy = jest.spyOn(console, 'error');

      const errorMessage = 'save error';
      mockPersistKeyringHelper.mockRejectedValue(new Error(errorMessage));
      mockSnapControllerHandleRequest.mockImplementation((params) => {
        expect(params).toStrictEqual([
          {
            snapId: mockSnapId,
            origin: 'metamask',
            handler: 'onKeyringRequest',
            request: {
              jsonrpc: '2.0',
              id: expect.any(String),
              method: KeyringRpcMethod.DeleteAccount,
              params: {
                id: mockAccount.id,
              },
            },
          },
        ]);

        // We must return `null` when removing an account.
        return null;
      });
      const builder = createSnapKeyringBuilder();
      await builder().handleKeyringSnapMessage(mockSnapId, {
        method: 'notify:accountCreated',
        params: {
          account: mockAccount,
          displayConfirmation: true,
        },
      });

      // ! This no longer throws an error, but instead, we log it. Since this part
      // ! of the flow is not awaited, so we await for it explicitly here:
      await waitForAllPromises();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error occurred while creating snap account:',
        errorMessage,
      );

      expect(mockStartFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenCalledTimes(2);
      expect(mockEndFlow).toHaveBeenNthCalledWith(1, [{ id: mockFlowId }]);
      expect(mockEndFlow).toHaveBeenNthCalledWith(2, [{ id: mockFlowId }]);
    });
  });
});
