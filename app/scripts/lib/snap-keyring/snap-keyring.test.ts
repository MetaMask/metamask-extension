import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import {
  showAccountCreationDialog,
  showAccountNameSuggestionDialog,
} from './snap-keyring';
import { SnapKeyringBuilderMessenger } from './types';

const controllerMessenger: jest.Mocked<SnapKeyringBuilderMessenger> = {
  call: jest.fn(),
} as unknown as jest.Mocked<SnapKeyringBuilderMessenger>;
const mockSnapId = 'snapId';
const mockAddAccountApprovalId = '123';
const mockAccountNameApprovalId = '456';
const address = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';
const accountNameSuggestion = 'Suggested Account Name';

describe('Snap Keyring Methods', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('showAccountCreationDialog', () => {
    it('shows account creation dialog and return true on user confirmation', async () => {
      controllerMessenger.call
        .mockImplementationOnce(() => ({ id: mockAddAccountApprovalId })) // For startFlow
        .mockResolvedValueOnce(true); // For addRequest

      const result = await showAccountCreationDialog(
        mockSnapId,
        controllerMessenger,
      );

      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        1,
        'ApprovalController:startFlow',
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        2,
        'ApprovalController:addRequest',
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        3,
        'ApprovalController:endFlow',
        { id: mockAddAccountApprovalId },
      );

      expect(result).toBe(true);
    });

    it('handles errors and ends the flow', async () => {
      controllerMessenger.call
        .mockImplementationOnce(() => ({ id: mockAddAccountApprovalId })) // For startFlow
        .mockRejectedValueOnce(new Error('Test error')); // For addRequest

      await expect(
        showAccountCreationDialog(mockSnapId, controllerMessenger),
      ).rejects.toThrow(
        'Error occurred while showing account creation dialog.\nError: Test error',
      );

      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        1,
        'ApprovalController:startFlow',
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        2,
        'ApprovalController:addRequest',
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        3,
        'ApprovalController:endFlow',
        { id: mockAddAccountApprovalId },
      );
    });
  });

  describe('showAccountNameSuggestionDialog', () => {
    it('shows account name suggestion dialog and return true on user confirmation', async () => {
      controllerMessenger.call
        .mockImplementationOnce(() => ({ id: mockAccountNameApprovalId })) // For startFlow
        .mockResolvedValueOnce(true); // For addRequest

      const result = await showAccountNameSuggestionDialog(
        mockSnapId,
        address,
        controllerMessenger,
        accountNameSuggestion,
      );

      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        1,
        'ApprovalController:startFlow',
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        2,
        'ApprovalController:addRequest',
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            address,
            snapSuggestedAccountName: accountNameSuggestion,
          },
        },
        true,
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        3,
        'ApprovalController:endFlow',
        { id: mockAccountNameApprovalId },
      );

      expect(result).toBe(true);
    });

    it('handles errors and ends the flow', async () => {
      controllerMessenger.call
        .mockImplementationOnce(() => ({ id: mockAccountNameApprovalId })) // For startFlow
        .mockRejectedValueOnce(new Error('Test error')); // For addRequest

      await expect(
        showAccountNameSuggestionDialog(
          mockSnapId,
          address,
          controllerMessenger,
          accountNameSuggestion,
        ),
      ).rejects.toThrow(
        'Error occurred while showing name account dialog.\nError: Test error',
      );

      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        1,
        'ApprovalController:startFlow',
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        2,
        'ApprovalController:addRequest',
        {
          origin: mockSnapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
          requestData: {
            address,
            snapSuggestedAccountName: accountNameSuggestion,
          },
        },
        true,
      );
      expect(controllerMessenger.call).toHaveBeenNthCalledWith(
        3,
        'ApprovalController:endFlow',
        { id: mockAccountNameApprovalId },
      );
    });
  });
});
