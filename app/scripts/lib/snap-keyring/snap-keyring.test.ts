import { ControllerMessenger } from '@metamask/base-controller';
import { EthAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
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
const mockSnapId = 'snapId';
const mockSnapName = 'mock-snap';
const mockSnapController = jest.fn();
const mockPersisKeyringHelper = jest.fn();
const mockSetSelectedAccount = jest.fn();
const mockSetAccountName = jest.fn();
const mockRemoveAccountHelper = jest.fn();
const mockTrackEvent = jest.fn();
const mockGetAccountByAddress = jest.fn();

const mockFlowId = '123';
const address = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';
const accountNameSuggestion = 'Suggested Account Name';
const mockAccount = {
  type: EthAccountType.Eoa,
  id: '3afa663e-0600-4d93-868a-61c2e553013b',
  address,
  methods: [],
  scopes: ['eip155'],
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

const createControllerMessenger = ({
  account = mockInternalAccount,
}: {
  account?: InternalAccount;
} = {}): SnapKeyringBuilderMessenger => {
  const messenger = new ControllerMessenger<
    SnapKeyringBuilderAllowActions,
    never
  >().getRestricted({
    name: 'SnapKeyringBuilder',
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
    ],
    allowedEvents: [],
  });

  jest.spyOn(messenger, 'call').mockImplementation((...args) => {
    // This mock implementation does not have a nice discriminate union where types/parameters can be correctly inferred
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
  isSnapPreinstalled = true,
}: {
  snapName?: string;
  isSnapPreinstalled?: boolean;
} = {}) => {
  return snapKeyringBuilder(
    createControllerMessenger(),
    mockSnapController,
    mockPersisKeyringHelper,
    mockRemoveAccountHelper,
    mockTrackEvent,
    () => snapName,
    () => isSnapPreinstalled,
  );
};

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

      expect(mockStartFlow).toHaveBeenCalledTimes(1);
      // First request for show account creation dialog
      // Second request for account name suggestion dialog
      expect(mockAddRequest).toHaveBeenCalledTimes(2);
      expect(mockAddRequest).toHaveBeenNthCalledWith(1, [
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      ]);
      // First call is from addAccount after user confirmation
      // Second call is from within the SnapKeyring after ending the addAccount flow
      expect(mockPersisKeyringHelper).toHaveBeenCalledTimes(2);
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
      expect(mockGetAccountByAddress).toHaveBeenCalledTimes(1);
      expect(mockGetAccountByAddress).toHaveBeenCalledWith([
        mockAccount.address.toLowerCase(),
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessViewed,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessClicked,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockSetAccountName).not.toHaveBeenCalled();
      expect(mockEndFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledWith([{ id: mockFlowId }]);
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

      expect(mockStartFlow).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenCalledTimes(1);
      // First call is from addAccount after user confirmation
      // Second call is from within the SnapKeyring after ending the addAccount flow
      expect(mockPersisKeyringHelper).toHaveBeenCalledTimes(2);
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
      expect(mockGetAccountByAddress).toHaveBeenCalledTimes(1);
      expect(mockGetAccountByAddress).toHaveBeenCalledWith([
        mockAccount.address.toLowerCase(),
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockSetAccountName).not.toHaveBeenCalled();
      expect(mockEndFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledWith([{ id: mockFlowId }]);
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

      expect(mockStartFlow).toHaveBeenCalledTimes(1);
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
      // First call is from addAccount after user confirmation
      // Second call is from within the SnapKeyring
      expect(mockPersisKeyringHelper).toHaveBeenCalledTimes(2);
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
      expect(mockGetAccountByAddress).toHaveBeenCalledTimes(1);
      expect(mockGetAccountByAddress).toHaveBeenCalledWith([
        mockAccount.address.toLowerCase(),
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessViewed,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessClicked,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockSetAccountName).toHaveBeenCalledWith([
        mockAccount.id,
        mockNameSuggestion,
      ]);
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledWith([{ id: mockFlowId }]);
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

      expect(mockStartFlow).toHaveBeenCalledTimes(1);
      expect(mockAddRequest).toHaveBeenCalledTimes(1);
      // First call is from addAccount after user confirmation
      // Second call is from within the SnapKeyring after ending the addAccount flow
      expect(mockPersisKeyringHelper).toHaveBeenCalledTimes(2);
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
      expect(mockGetAccountByAddress).toHaveBeenCalledTimes(1);
      expect(mockGetAccountByAddress).toHaveBeenCalledWith([
        mockAccount.address.toLowerCase(),
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockSetAccountName).toHaveBeenCalledTimes(1);
      expect(mockSetAccountName).toHaveBeenCalledWith([
        mockAccount.id,
        mockNameSuggestion,
      ]);
      expect(mockEndFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledWith([{ id: mockFlowId }]);
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

      expect(mockStartFlow).toHaveBeenCalledTimes(1);
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
      // First call is from addAccount after user confirmation
      // Second call is from within the SnapKeyring
      expect(mockPersisKeyringHelper).toHaveBeenCalledTimes(2);
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
      expect(mockGetAccountByAddress).toHaveBeenCalledTimes(1);
      expect(mockGetAccountByAddress).toHaveBeenCalledWith([
        mockAccount.address.toLowerCase(),
      ]);
      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessViewed,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AddSnapAccountSuccessClicked,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          account_type: 'snap',
          snap_id: mockSnapId,
          snap_name: mockSnapName,
        },
      });
      expect(mockSetAccountName).toHaveBeenCalledTimes(1);
      expect(mockSetAccountName).toHaveBeenCalledWith([
        mockAccount.id,
        mockNameSuggestion,
      ]);
      expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledWith([{ id: mockFlowId }]);
    });

    it('ends approval flow on error', async () => {
      const errorMessage = 'save error';
      mockPersisKeyringHelper.mockRejectedValue(new Error(errorMessage));
      const builder = createSnapKeyringBuilder();
      await expect(
        builder().handleKeyringSnapMessage(mockSnapId, {
          method: 'notify:accountCreated',
          params: {
            account: mockAccount,
            displayConfirmation: true,
          },
        }),
      ).rejects.toThrow(
        `Error occurred while creating snap account: ${errorMessage}`,
      );
      expect(mockStartFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledTimes(1);
      expect(mockEndFlow).toHaveBeenCalledWith([{ id: mockFlowId }]);
    });
  });
});
