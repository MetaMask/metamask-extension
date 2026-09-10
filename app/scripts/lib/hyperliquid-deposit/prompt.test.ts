import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../../shared/constants/app';
import { showHyperliquidDepositPromptApproval } from './prompt';

describe('showHyperliquidDepositPromptApproval', () => {
  const origin = 'https://app.hyperliquid.xyz';
  const selectedAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  const createApprovalController = () => ({
    add: jest.fn().mockResolvedValue(undefined),
    addAndShowApprovalRequest: jest.fn().mockResolvedValue(undefined),
    hasRequest: jest.fn().mockReturnValue(false),
  });

  it('adds and shows a Hyperliquid deposit prompt approval', async () => {
    const approvalController = createApprovalController();

    await showHyperliquidDepositPromptApproval({
      approvalController,
      origin,
      selectedAddress,
    });

    expect(approvalController.hasRequest).toHaveBeenCalledWith({
      origin,
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    });
    expect(approvalController.addAndShowApprovalRequest).toHaveBeenCalledWith({
      origin,
      requestData: { selectedAddress },
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    });
  });

  it('does not add another prompt if one is already pending', async () => {
    const approvalController = createApprovalController();
    approvalController.hasRequest.mockReturnValue(true);

    await showHyperliquidDepositPromptApproval({
      approvalController,
      origin,
      selectedAddress,
    });

    expect(approvalController.addAndShowApprovalRequest).not.toHaveBeenCalled();
    expect(approvalController.add).not.toHaveBeenCalled();
  });

  it('silently handles rejection when user dismisses the prompt', async () => {
    const approvalController = createApprovalController();
    approvalController.addAndShowApprovalRequest.mockRejectedValue(
      new Error('User rejected'),
    );

    await expect(
      showHyperliquidDepositPromptApproval({
        approvalController,
        origin,
        selectedAddress,
      }),
    ).resolves.toBeUndefined();
  });

  describe('requestOpenPopup', () => {
    it('uses add() instead of addAndShowApprovalRequest() when popup opens successfully', async () => {
      const approvalController = createApprovalController();
      const requestOpenPopup = jest.fn().mockResolvedValue(true);

      await showHyperliquidDepositPromptApproval({
        approvalController,
        origin,
        selectedAddress,
        requestOpenPopup,
      });

      expect(requestOpenPopup).toHaveBeenCalledWith({ tabId: undefined });
      expect(approvalController.add).toHaveBeenCalledWith({
        origin,
        requestData: { selectedAddress },
        type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
      });
      expect(
        approvalController.addAndShowApprovalRequest,
      ).not.toHaveBeenCalled();
    });

    it('passes tabId to requestOpenPopup when provided', async () => {
      const approvalController = createApprovalController();
      const requestOpenPopup = jest.fn().mockResolvedValue(true);

      await showHyperliquidDepositPromptApproval({
        approvalController,
        origin,
        selectedAddress,
        tabId: 123,
        requestOpenPopup,
      });

      expect(requestOpenPopup).toHaveBeenCalledWith({ tabId: 123 });
    });

    it('falls back to addAndShowApprovalRequest() when popup fails to open', async () => {
      const approvalController = createApprovalController();
      const requestOpenPopup = jest.fn().mockResolvedValue(false);

      await showHyperliquidDepositPromptApproval({
        approvalController,
        origin,
        selectedAddress,
        requestOpenPopup,
      });

      expect(requestOpenPopup).toHaveBeenCalled();
      expect(approvalController.add).not.toHaveBeenCalled();
      expect(approvalController.addAndShowApprovalRequest).toHaveBeenCalledWith(
        {
          origin,
          requestData: { selectedAddress },
          type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
        },
      );
    });

    it('falls back to addAndShowApprovalRequest() when requestOpenPopup throws', async () => {
      const approvalController = createApprovalController();
      const requestOpenPopup = jest
        .fn()
        .mockRejectedValue(new Error('Popup error'));

      await showHyperliquidDepositPromptApproval({
        approvalController,
        origin,
        selectedAddress,
        requestOpenPopup,
      });

      expect(requestOpenPopup).toHaveBeenCalled();
      expect(approvalController.add).not.toHaveBeenCalled();
      expect(approvalController.addAndShowApprovalRequest).toHaveBeenCalledWith(
        {
          origin,
          requestData: { selectedAddress },
          type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
        },
      );
    });

    it('silently handles rejection when add() fails after popup opens', async () => {
      const approvalController = createApprovalController();
      approvalController.add.mockRejectedValue(new Error('Add failed'));
      const requestOpenPopup = jest.fn().mockResolvedValue(true);

      await expect(
        showHyperliquidDepositPromptApproval({
          approvalController,
          origin,
          selectedAddress,
          requestOpenPopup,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
